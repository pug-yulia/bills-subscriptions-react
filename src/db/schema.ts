export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS categories(
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_entries(
TODO - дописать поля таблицы
)
`;