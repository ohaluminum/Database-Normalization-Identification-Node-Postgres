#### Lejing Huang (ID: 1810009)



--------------------- Ignore everything below ---------------------------

#### Example 1 - hw2_invalidpk_1nf;: k is not valid PK because it is not unique.

 i | k | a 
---+---+---
 1 | 1 | 1
 2 | 1 | 2
 4 | 2 | 2
 3 | 2 | 1

SELECT COUNT(*)
FROM hw2_invalidpk_1nf;

-- Output: 
count
-----+
4

SELECT k, COUNT(*) 
FROM hw2_invalidpk_1nf 
GROUP BY k
HAVING COUNT(*) > 1;

-- Output:
 k | count
---+-------
 2 | 2
 1 | 2 

If any count > 1, the PK is not valid.

SELECT k, a, COUNT(*) 
FROM hw2_invalidpk_1nf 
GROUP BY k, a
HAVING COUNT(*) > 1;

-- Output:
 k | a | count 
---+---+-------

No record found! Meet the requirement for 1NF.


#### Eample 2 - hw2_1nf_not2nf: there is partical dependency exist in the table (FD k2 -> a valid).

 k1 | k2 | a | b 
----+----+---+---
  0 |  0 | B | B
  0 |  1 | A | C
  1 |  0 | B | D
  1 |  1 | A | D
  2 |  1 | A | C
  3 |  0 | B | C

If want to check 1NF first:

SELECT k1, k2, COUNT(*) 
FROM public.hw2_1nf_not2nf 
GROUP BY k1, k2
HAVING COUNT(*) > 1;

Then check for 2NF:

SELECT k1, COUNT(DISTINCT a) 
FROM hw2_1nf_not2nf 
GROUP BY k1
HAVING COUNT(DISTINCT a) > 1;

-- Output:
 k1 | count 
----+-------
  0 |     2
  1 |     2

SELECT k1, COUNT(DISTINCT b) 
FROM hw2_1nf_not2nf 
GROUP BY k1
HAVING COUNT(DISTINCT b) > 1;

-- Output:
 k1 | count 
----+-------
  0 |     2
  1 |     1
  2 |     1
  3 |     1

SELECT k2, COUNT(DISTINCT a) 
FROM hw2_1nf_not2nf 
GROUP BY k2
HAVING COUNT(DISTINCT a) > 1;

-- Output:
 k2 | count 
----+-------
  0 |     1
  1 |     1

SELECT k2, COUNT(DISTINCT b) 
FROM hw2_1nf_not2nf 
GROUP BY k2
HAVING COUNT(DISTINCT b) > 1;

-- Output:
 k2 | count 
----+-------
  0 |     3
  1 |     2

For each check, if all count = 1, there is partical dependency exist in the table.

After decomposion, T1 and T2 will be:

k1 | k2 | b 
----+----+---
  0 |  0 | B
  0 |  1 | C
  1 |  0 | D
  1 |  1 | D
  2 |  1 | C
  3 |  0 | C

 k2 | a 
----+---
  0 | B
  1 | A


#### Example 3 - hw2_2nf_not3nf: there is transitive dependency exist in the table (FD b -> a valid)

 k | a | b 
---+---+---
 1 | A | B
 2 | B | C
 3 | D | E
 4 | D | A
 5 | D | A
 6 | A | D
 7 | A | B

How to check for transitive dependency between non-key (check dependency with any other column):

1 | 2 | 3 | 4

1 -> 2
1 -> 3
1 -> 4
2 -> 1
2 -> 3
2 -> 4
3 -> 1
3 -> 2
3 -> 4
4 -> 1
4 -> 2
4 -> 3

Step 1: FD a -> b is invalid because there are multiple values associated to some values (a -> many b).

SELECT a, COUNT(DISTINCT b) 
FROM hw2_2nf_not3nf
GROUP BY a
HAVING COUNT(DISTINCT b) > 1;

-- Output:
 a | count 
---+-------
 A |     2
 D |     2
 B |     1

