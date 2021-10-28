SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'hw2_bcnf';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'hw2_bcnf' 
AND column_name = 'k1';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'hw2_bcnf' 
AND column_name = 'k2';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'hw2_bcnf' 
AND column_name = 'a';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'hw2_bcnf' 
AND column_name = 'b';

SELECT a, COUNT(*) 
FROM hw2_bcnf 
GROUP BY a 
HAVING COUNT(*) > 1;

SELECT b, COUNT(*) 
FROM hw2_bcnf 
GROUP BY b 
HAVING COUNT(*) > 1;

SELECT k1,k2, COUNT(*) 
FROM hw2_bcnf 
GROUP BY k1,k2 
HAVING COUNT(*) > 1;

SELECT k1,k2,a,b, COUNT(*) 
FROM hw2_bcnf 
GROUP BY k1,k2,a,b 
HAVING COUNT(*) > 1;

SELECT k1, COUNT(DISTINCT a) 
FROM hw2_bcnf 
GROUP BY k1 
HAVING COUNT(DISTINCT a) > 1;

SELECT k1, COUNT(DISTINCT b) 
FROM hw2_bcnf 
GROUP BY k1 
HAVING COUNT(DISTINCT b) > 1;

SELECT k2, COUNT(DISTINCT a) 
FROM hw2_bcnf 
GROUP BY k2 
HAVING COUNT(DISTINCT a) > 1;

SELECT k2, COUNT(DISTINCT b) 
FROM hw2_bcnf 
GROUP BY k2 
HAVING COUNT(DISTINCT b) > 1;

SELECT a, COUNT(DISTINCT b) 
FROM hw2_bcnf 
GROUP BY a 
HAVING COUNT(DISTINCT b) > 1;

SELECT b, COUNT(DISTINCT a) 
FROM hw2_bcnf 
GROUP BY b 
HAVING COUNT(DISTINCT a) > 1;

SELECT a, COUNT(DISTINCT k1) 
FROM hw2_bcnf 
GROUP BY a 
HAVING COUNT(DISTINCT k1) > 1;

SELECT a, COUNT(DISTINCT k2) 
FROM hw2_bcnf 
GROUP BY a 
HAVING COUNT(DISTINCT k2) > 1;

SELECT b, COUNT(DISTINCT k1) 
FROM hw2_bcnf 
GROUP BY b 
HAVING COUNT(DISTINCT k1) > 1;

SELECT b, COUNT(DISTINCT k2) 
FROM hw2_bcnf 
GROUP BY b 
HAVING COUNT(DISTINCT k2) > 1;

