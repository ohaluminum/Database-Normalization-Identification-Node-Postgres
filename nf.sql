SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'hw2_1nf_difficult';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'hw2_1nf_difficult' 
AND column_name = 'k';

