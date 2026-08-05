const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[db] DATABASE_URL is not set. Set it in Vercel "Environment Variables".');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL && !DATABASE_URL.includes('localhost') && !DATABASE_URL.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client:', err.message);
  // Do NOT call process.exit in a serverless environment — it can kill the whole
  // deployment. Let the pool recover on the next request instead.
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

