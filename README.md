# BookNest baseline service

A small Node.js 24 + Express REST API for the BookNest bookshop, backed by PostgreSQL, with a
static front end served by the API itself. This is the running example for the Web Coding
Series, Volume 5 (Package Managers and DevOps): Chapter 2 versions it with Git, Chapter 3 hosts
it on GitHub with Actions, Chapter 4 containerizes it, Chapter 5 builds it in Jenkins, Chapter 6
deploys it to Kubernetes, Chapter 7 provisions its AWS infrastructure with CloudFormation.

This copy, at `/home/dev/v5-booknest-baseline/`, is **read-only** for writers: it is the known-good
starting point every chapter branches from. Make working copies elsewhere.

## Requirements

- Node.js 24 (`node --version`)
- Docker (for PostgreSQL via `docker compose`)

## Run it

```sh
docker compose up -d      # starts PostgreSQL on localhost:5432
npm install                # express, pg
npm start                  # API + front end on http://localhost:3000
```

Open `http://localhost:3000/` for the catalog page, or call the API directly:

```sh
curl http://localhost:3000/api/books
curl http://localhost:3000/api/books/3
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

The database schema and the six-book seed catalog are created automatically on first start
(`db/schema.sql`, `db/seed.json`) and are idempotent - restarting the API does not duplicate rows.

Stop PostgreSQL with `docker compose down` (add `-v` to also delete its data volume).

## API

| Method | Path              | Description                                   |
|--------|-------------------|------------------------------------------------|
| GET    | `/health`         | Liveness - process is up. No database check.  |
| GET    | `/ready`          | Readiness - `SELECT 1` against PostgreSQL.    |
| GET    | `/api/books`      | All books. Optional `?genre=` and `?inStock=true\|false`. |
| GET    | `/api/books/:id`  | One book by id, or 404.                       |
| GET    | `/`               | Static front end (`public/index.html`).       |

## Environment variables

| Variable      | Default     | Meaning                        |
|---------------|-------------|---------------------------------|
| `PORT`        | `3000`      | API listen port                |
| `PGHOST`      | `localhost` | PostgreSQL host                |
| `PGPORT`      | `5432`      | PostgreSQL port                |
| `PGUSER`      | `booknest`  | PostgreSQL user                |
| `PGPASSWORD`  | `booknest`  | PostgreSQL password            |
| `PGDATABASE`  | `booknest`  | PostgreSQL database name       |

## Tests

```sh
docker compose up -d
npm test
```

Uses Node's built-in test runner (`node --test`) and built-in `fetch` - no test framework
dependency. The suite starts the Express app on an ephemeral port and exercises it against the
real PostgreSQL container (not a mock), including the health/readiness endpoints, filtering,
the 404/400 paths, and the static front end.

## Design notes for writers

- Dependency-light on purpose: only `express` and `pg` in `dependencies`, nothing in
  `devDependencies`. Do not add a test framework, linter, or nodemon to this copy - later
  chapters add their own tooling deliberately, one tool at a time.
- No Dockerfile here - Chapter 4 writes one. Until then the API runs with plain `node server.js`
  against PostgreSQL from `docker compose up`.
- `app.js` (the Express app) and `server.js` (starts it, wires up the database, handles
  SIGTERM/SIGINT) are split on purpose so tests can import `app.js` without opening a real
  listener from `server.js`'s side effects.
- `/health` never touches the database; `/ready` always does. Keep that distinction when Chapter
  6 wires these into Kubernetes liveness/readiness probes - a slow database must fail readiness,
  not liveness, or the orchestrator restarts a perfectly healthy pod for no reason.

## Continuous integration

Jenkins builds every branch and pull request with the `Jenkinsfile` at the root.
Webhooks reach the development controller through a smee.io relay.
