export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS categories (
     id TEXT PRIMARY KEY NOT NULL,
     name TEXT NOT NULL,
     color TEXT,
     icon TEXT,
     createdAt TEXT NOT NULL,
     updatedAt TEXT NOT NULL
   );`,

  `CREATE TABLE IF NOT EXISTS currencies (
    code TEXT PRIMARY KEY NOT NULL,     -- "USD"
    name TEXT NOT NULL,                 -- "US Dollar"
    symbol TEXT NOT NULL,               -- "$"
    minorUnit INTEGER NOT NULL           -- 2
  );`,

  `CREATE TABLE IF NOT EXISTS fx_rates (
     baseCode TEXT NOT NULL,             -- "USD"
     quoteCode TEXT NOT NULL,            -- "RUB"
     rate REAL NOT NULL,                 -- 1 base = rate quote
     updatedAt TEXT NOT NULL,
     PRIMARY KEY (baseCode, quoteCode),
     FOREIGN KEY (baseCode) REFERENCES currencies(code),
     FOREIGN KEY (quoteCode) REFERENCES currencies(code)
   );`,

  // (опционально) настройки приложения
  `CREATE TABLE IF NOT EXISTS app_settings (
     key TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL
   );`,

  `CREATE TABLE IF NOT EXISTS payment_entries (
     id TEXT PRIMARY KEY NOT NULL,
     title TEXT NOT NULL,
     amount INTEGER NOT NULL,
     currencyCode TEXT NOT NULL,
     type TEXT NOT NULL,
     categoryId TEXT NOT NULL,
     dueDate TEXT NOT NULL,
     repeatRule TEXT,
     note TEXT,
     isPaid INTEGER NOT NULL,
     createdAt TEXT NOT NULL,
     updatedAt TEXT NOT NULL,
     FOREIGN KEY (categoryId) REFERENCES categories(id),
     FOREIGN KEY (currencyCode) REFERENCES currencies(code),
     CHECK (repeatRule IN ('daily','weekly','monthly','yearly') OR repeatRule IS NULL),
     CHECK (type IN ('bill','subscription'))
   );`,

  `CREATE INDEX IF NOT EXISTS idx_payment_entries_dueDate ON payment_entries(dueDate);`,
  `CREATE INDEX IF NOT EXISTS idx_payment_entries_categoryId ON payment_entries(categoryId);`,
  `CREATE INDEX IF NOT EXISTS idx_payment_entries_currencyCode ON payment_entries(currencyCode);`,
];
