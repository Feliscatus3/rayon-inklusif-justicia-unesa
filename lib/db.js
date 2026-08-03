const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<QueryResult>} - Query result
 */
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>} - Pool client
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  query,
  getClient,
  pool
};

