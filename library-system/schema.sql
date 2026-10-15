CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  copies INT NOT NULL CHECK (copies >= 0),
  available INT NOT NULL CHECK (available >= 0)
);
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  book_id INT NOT NULL REFERENCES books(id),
  member_name TEXT NOT NULL,
  member_email TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date DATE NOT NULL,
  returned_at TIMESTAMPTZ,
  fine NUMERIC(8,2) NOT NULL DEFAULT 0
);