If any count > 1, the FD is invalid (which is good so far because we don't detect any transitive dependency).

Step 2: FD b -> a is valid.

SELECT b, COUNT(DISTINCT a)
FROM hw2_2nf_not3nf
GROUP BY b
HAVING COUNT(DISTINCT a) > 1;

-- Output:
 b | count 
---+-------
 A |     1
 B |     1
 C |     1
 D |     1
 E |     1

If all count = 1, the FD is valid (detect transitive dependency).

After decomposion, T1 and T2 will be:

 k | b 
---+---
 1 | B
 2 | C
 3 | E
 4 | A
 5 | A
 6 | D
 7 | B

 b | a 
---+---
 A | D
 E | D
 B | A
 D | A
 C | B


#### Example 4 - hw2_3nf_notbcnf: there is no single FD non-key -> PK exist in the table. dependency exist in the table.

 k1 | k2 | a | b 
----+----+---+---
  1 |  1 | B | B
  1 |  2 | A | C
  1 |  3 | C | D
  2 |  1 | B | D
  2 |  2 | A | D
  3 |  2 | A | D
  4 |  1 | E | E
  4 |  2 | D | B
  5 |  2 | A | A
  5 |  1 | B | A

Step 1: FD a -> k1 is invalid because there are multiple values associated to some values (a -> many k1).

SELECT a, COUNT(DISTINCT k1)
FROM hw2_3nf_notbcnf
GROUP BY a
ORDER BY COUNT(DISTINCT k1) DESC;

-- Output:
 a | count 
---+-------
 A |     4
 B |     3
 C |     1
 D |     1
 E |     1

Step 2: FD a -> k2 is valid.

SELECT a, COUNT(DISTINCT k2)
FROM hw2_3nf_notbcnf
GROUP BY a
ORDER BY COUNT(DISTINCT k2) DESC;

-- Output:
 a | count 
---+-------
 A |     1
 B |     1
 C |     1
 D |     1
 E |     1

If all count = 1, the FD is valid (detect non-key -> PK dependency).

Step 3: FD b -> k1 is invalid because there are multiple values associated to some values (b -> many k1).

SELECT b, COUNT(DISTINCT k1)
FROM hw2_3nf_notbcnf
GROUP BY b
ORDER BY COUNT(DISTINCT k1) DESC;

-- Output:
 b | count 
---+-------
 D |     3
 B |     2
 A |     1
 C |     1
 E |     1

Step 4: FD b -> k2 is invalid because there are multiple values associated to some values (b -> many k2).

SELECT b, COUNT(DISTINCT k2)
FROM hw2_3nf_notbcnf
GROUP BY b
ORDER BY COUNT(DISTINCT k2) DESC;

-- Output:
 b | count 
---+-------
 D |     3
 A |     2
 B |     2
 C |     1
 E |     1


After decomposion, T1 and T2 will be:

 k1 | a | b 
----+---+---
  1 | B | B
  1 | A | C
  1 | C | D
  2 | B | D
  2 | A | D
  3 | A | D
  4 | E | E
  4 | D | B
  5 | A | A
  5 | B | A

 a | k2 
---+----
 D |  2
 E |  1
 C |  3
 B |  1
 A |  2


#### Steps:
1. PK Check - valid PK can uniquely define the record: see example 1.
1. 1NF - Create a basic JS program to tell if a table doesn't have repeat records: see example 1.
2. 2NF - Check simple PK (if the table has simple PK, it automatically in 2NF). 
3. 2NF - Check composite PKs (no partial dependency). 
4. 3NF - Check the number of non-key attribute (if only one non-key attribute, it automatically in 3NF).
5. 3NF - Check if any FD exist between non-key attributes.
6. BCNF - Check simple PK (if the table has simple PK, it automatically in BCNF).
7. BCNF - Check composite PKs (no FD non-key -> PK)
8. After you can tell if a table is in BCNF or not then do the decomposition (projections). 
9. Show Y/N for each of the four normal forms and show it in file nf.txt.


#### 1NF Rules:

1. Each table cell should contain a single value.
2. Each record needs to be unique.

#### 2NF Rules:

1. Need to meet requirement for 1NF.
2. The table is automatically in 2NF if and only if, the PK comprises a single attribute.
3. If the table has a composite PK, then each non-key attribute must be fully dependent on the entire PK and not on a subset of the PK (there must be no partial dependency).

#### 3NF Rules:

1. Need to meet requirement for 2NF.
2. The table is automatically in 3NF if and only if, there is only one non-key column.
3. If the table more than one nonkey column, then each non-key attribute cannot be fully dependent on the other non-key attribute (there must be no transitive dependency).

#### BCNF Rules:

1. Need to meet requirement for 3NF.
2. The table is automatically in 4NF (in most cases) if and only if, there is only one non-key column.
3. If the table has a composite PK, then cannot find a single FD with the non-key attribute on the left side, and part of the PKs on the right side.


#### Test Cases: 
public | hw2_1nf_2nf_1                 | table    | dba4 | *
public | hw2_1nf_2nf_2                 | table    | dba4 | *
public | hw2_1nf_difficult_1           | table    | dba4
public | hw2_1nf_difficult_2           | table    | dba2
public | hw2_1nf_difficult_2nf_1       | table    | dba4
public | hw2_1nf_difficult_2nf_2       | table    | dba4
public | hw2_1nf_difficult_2nf_2_3nf_1 | table    | dba4
public | hw2_1nf_difficult_2nf_2_3nf_2 | table    | dba4
public | hw2_1nf_not2nf                | table    | dba4 | *
public | hw2_2nf_3nf_1                 | table    | dba4 | *
public | hw2_2nf_3nf_2                 | table    | dba4 | *
public | hw2_2nf_bcnf_1                | table    | dba4 | *
public | hw2_2nf_bcnf_2                | table    | dba4 | *
public | hw2_2nf_not3nf                | table    | dba4 | *
public | hw2_3nf_bad_1                 | table    | dba4
public | hw2_3nf_bad_2                 | table    | dba4
public | hw2_3nf_bcnf_1                | table    | dba4 | *
public | hw2_3nf_bcnf_2                | table    | dba4 | *
public | hw2_3nf_notbcnf               | table    | dba4 | *
public | hw2_bcnf                      | table    | dba4 | *
public | hw2_bcnf_trivial              | table    | dba4
public | hw2_compositepk               | table    | dba4
public | hw2_difficult                 | table    | dba4 | *
public | hw2_invalidpk_1nf             | table    | dba4 | *
public | hw2_null                      | table    | dba4 | *
public | hw2_pkbad_1                   | table    | dba4 | *
public | hw2_pkbad_2                   | table    | dba4 | *


#### Stop Conditions:

- Invalid input on the command line makes the the program stop completely (maybe only one test case).

SELECT column_name 
FROM information_schema.columns 
WHERE table_name='hw2_difficult' and column_name='g';


#### Test Cases (difficult):

SELECT * FROM hw2_difficult;

 i | k1 | k2 | a | b | c | d | e | f 
---+----+----+---+---+---+---+---+---
 1 |  1 |  1 | Y | X | Z | A | A | A
 2 |  1 |  2 | B | X | Z | B | B | B
 3 |  1 |  3 | Y | X | Z | C | C | C
 4 |  2 |  1 | Y | W | Y | A | A | A
 5 |  2 |  2 | Y | W | Y | B | B | B
 6 |  2 |  3 | Y | X | Z | C | C | C
 7 |  3 |  1 | B | X | Z | A | A | A
 8 |  3 |  2 | Y | W | Y | B | B | B
 9 |  3 |  3 | Y | X | Z | C | C | C

SELECT * FROM hw2_1nf_difficult_1;

 k1 | k2 | a | b | c | d | e | f 
----+----+---+---+---+---+---+---
  1 |  1 | Y | X | Z | A | A | A
  1 |  2 | B | X | Z | B | B | B
  1 |  3 | Y | X | Z | C | C | C
  2 |  1 | Y | W | Y | A | A | A
  2 |  2 | Y | W | Y | B | B | B
  2 |  3 | Y | X | Z | C | C | C
  3 |  1 | B | X | Z | A | A | A
  3 |  2 | Y | W | Y | B | B | B
  3 |  3 | Y | X | Z | C | C | C

SELECT * FROM hw2_1nf_difficult_2;

 k1 | k2 | a | b | c | d | e | f | g | h | l | m 
----+----+---+---+---+---+---+---+---+---+---+---
  1 |  3 | A | B | X | Y | X | Y | Y | W | A | A
  1 |  2 | A | B | X | Y | X | Y | Y | X | A | A
  1 |  1 | A | C | X | Y | X | Y | Y | W | A | A
  2 |  1 | B | A | Y | Z | Y | Y | B | X | Z | B
  2 |  3 | B | A | Y | X | Y | Y | B | W | B | B
  3 |  2 | C | A | Z | Z | Z | X | X | X | Z | A
  4 |  6 | D | B | W | Y | W | W | W | W | Z | B
  4 |  5 | D | B | W | Y | W | W | W | X | A | B
  4 |  4 | D | C | W | Y | W | W | W | W | A | B
  5 |  4 | A | A | Y | Z | Y | Y | Y | X | Z | A
  5 |  6 | A | A | Y | X | Y | Y | Y | W | B | A
  6 |  5 | B | A | Y | Z | Y | Y | B | X | Z | B
  7 |  7 | C | C | Z | Y | Z | X | X | W | A | A
  7 |  8 | C | B | Z | Y | Z | X | X | X | A | A
  7 |  9 | C | B | Z | Y | Z | X | X | W | A | A
  8 |  9 | D | A | W | X | W | W | W | W | B | B
  8 |  7 | D | A | W | Z | W | W | W | X | Z | B
  9 |  8 | E | A | X | Z | X | B | B | X | Z | C
 11 | 13 | A | B | X | Y | X | Y | Y | W | A | A
 11 | 12 | A | B | X | Y | X | Y | Y | X | A | A
 11 | 11 | A | C | X | Y | X | Y | Y | W | A | A
 12 | 11 | B | A | Y | Z | Y | Y | B | X | Z | B
 12 | 13 | B | A | Y | X | Y | Y | B | W | B | B
 13 | 12 | C | A | Z | Z | Z | X | X | X | Z | A
 14 | 16 | D | B | W | Y | W | W | W | W | Z | B
 14 | 15 | D | B | W | Y | W | W | W | X | A | B
 14 | 14 | D | C | W | Y | W | W | W | W | A | B
 15 | 14 | A | A | Y | Z | Y | Y | Y | X | Z | A
 15 | 16 | A | A | Y | X | Y | Y | Y | W | B | A
 16 | 15 | B | A | Y | Z | Y | Y | B | X | Z | B
 17 | 17 | C | C | Z | Y | Z | X | X | W | A | A
 17 | 18 | C | B | Z | Y | Z | X | X | X | A | A
 17 | 19 | C | B | Z | Y | Z | X | X | W | A | A
 18 | 19 | D | A | W | X | W | W | W | W | B | B
 18 | 17 | D | A | W | Z | W | W | W | X | Z | B
 19 | 18 | E | A | X | Z | X | B | B | X | Z | C
 21 | 23 | A | B | X | Y | X | Y | Y | W | A | A
 21 | 22 | A | B | X | Y | X | Y | Y | X | A | A
 21 | 21 | A | C | X | Y | X | Y | Y | W | A | A
 22 | 21 | B | A | Y | Z | Y | Y | B | X | Z | B
 22 | 23 | B | A | Y | X | Y | Y | B | W | B | B
 23 | 22 | C | A | Z | Z | Z | X | X | X | Z | A
 24 | 26 | D | B | W | Y | W | W | W | W | Z | B
 24 | 25 | D | B | W | Y | W | W | W | X | A | B
 24 | 24 | D | C | W | Y | W | W | W | W | A | B
 25 | 24 | A | A | Y | Z | Y | Y | Y | X | Z | A
 25 | 26 | A | A | Y | X | Y | Y | Y | W | B | A
 26 | 25 | B | A | Y | Z | Y | Y | B | X | Z | B
 27 | 27 | C | C | Z | Y | Z | X | X | W | A | A
 27 | 28 | C | B | Z | Y | Z | X | X | X | A | A
 27 | 29 | C | B | Z | Y | Z | X | X | W | A | A
 28 | 29 | D | A | W | X | W | W | W | W | B | B
 28 | 27 | D | A | W | Z | W | W | W | X | Z | B
 29 | 28 | E | A | X | Z | X | B | B | X | Z | C
 31 | 33 | A | B | X | Y | X | Y | Y | W | A | A
 31 | 32 | A | B | X | Y | X | Y | Y | X | A | A
 31 | 31 | A | C | X | Y | X | Y | Y | W | A | A
 32 | 31 | B | A | Y | Z | Y | Y | B | X | Z | B
 32 | 33 | B | A | Y | X | Y | Y | B | W | B | B
 33 | 32 | C | A | Z | Z | Z | X | X | X | Z | A
 34 | 36 | D | B | W | Y | W | W | W | W | Z | B
 34 | 35 | D | B | W | Y | W | W | W | X | A | B
 34 | 34 | D | C | W | Y | W | W | W | W | A | B
 35 | 34 | A | A | Y | Z | Y | Y | Y | X | Z | A
 35 | 36 | A | A | Y | X | Y | Y | Y | W | B | A
 36 | 35 | B | A | Y | Z | Y | Y | B | X | Z | B
 37 | 37 | C | C | Z | Y | Z | X | X | W | A | A
 37 | 38 | C | B | Z | Y | Z | X | X | X | A | A
 37 | 39 | C | B | Z | Y | Z | X | X | W | A | A
 38 | 39 | D | A | W | X | W | W | W | W | B | B
 38 | 37 | D | A | W | Z | W | W | W | X | Z | B
 39 | 38 | E | A | X | Z | X | B | B | X | Z | C
 41 | 43 | A | B | X | Y | X | Y | Y | W | A | A
 41 | 42 | A | B | X | Y | X | Y | Y | X | A | A
 41 | 41 | A | C | X | Y | X | Y | Y | W | A | A
 42 | 41 | B | A | Y | Z | Y | Y | B | X | Z | B
 42 | 43 | B | A | Y | X | Y | Y | B | W | B | B
 43 | 42 | C | A | Z | Z | Z | X | X | X | Z | A
 44 | 46 | D | B | W | Y | W | W | W | W | Z | B
 44 | 45 | D | B | W | Y | W | W | W | X | A | B
 44 | 44 | D | C | W | Y | W | W | W | W | A | B
 45 | 44 | A | A | Y | Z | Y | Y | Y | X | Z | A
 45 | 46 | A | A | Y | X | Y | Y | Y | W | B | A
 46 | 45 | B | A | Y | Z | Y | Y | B | X | Z | B
 47 | 47 | C | C | Z | Y | Z | X | X | W | A | A
 47 | 48 | C | B | Z | Y | Z | X | X | X | A | A
 47 | 49 | C | B | Z | Y | Z | X | X | W | A | A
 48 | 49 | D | A | W | X | W | W | W | W | B | B
 48 | 47 | D | A | W | Z | W | W | W | X | Z | B
 49 | 48 | E | A | X | Z | X | B | B | X | Z | C
 51 | 53 | A | B | X | Y | X | Y | Y | W | A | A
 51 | 52 | A | B | X | Y | X | Y | Y | X | A | A
 51 | 51 | A | C | X | Y | X | Y | Y | W | A | A
 52 | 51 | B | A | Y | Z | Y | Y | B | X | Z | B
 52 | 53 | B | A | Y | X | Y | Y | B | W | B | B
 53 | 52 | C | A | Z | Z | Z | X | X | X | Z | A
 54 | 56 | D | B | W | Y | W | W | W | W | Z | B
 54 | 55 | D | B | W | Y | W | W | W | X | A | B
 54 | 54 | D | C | W | Y | W | W | W | W | A | B
 55 | 54 | A | A | Y | Z | Y | Y | Y | X | Z | A
 55 | 56 | A | A | Y | X | Y | Y | Y | W | B | A
 56 | 55 | B | A | Y | Z | Y | Y | B | X | Z | B
 57 | 57 | C | C | Z | Y | Z | X | X | W | A | A
 57 | 58 | C | B | Z | Y | Z | X | X | X | A | A
 57 | 59 | C | B | Z | Y | Z | X | X | W | A | A
 58 | 59 | D | A | W | X | W | W | W | W | B | B
 58 | 57 | D | A | W | Z | W | W | W | X | Z | B
 59 | 58 | E | A | X | Z | X | B | B | X | Z | C


SELECT * FROM hw2_1nf_difficult_2nf_1;

 k2 | d | e | f 
----+---+---+---
  2 | B | B | B
  3 | C | C | C
  1 | A | A | A

SELECT * FROM hw2_1nf_difficult_2nf_2;


 k1 | k2 | a | b | c 
----+----+---+---+---
  1 |  1 | Y | X | Z
  3 |  2 | Y | W | Y
  2 |  1 | Y | W | Y
  2 |  2 | Y | W | Y
  3 |  1 | B | X | Z
  1 |  2 | B | X | Z
  1 |  3 | Y | X | Z
  3 |  3 | Y | X | Z
  2 |  3 | Y | X | Z

SELECT * FROM hw2_1nf_difficult_2nf_2_3nf_1;

 b | c 
---+---
 X | Z
 W | Y

SELECT * FROM hw2_1nf_difficult_2nf_2_3nf_2;

 k1 | k2 | a | b 
----+----+---+---
  1 |  2 | B | X
  3 |  3 | Y | X
  3 |  1 | B | X
  2 |  1 | Y | W
  2 |  3 | Y | X
  1 |  1 | Y | X
  3 |  2 | Y | W
  1 |  3 | Y | X
  2 |  2 | Y | W