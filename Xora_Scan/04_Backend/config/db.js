// db.js
const { Pool } = require('pg');
require('dotenv').config();

// Shared Cloud Database 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

pool.on('connect', () => {
  console.log(' -> Shared PostgreSQL Database Connected Successfully.');
});

module.exports = pool;