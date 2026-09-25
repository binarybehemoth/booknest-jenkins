CREATE TABLE IF NOT EXISTS books (
  id        INTEGER PRIMARY KEY,
  title     TEXT NOT NULL,
  author    TEXT NOT NULL,
  genre     TEXT NOT NULL,
  price     NUMERIC(6,2) NOT NULL,
  rating    NUMERIC(2,1) NOT NULL,
  pages     INTEGER NOT NULL,
  year      INTEGER NOT NULL,
  in_stock  BOOLEAN NOT NULL DEFAULT TRUE,
  summary   TEXT NOT NULL
);
