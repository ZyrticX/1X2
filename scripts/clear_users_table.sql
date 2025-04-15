-- מחיקת כל המשתמשים מטבלת users
TRUNCATE TABLE users CASCADE;

-- אם יש צורך, מחיקת גם הניחושים הקשורים
TRUNCATE TABLE predictions CASCADE;
