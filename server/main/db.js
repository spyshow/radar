const { pool } = require("pg");

const pool = new pool({
  user: "postgres",
  host: "localhost",
  database: "radar",
  password: "thespy",
  port: 5432
});

module.exports = pool;
