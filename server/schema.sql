CREATE TABLE users (
  uid SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  email VARCHAR(255),
  date_created DATE,
  last_login DATE
);

CREATE TABLE machines (
  mid SERIAL PRIMARY KEY,
  machine_name VARCHAR(255) UNIQUE,
  machine_line VARCHAR(255),
  url VARCHAR(255),
  type VARCHAR(20),
  speed SMALLINT,
  timetoscan SMALLINT
);

CREATE TABLE inspection (
    iid UUID PRIMARY KEY,
    machine_id INT REFERENCES machines(mid),
    inspected INT,
    rejected INT,
    sensor0101 INT,
    sensor0102 INT,
    sensor0103 INT,
    sensor0104 INT,
    sensor0105 INT,
    sensor0106 INT,
    sensor0107 INT,
    sensor0108 INT,
    sensor0201 INT,
    sensor0202 INT,
    sensor0203 INT,
    sensor0204 INT,
    sensor0205 INT,
    sensor0206 INT,
    sensor0207 INT,
    sensor0208 INT,
    sensor0209 INT,
    sensor0210 INT,
    sensor0211 INT,
    sensor0212 INT,
    sensor0213 INT,
    sensor0214 INT,
    sensor0215 INT,
    sensor0216 INT,
    sensor0901 INT,
    sensor0902 INT,
    sensor0903 INT,
    sensor0904 INT,
    sensor0905 INT,
    sensor0906 INT,
    sensor0907 INT,
    sensor0908 INT,
    sensor0909 INT,
    sensor0910 INT,
    sensor0911 INT,
    sensor0912 INT,
    sensor0913 INT,
    sensor0914 INT,
    sensor0915 INT,
    sensor0916 INT,
    sensor1001 INT,
    sensor1002 INT,
    sensor1003 INT,
    sensor1004 INT,
    sensor1005 INT,
    sensor1006 INT,
    sensor1007 INT,
    sensor1008 INT,
    sensor1009 INT,
    sensor1010 INT,
    sensor1011 INT,
    sensor1012 INT,
    sensor1013 INT,
    sensor1014 INT,
    sensor1015 INT,
    sensor1016 INT,
);