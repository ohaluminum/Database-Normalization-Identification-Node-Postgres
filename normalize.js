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
async function checkPK(table, pk, sqlStream) {

	try {

		// Build the SELECT statement query.
		let query = `SELECT ${pk}, COUNT(*) \nFROM ${table} \nGROUP BY ${pk} \nHAVING COUNT(*) > 1;\n\n`;

		sqlStream.write(query);

		// Get result after running the query
		const res = await pool.query(query);

		if (res.rows.length == 0) {
			console.log("Given PK is valid.");
			return true;
		}
		else {
			console.log("Given PK is invalid.");
			return false;
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check for the simple CKs in the table.
async function checkCK(table, column, sqlStream) {

	try {

		let CK = [];

		for (let icol = 0; icol < column.length; icol++) {

			let query = `SELECT ${column[icol]}, COUNT(*) \nFROM ${table} \nGROUP BY ${column[icol]} \nHAVING COUNT(*) > 1;\n\n`;

			sqlStream.write(query);

			// Get result after running the query
			const res = await pool.query(query);

			if (res.rows.length == 0) {
				CK.push(column[icol]);
			}
		}

		return CK;
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check for the non-key attributes in the table.
async function checkNonKey(COLUMN, CK) {
	try {

		let nonKey = [];

		for (let icol = 0; icol < COLUMN.length; icol++) {

			let isCK = false;

			for (let ick = 0; ick < CK.length; ick++) {

				if (COLUMN[icol] == CK[ick]) {
					isCK = true;
					break;
				}
			}

			// Add the attribute to the non-key list if it isn't CK.
			if (!isCK) {
				nonKey.push(COLUMN[icol]);
			}
		}

		return nonKey;
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given table meet the requirement of 1NF.
async function check1NF(table, pk, column, sqlStream) {

	try {

		// Build the SELECT statement query.
		let query = `SELECT ${pk},${column}, COUNT(*) \nFROM ${table} \nGROUP BY ${pk},${column} \nHAVING COUNT(*) > 1;\n\n`;

		sqlStream.write(query);

		// Get result after running the query
		const res = await pool.query(query);

		if (res.rows.length == 0) {
			console.log('Meet the requirement for 1NF.');
			return true;
		}
		else {
			console.log('Fail the requirement for 1NF.');
			return false;
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given table meet the requirement of 2NF.
async function check2NF(table, pk, column, sqlStream) {

	try {

		// Check the number of PK.
		if (pk.length == 1) {

			// If the table has simple PK, it automatically in 2NF.
			console.log('Meet the requirement for 2NF.');
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
						return false;
					}
				}
			}

			console.log('Meet the requirement for 2NF.');
			return true;
		}


	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given table meet the requirement of 3NF.
async function check3NF(table, nonKey, sqlStream) {

	try {

		// Check the number of non-key column.
		if (nonKey.length <= 1) {

			// If the table has only (or less than) one non-key attribute, it automatically in 3NF.
			console.log('Meet the requirement for 3NF.');
			return true;
		}
		else {

			// If the table has more than one non-key attribute, then should check if exist transitive dependency.
			for (let icol1 = 0; icol1 < nonKey.length; icol1++) {
				for (let icol2 = 0; icol2 < nonKey.length; icol2++) {

					// Skip if two column indexs are the same.
					if (icol1 == icol2) {
						continue;
					}

					let query = `SELECT ${nonKey[icol1]}, COUNT(DISTINCT ${nonKey[icol2]}) \nFROM ${table} \nGROUP BY ${nonKey[icol1]} \nHAVING COUNT(DISTINCT ${nonKey[icol2]}) > 1;\n\n`;

					sqlStream.write(query);

					// Get result after running the query.
					let res = await pool.query(query);

					// Transitive dependency exist.
					if (res.rows.length == 0) {

						console.log('Fail the requirement for 3NF: Detect transitive dependency.');
						return false;
					}
				}
			}

			console.log('Meet the requirement for 3NF.');
			return true;
		}
	}
	catch (err) {
		console.log(err.stack);
	}
}


// Function to check if the given table meet the requirement of BCNF.
async function checkBCNF(table, pk, nonKey, sqlStream) {

	try {

		// Check if exist non-key -> PK dependency.
		for (let icol = 0; icol < nonKey.length; icol++) {
			for (let ipk = 0; ipk < pk.length; ipk++) {

				let query = `SELECT ${nonKey[icol]}, COUNT(DISTINCT ${pk[ipk]}) \nFROM ${table} \nGROUP BY ${nonKey[icol]} \nHAVING COUNT(DISTINCT ${pk[ipk]}) > 1;\n\n`;

				sqlStream.write(query);

				// Get result after running the query.
				let res = await pool.query(query);

				// Non-key -> PK dependency exist.
				if (res.rows.length == 0) {

					console.log('Fail the requirement for BCNF: Detect non-key -> PK dependency.');
					return false;
				}
			}
		}

		console.log('Meet the requirement for BCNF.');
		return true;
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

		// Check for candidate keys
		const CK = await checkCK(TABLE, COLUMN, SQLSTREAM);
		console.log("CK: " + CK);

		// Check for non-key attributes.
		const NONKEY = await checkNonKey(COLUMN, CK);
		console.log("NON-KEY: " + NONKEY);

		// Check if the provided PK is valid PK.
		let isValidPK = await checkPK(TABLE, PK, SQLSTREAM);

		if (!isValidPK) {

			// Continue to check if it meet 1NF level even though with invalid PK. 
			let is1NF = await check1NF(TABLE, PK, COLUMN, SQLSTREAM);

			if (is1NF) {
				TEXTSTREAM.write("PK   N\n1NF  Y\n2NF  N\n3NF  N\nBCNF N");
			}
			else {
				TEXTSTREAM.write("PK   N\n1NF  N\n2NF  N\n3NF  N\nBCNF N");
			}

			// No need for further checking since the PK is invalid.
			process.exit();
		}
		else {

			let is1NF = await check1NF(TABLE, PK, COLUMN, SQLSTREAM);

			if (is1NF) {

				let is2NF = await check2NF(TABLE, PK, COLUMN, SQLSTREAM);

				if (is2NF) {

					let is3NF = await check3NF(TABLE, NONKEY, SQLSTREAM);

					if (is3NF) {

						let isBCNF = await checkBCNF(TABLE, PK, NONKEY, SQLSTREAM);

						if (isBCNF) {
							TEXTSTREAM.write("PK   Y\n1NF  Y\n2NF  Y\n3NF  Y\nBCNF Y");
						}
						else {
							TEXTSTREAM.write("PK   Y\n1NF  Y\n2NF  Y\n3NF  Y\nBCNF N");
						}

						// No need for further checking.
						process.exit();
					}
					else {
						TEXTSTREAM.write("PK   Y\n1NF  Y\n2NF  Y\n3NF  N\nBCNF N");
						process.exit();
					}
				}
				else {
					TEXTSTREAM.write("PK   Y\n1NF  Y\n2NF  N\n3NF  N\nBCNF N");
					process.exit();
				}
			}
			else {
				TEXTSTREAM.write("PK   Y\n1NF  N\n2NF  N\n3NF  N\nBCNF N");
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