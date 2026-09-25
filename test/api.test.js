'use strict';

// Integration tests against a real PostgreSQL. Start it first:
//   docker compose up -d
// then:
//   npm test
// (node's built-in test runner and fetch - no test framework dependency.)

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const db = require('../db');

let server;
let baseUrl;

before(async () => {
  await db.init();
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
});

test('GET /health reports ok without touching the database', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { status: 'ok' });
});

test('GET /ready reports ready when the database is reachable', async () => {
  const res = await fetch(`${baseUrl}/ready`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ready');
});

test('GET /api/books returns all six seeded books', async () => {
  const res = await fetch(`${baseUrl}/api/books`);
  assert.equal(res.status, 200);
  const books = await res.json();
  assert.equal(books.length, 6);
  assert.equal(books[0].title, 'The Quiet Harbor');
  assert.equal(typeof books[0].price, 'number');
});

test('GET /api/books?genre=Cooking filters by genre', async () => {
  const res = await fetch(`${baseUrl}/api/books?genre=Cooking`);
  const books = await res.json();
  assert.equal(books.length, 1);
  assert.equal(books[0].title, 'Salt and Saffron');
});

test('GET /api/books?inStock=false filters by stock status', async () => {
  const res = await fetch(`${baseUrl}/api/books?inStock=false`);
  const books = await res.json();
  assert.equal(books.length, 1);
  assert.equal(books[0].inStock, false);
});

test('GET /api/books/:id returns a single book', async () => {
  const res = await fetch(`${baseUrl}/api/books/3`);
  assert.equal(res.status, 200);
  const book = await res.json();
  assert.equal(book.title, 'Salt and Saffron');
  assert.equal(book.author, 'Priya Nair');
});

test('GET /api/books/:id returns 404 for an unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/books/999`);
  assert.equal(res.status, 404);
});

test('GET /api/books/:id returns 400 for a non-integer id', async () => {
  const res = await fetch(`${baseUrl}/api/books/not-a-number`);
  assert.equal(res.status, 400);
});

test('GET / serves the static front end', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /BookNest/);
});
