'use strict';

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Connection settings come entirely from environment variables so the same code works
// against `docker compose up`'s Postgres, a writer's own local Postgres, or (later,
// Chapter 6) a Postgres running inside the cluster. Defaults match docker-compose.yml.
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'booknest',
  password: process.env.PGPASSWORD || 'booknest',
  database: process.env.PGDATABASE || 'booknest',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  // Idle clients emit background errors (e.g. the server restarting) - log, do not crash.
  console.error('Unexpected PostgreSQL client error', err);
});

/** Runs a query against the pool. Thin wrapper kept so routes/tests never import `pg` directly. */
function query(text, params) {
  return pool.query(text, params);
}

/** Creates the schema (if missing) and seeds it (if empty) from db/seed.json. Idempotent. */
async function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM books');
  if (rows[0].count > 0) return;

  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8'));
  for (const book of seed.books) {
    await pool.query(
      `INSERT INTO books (id, title, author, genre, price, rating, pages, year, in_stock, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [book.id, book.title, book.author, book.genre, book.price, book.rating, book.pages,
        book.year, book.inStock, book.summary]
    );
  }
}

/** SELECT 1 - used by the readiness probe. Rejects if PostgreSQL is unreachable. */
function ping() {
  return pool.query('SELECT 1');
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, init, ping, close };
