#!/usr/bin/env node
/**
 * Idempotent DB bootstrap for Railway release phase.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('init-db: DATABASE_URL is not set — skipping');
  process.exit(0);
}

const schemaPath = path.join(__dirname, '..', 'db', 'schema.postgres.sql');
const seedPilotPath = path.join(__dirname, '..', 'db', 'seed_pilot.postgres.sql');

async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM pg_catalog.pg_class c
       JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = $1
     ) AS exists`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function run() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log('init-db: applying schema.postgres.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);

    const cycleCount = await client.query('SELECT COUNT(*)::int AS cnt FROM "PerformanceCycles"');
    if (cycleCount.rows[0].cnt === 0) {
      console.log('init-db: seeding pilot data');
      const seedSql = fs.readFileSync(seedPilotPath, 'utf8');
      await client.query(seedSql);
    } else {
      console.log('init-db: pilot seed already present');
    }

    console.log('init-db: complete');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('init-db failed:', err.message);
  process.exit(1);
});
