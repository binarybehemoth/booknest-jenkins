'use strict';

const { createApp } = require('./app');
const db = require('./db');

const PORT = Number(process.env.PORT || 3000);

async function main() {
  await db.init();
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`BookNest API listening on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start BookNest API', err);
  process.exit(1);
});
