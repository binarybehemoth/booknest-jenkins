'use strict';

const path = require('path');
const express = require('express');
const db = require('./db');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  // Static front end (public/index.html + assets) - the API serves its own UI, no separate
  // web server. Chapter 4 puts this behind a reverse proxy; here it is plain Express.static.
  app.use(express.static(path.join(__dirname, 'public')));

  // Liveness: the process can answer HTTP at all. No database round trip - a slow or
  // down database must not make an orchestrator (Chapter 6) kill and restart a healthy pod.
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Readiness: can this instance actually serve traffic right now? Checks the database.
  app.get('/ready', async (req, res) => {
    try {
      await db.ping();
      res.status(200).json({ status: 'ready' });
    } catch (err) {
      res.status(503).json({ status: 'not ready', reason: err.message });
    }
  });

  app.get('/api/books', async (req, res, next) => {
    try {
      const clauses = [];
      const params = [];
      if (req.query.genre) {
        params.push(req.query.genre);
        clauses.push(`genre = $${params.length}`);
      }
      if (req.query.inStock === 'true' || req.query.inStock === 'false') {
        params.push(req.query.inStock === 'true');
        clauses.push(`in_stock = $${params.length}`);
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const { rows } = await db.query(
        `SELECT id, title, author, genre, price::float8 AS price, rating::float8 AS rating,
                pages, year, in_stock AS "inStock", summary
         FROM books ${where} ORDER BY id`,
        params
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/books/:id', async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'id must be an integer' });
    }
    try {
      const { rows } = await db.query(
        `SELECT id, title, author, genre, price::float8 AS price, rating::float8 AS rating,
                pages, year, in_stock AS "inStock", summary
         FROM books WHERE id = $1`,
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'book not found' });
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  // 404 for any other /api/* route.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}

module.exports = { createApp };
