export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_entries (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  type TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  dueDate TEXT NOT NULL,
  repeatRule TEXT,
  note TEXT,
  isPaid INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id)
);
`;