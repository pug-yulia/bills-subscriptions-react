import { openDatabaseSync } from "expo-sqlite";
import { SCHEMA_STATEMENTS } from "./schema";

export const db = openDatabaseSync("payments.db");

export async function initDb(): Promise<void> {
  for (const stmt of SCHEMA_STATEMENTS) {
    await db.execAsync(stmt);
  }
}

export async function resetDb(): Promise<void> {
  // Важно: сначала таблицы с FK-зависимостями
  const statements = [
    "DROP TABLE IF EXISTS payment_entries;",
    "DROP TABLE IF EXISTS fx_rates;",
    "DROP TABLE IF EXISTS app_settings;",
    "DROP TABLE IF EXISTS currencies;",
    "DROP TABLE IF EXISTS categories;",
  ];

  // На всякий случай выключим FK на время дропа
  await db.execAsync("PRAGMA foreign_keys = OFF;");
  for (const s of statements) {
    await db.execAsync(s);
  }
  await db.execAsync("PRAGMA foreign_keys = ON;");
}

export async function resetAndInitDb(): Promise<void> {
  // Эксклюзивная транзакция: блокирует БД на время миграции
  await db.execAsync("BEGIN EXCLUSIVE TRANSACTION;");
  try {
    await db.execAsync("PRAGMA foreign_keys = OFF;");

    await db.execAsync("DROP TABLE IF EXISTS payment_entries;");
    await db.execAsync("DROP TABLE IF EXISTS fx_rates;");
    await db.execAsync("DROP TABLE IF EXISTS app_settings;");
    await db.execAsync("DROP TABLE IF EXISTS currencies;");
    await db.execAsync("DROP TABLE IF EXISTS categories;");

    await db.execAsync("PRAGMA foreign_keys = ON;");

    for (const stmt of SCHEMA_STATEMENTS) {
      await db.execAsync(stmt);
    }

    await db.execAsync("COMMIT;");
  } catch (e) {
    await db.execAsync("ROLLBACK;");
    throw e;
  }
}
