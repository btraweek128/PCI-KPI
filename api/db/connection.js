const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing database configuration. Set DATABASE_URL in .env');
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  });

  return pool;
}

function convertNamedParams(text, params) {
  const keys = [];
  const values = [];
  const convertedText = text.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      return match;
    }
    let index = keys.indexOf(key);
    if (index === -1) {
      keys.push(key);
      values.push(params[key]);
      index = keys.length - 1;
    }
    return `$${index + 1}`;
  });

  return { text: convertedText, values };
}

async function query(text, params = {}) {
  const activePool = getPool();
  const { text: convertedText, values } = convertNamedParams(text, params);
  const result = await activePool.query(convertedText, values);
  return { recordset: result.rows, rowsAffected: result.rowCount };
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  query,
  closePool,
};
