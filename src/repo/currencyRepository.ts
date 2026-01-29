import { db } from "../db/database";

export interface Currency {
  code: string; // "USD"
  name: string; // "US Dollar"
  symbol: string; // "$"
  minorUnit: number; // 2
}

export interface FxRate {
  baseCode: string; // "USD"
  quoteCode: string; // "RUB"
  rate: number; // 1 base = rate quote
  updatedAt: string; // ISO
}

const BASE_CURRENCY_KEY = "baseCurrencyCode";

export async function getAllCurrencies(): Promise<Currency[]> {
  return await db.getAllAsync<Currency>(
    `SELECT code, name, symbol, minorUnit FROM currencies ORDER BY code ASC`,
  );
}

export async function getCurrencyByCode(
  code: string,
): Promise<Currency | null> {
  const row = await db.getFirstAsync<Currency>(
    `SELECT code, name, symbol, minorUnit FROM currencies WHERE code = ?`,
    [code],
  );
  return row ?? null;
}

export async function upsertCurrency(currency: Currency): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO currencies (code, name, symbol, minorUnit)
     VALUES (?, ?, ?, ?)`,
    [currency.code, currency.name, currency.symbol, currency.minorUnit],
  );
}

export async function getAllFxRates(): Promise<FxRate[]> {
  return await db.getAllAsync<FxRate>(
    `SELECT baseCode, quoteCode, rate, updatedAt FROM fx_rates`,
  );
}

export async function getAllFxRate(
  fromCode: string,
  toCode: string,
): Promise<number | null> {
  const row = await db.getFirstAsync<{ rate: number }>(
    `SELECT rate FROM fx_rates WHERE baseCode = ? AND quoteCode = ?`,
    [fromCode, toCode],
  );
  return row?.rate ?? null;
}

export async function upsertFxRate(
  fromCode: string,
  toCode: string,
  rate: number,
  updatedAt: string,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO fx_rates (baseCode, quoteCode, rate, updatedAt) VALUES (?, ?, ?, ?)`,
    [fromCode, toCode, rate, updatedAt],
  );
}

export async function getBaseCurrencyCode(): Promise<string> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    [BASE_CURRENCY_KEY],
  );
  return row?.value ?? "USD";
}

export async function setBaseCurrencyCode(code: string): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
    [BASE_CURRENCY_KEY, code],
  );
}

/**
 * Удобный хелпер: получить символ валюты (если нет — вернуть код)
 */
export async function getCurrencySymbol(code: string): Promise<string> {
  const c = await getCurrencyByCode(code);
  return c?.symbol ?? code;
}
