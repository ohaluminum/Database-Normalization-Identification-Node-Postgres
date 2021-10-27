const { Pool } = require('pg');
const fs = require('fs');
const creds = require('./creds.json');

const TEXTFILE = "nf.txt";
const SQLFILE = "nf.sql";


// Getting credential and setting up the pool
const pool = new Pool({
	host: creds.host,
	user: creds.user,
	password: creds.password,
	port: creds.port,
	database: creds.database
});


// Function to append information to the file stream.
function openFile(filename) {
	try {
		// Delete the file if exist.
		if (fs.existsSync(filename)) {
			fs.unlink(filename, function (err) { if (err) { console.log(err); } });
			fs.writeFile(filename, "", function (err) { if (err) { console.log(err); } });
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to read and return the parameter list from the user input.
function readParam() {
	try {

		// Check if the parameters are given.
		if (process.argv.length == 2) {

			// End program.
			console.log("Error: No parameters provided. ");
			process.exit();
		}
		else {
			let params = process.argv[2];
			let kv = params.split(";");

			// Check the number of parameter pairs.
			if (kv.length != 3) {
				console.log("Error: Invalid input.");
				process.exit();
			}

			let values = [];
			for (let i = 0; i < kv.length; i++) {
				// In the key-value pair, the value stored at the second location.
				let value = kv[i].split("=")[1];

				// Split and store the value in the array if needed (e.g., composite PK) 
				if (value.includes(",")) {
					value = value.split(",");
				}
				else {
					value = [value];
				}

				values[i] = value;
			}

			return values;
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given table exist in the schema.
async function tableExist(table, sqlStream) {

	try {

		// Build the SELECT statement query.
		let query = `SELECT table_name \nFROM information_schema.tables \nWHERE table_name = '${table}';\n\n`;

		sqlStream.write(query);

		// Get result after running the query
		const res = await pool.query(query);

		if (res.rows.length == 0) {

			// End program.
			console.log("Error: Inputted table name does not exist in the database.");
			process.exit();
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given PKs exist in the table.
async function pkExist(table, pk, sqlStream) {

	try {

		for (let ipk = 0; ipk < pk.length; ipk++) {

			// Build the SELECT statement query.
			let query = `SELECT column_name \nFROM information_schema.columns \nWHERE table_name = '${table}' \nAND column_name = '${pk[ipk]}';\n\n`;

			sqlStream.write(query);

			// Get result after running the query
			const res = await pool.query(query);

			if (res.rows.length == 0) {

				// End program.
				console.log("Error: Inputted PK name does not exist in the table.");
				process.exit();
			}
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given columns exist in the table.
async function columnExist(table, column, sqlStream) {

	try {

		for (let icol = 0; icol < column.length; icol++) {

			// Build the SELECT statement query.
			let query = `SELECT column_name \nFROM information_schema.columns \nWHERE table_name = '${table}' \nAND column_name = '${column[icol]}';\n\n`;

			sqlStream.write(query);

			// Get result after running the query
			const res = await pool.query(query);

			if (res.rows.length == 0) {

				// End program.
				console.log("Error: Inputted column name does not exist in the table.");
				process.exit();
			}
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given PKs are invalid.
async function checkPK(table, pk, textStream, sqlStream) {

	try {

		// Build the SELECT statement query.
		let query = `SELECT ${pk}, COUNT(*) \nFROM ${table} \nGROUP BY ${pk} \nHAVING COUNT(*) > 1;\n\n`;

		sqlStream.write(query);

		// Get result after running the query
		const res = await pool.query(query);

		if (res.rows.length == 0) {
			console.log("Given PK is valid.");
			textStream.write("PK\t\tY\n");
			return true;
		}
		else {
			console.log("Given PK is invalid.");
			textStream.write("PK\t\tN\n");
			return false;
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given PKs are invalid.
async function checkCK(table, pk, textStream, sqlStream) {


}


// Function to check if the given table meet the requirement of 1NF.
async function check1NF(table, pk, column, validPK, textStream, sqlStream) {

	try {

		// Build the SELECT statement query.
		let query = `SELECT ${pk},${column}, COUNT(*) \nFROM ${table} \nGROUP BY ${pk},${column} \nHAVING COUNT(*) > 1;\n\n`;

		sqlStream.write(query);

		// Get result after running the query
		const res = await pool.query(query);

		if (res.rows.length == 0) {
			console.log('Meet the requirement for 1NF.');

			if (validPK) {
				textStream.write("1NF\t\tY\n");
			}
			else {
				textStream.write("1NF\t\tY\n2NF\t\tN\n3NF\t\tN\nBCNF\tN");
			}

			return true;
		}
		else {
			console.log('Fail the requirement for 1NF.');
			textStream.write("1NF\t\tN\n2NF\t\tN\n3NF\t\tN\nBCNF\tN");
			return false;
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given table meet the requirement of 2NF.
async function check2NF(table, pk, column, textStream, sqlStream) {

	try {

		// Check the number of PK.
		if (pk.length == 1) {

			// If the table has simple PK, it automatically in 2NF.
			console.log('Meet the requirement for 2NF.');
			textStream.write("2NF\t\tY\n");
			return true;
		}
		else {

			// If the table has composite PK, then should check if exist partial dependency.
			for (let ipk = 0; ipk < pk.length; ipk++) {
				for (let icol = 0; icol < column.length; icol++) {

					let query = `SELECT ${pk[ipk]}, COUNT(DISTINCT ${column[icol]}) \nFROM ${table} \nGROUP BY ${pk[ipk]} \nHAVING COUNT(DISTINCT ${column[icol]}) > 1;\n\n`;

					sqlStream.write(query);

					// Get result after running the query.
					let res = await pool.query(query);

					// Partial dependency exist
					if (res.rows.length == 0) {

						console.log('Fail the requirement for 2NF: Detect partial dependency.');
						textStream.write("2NF\t\tN\n3NF\t\tN\nBCNF\tN");
						return false;
					}
				}
			}

			console.log('Meet the requirement for 2NF.');
			textStream.write("2NF\t\tY\n");
			return true;
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given table meet the requirement of 3NF.
async function check3NF(table, pk, column, textStream, sqlStream) {

	try {

		// Check the number of non-key column.
		if (column.length == 1) {

			// If the table has only one non-key attribute, it automatically in 3NF.
			console.log('Meet the requirement for 3NF.');
			textStream.write("3NF\t\tY\n");
			return true;
		}
		else {

			// If the table has more than one non-key attribute, then should check if exist transitive dependency.
			for (let icol1 = 0; icol1 < column.length; icol1++) {
				for (let icol2 = 0; icol2 < column.length; icol2++) {

					// Skip if two column indexs are the same.
					if (icol1 == icol2) {
						continue;
					}

					let query = `SELECT ${column[icol1]}, COUNT(DISTINCT ${column[icol2]}) \nFROM ${table} \nGROUP BY ${column[icol1]} \nHAVING COUNT(DISTINCT ${column[icol2]}) > 1;\n\n`;

					sqlStream.write(query);

					// Get result after running the query.
					let res = await pool.query(query);

					// Transitive dependency exist.
					if (res.rows.length == 0) {

						console.log('Fail the requirement for 3NF: Detect transitive dependency.');
						textStream.write("3NF\t\tN\nBCNF\tN");
						return false;
					}
				}
			}

			console.log('Meet the requirement for 3NF.');
			textStream.write("3NF\t\tY\n");
			return true;
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given table meet the requirement of BCNF.
async function checkBCNF(table, pk, column, textStream, sqlStream) {

	try {

		// Check the number of PK.
		if (pk.length == 1) {

			// If the table has simple PK, it automatically in BCNF.
			console.log('Meet the requirement for BCNF.');
			textStream.write("BCNF\tY");
			return;
		}
		else if (pk.length == 2) {

			// If the table has composite PK, then should check if exist non-key -> PK dependency.
			for (let icol = 0; icol < column.length; icol++) {
				for (let ipk = 0; ipk < pk.length; ipk++) {

					let query = `SELECT ${column[icol]}, COUNT(DISTINCT ${pk[ipk]}) \nFROM ${table} \nGROUP BY ${column[icol]} \nHAVING COUNT(DISTINCT ${pk[ipk]}) > 1;\n\n`;

					sqlStream.write(query);

					// Get result after running the query.
					let res = await pool.query(query);

					// Non-key -> PK dependency exist.
					if (res.rows.length == 0) {

						console.log('Fail the requirement for BCNF: Detect non-key -> PK dependency.');
						textStream.write("BCNF\tN");
						return;
					}
				}
			}

			console.log('Meet the requirement for BCNF.');
			textStream.write("BCNF\tY");
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


async function main() {

	try {

		// Read parameters from user input.
		const PARAM = readParam();
		const TABLE = PARAM[0];
		const PK = PARAM[1];
		const COLUMN = PARAM[2];

		console.log("Table: " + TABLE);
		console.log("PK: " + PK);
		console.log("Column: " + COLUMN);

		// Setup connection.
		await pool.connect();
		console.log("Connection Successful.");

		// Setup file system
		openFile(TEXTFILE);
		openFile(SQLFILE);

		const TEXTSTREAM = fs.createWriteStream(TEXTFILE, { flags: 'a' });     // Flags a: Appending mode. 
		const SQLSTREAM = fs.createWriteStream(SQLFILE, { flags: 'a' });

		// Handling stream error
		TEXTSTREAM.on('error', (err) => console.log(err.stack));
		SQLSTREAM.on('error', (err) => console.log(err.stack));

		// Check for given table and column
		await tableExist(TABLE, SQLSTREAM);
		await pkExist(TABLE, PK, SQLSTREAM);
		await columnExist(TABLE, COLUMN, SQLSTREAM);

		// Check if the provided PK is valid PK.
		let isValidPK = await checkPK(TABLE, PK, TEXTSTREAM, SQLSTREAM);

		if (!isValidPK) {

			// Continue to check if it meet 1NF level even though with invalid PK. 
			await check1NF(TABLE, PK, COLUMN, isValidPK, TEXTSTREAM, SQLSTREAM);

			// No need for further checking since the PK is invalid.
			process.exit();
		}
		else {

			// Continue to check if it meet 1NF level. 
			let is1NF = await check1NF(TABLE, PK, COLUMN, isValidPK, TEXTSTREAM, SQLSTREAM);

			if (is1NF) {

				// Continue to check if it meet 2NF level. 
				let is2NF = await check2NF(TABLE, PK, COLUMN, TEXTSTREAM, SQLSTREAM);

				if (is2NF) {

					// Continue to check if it meet 3NF level. 
					let is3NF = await check3NF(TABLE, PK, COLUMN, TEXTSTREAM, SQLSTREAM);

					if (is3NF) {

						// Continue to check if it meet BCNF level. 
						await checkBCNF(TABLE, PK, COLUMN, TEXTSTREAM, SQLSTREAM);

						// No need for further checking.
						process.exit();
					}
					else {
						process.exit();
					}
				}
				else {
					process.exit();
				}
			}
			else {
				process.exit();
			}
		}
	}
	catch (e) {
		console.error(e);
		console.error("Connection failed.");
	}
	finally {
		await pool.end();
		TEXTSTREAM.end();
		SQLSTREAM.end();
		console.log("Connection closed.");
	}
}

main()

// CheckCandidate(): candidate key is any column which is not part of the primary/composite key and contains all unique elements
// For FD's not involving the PK there must exist at least two repetitions？ what does he mean by two repetitions?