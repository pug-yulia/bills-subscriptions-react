import { Category } from "../domain/Category";
import { PaymentEntry, PaymentType, RepeatRule } from "../domain/PaymentEntry";
import { insertCategory } from "../repo/categoryRepository";
import { insertPaymentEntry } from "../repo/paymentEntryRepository";
import { db } from "./database";

// Seed data mirrors the Swift app (bills-subscriptions-swift), which is the
// reference for benchmarking. Keep both in sync.

function now(): string {
  return new Date().toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/* ---------- Currencies & FX ---------- */

export async function seedCurrenciesAndRates(): Promise<void> {
  // Валюты
  await db.runAsync(
    `INSERT OR IGNORE INTO currencies (code, name, symbol, minorUnit)
   VALUES (?, ?, ?, ?)`,
    ["USD", "US Dollar", "$", 2],
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO currencies (code, name, symbol, minorUnit)
   VALUES (?, ?, ?, ?)`,
    ["RUB", "Russian Ruble", "₽", 2],
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO currencies (code, name, symbol, minorUnit)
   VALUES (?, ?, ?, ?)`,
    ["EUR", "Euro", "€", 2],
  );

  // Базовая валюта приложения
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
    ["baseCurrencyCode", "USD"],
  );

  // Fixed rates for reproducibility. Only one direction per pair is stored;
  // the opposite direction is derived as 1 / rate (see getRate in HomeScreen).
  const rates: [string, string, number][] = [
    ["USD", "RUB", 90.0],
    ["EUR", "RUB", 98.0],
    ["EUR", "USD", 1.08],
  ];

  for (const [baseCode, quoteCode, rate] of rates) {
    await db.runAsync(
      `INSERT OR REPLACE INTO fx_rates (baseCode, quoteCode, rate, updatedAt) VALUES (?, ?, ?, ?)`,
      [baseCode, quoteCode, rate, now()],
    );
  }
}

/* ---------- Categories ---------- */

function category(id: string, name: string, color: string): Category {
  return { id, name, color, createdAt: now(), updatedAt: now() };
}

export const DEFAULT_CATEGORIES: Category[] = [
  category("utilities", "Utilities", "#4D96FF"),
  category("home", "Home", "#FF6B6B"),
  category("entertainment", "Entertainment", "#6BCB77"),
  category("food", "Food", "#FFA41B"),
  category("transport", "Transport", "#9B5DE5"),
  category("health", "Health", "#F15BB5"),
  category("education", "Education", "#00BBF9"),
  category("shopping", "Shopping", "#00F5D4"),
];

export async function seedCategories(): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    await insertCategory(category);
  }
}

/* ---------- Payment entries ---------- */

function entry(
  id: string,
  title: string,
  amount: number, // minor units (cents/kopecks)
  currencyCode: string,
  type: PaymentType,
  categoryId: string,
  dueInDays: number,
  repeatRule: RepeatRule | null,
): PaymentEntry {
  return {
    id,
    title,
    amount,
    currencyCode,
    type,
    categoryId,
    dueDate: daysFromNow(dueInDays),
    repeatRule,
    note: null,
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  };
}

export const DEFAULT_PAYMENT_ENTRIES: PaymentEntry[] = [
  // Bills
  entry("p_internet", "Internet", 3999, "USD", "bill", "utilities", 0, null),
  entry("p_electricity", "Electricity", 1245, "USD", "bill", "home", 3, null),
  entry("p_water", "Water", 870, "USD", "bill", "home", 10, null),
  entry("p_mobile_plan", "Mobile plan", 1299, "USD", "bill", "utilities", 7, null),
  entry("p_gas", "Gas", 2150, "USD", "bill", "home", 14, null),
  entry("p_groceries", "Groceries", 5200, "EUR", "bill", "food", 1, null),
  entry("p_fuel", "Fuel", 4500, "EUR", "bill", "transport", 5, null),
  entry("p_pharmacy", "Pharmacy", 1590, "EUR", "bill", "health", 2, null),
  entry("p_home_supplies", "Home supplies", 78000, "RUB", "bill", "shopping", 4, null),

  // Subscriptions
  entry("p_netflix", "Netflix", 1599, "USD", "subscription", "entertainment", 20, "monthly"),
  entry("p_spotify", "Spotify", 1099, "USD", "subscription", "entertainment", 12, "monthly"),
  entry("p_icloud", "iCloud+", 299, "USD", "subscription", "utilities", 9, "monthly"),
  entry("p_gym", "Gym", 2500, "EUR", "subscription", "health", 6, "monthly"),
  entry("p_language_course", "Language Course", 8900, "EUR", "subscription", "education", 15, "monthly"),
  entry("p_commute_pass", "Weekly commute pass", 1200, "EUR", "subscription", "transport", 7, "weekly"),
  entry("p_daily_coffee", "Daily coffee", 350, "EUR", "subscription", "food", 1, "daily"),
  entry("p_prime", "Prime", 899, "USD", "subscription", "shopping", 18, "yearly"),
  entry("p_music_rub", "Music (RUB)", 19900, "RUB", "subscription", "entertainment", 11, "monthly"),
];

export async function seedPaymentEntries(): Promise<void> {
  for (const entry of DEFAULT_PAYMENT_ENTRIES) {
    await insertPaymentEntry(entry);
  }
}
