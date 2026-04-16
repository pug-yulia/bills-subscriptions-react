import { Category } from "../domain/Category";
import { PaymentEntry } from "../domain/PaymentEntry";
import { insertCategory } from "../repo/categoryRepository";
import { insertPaymentEntry } from "../repo/paymentEntryRepository";
import { db } from "./database";

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

  // Курс: 1 USD = 90 RUB (пример фиксированного курса для воспроизводимости)
  await db.runAsync(
    `INSERT OR REPLACE INTO fx_rates (baseCode, quoteCode, rate, updatedAt) VALUES (?, ?, ?, ?)`,
    ["USD", "RUB", 90.0, now()],
  );

  // Обратный курс: 1 RUB = 1/90 USD
  await db.runAsync(
    `INSERT OR REPLACE INTO fx_rates (baseCode, quoteCode, rate, updatedAt) VALUES (?, ?, ?, ?)`,
    ["RUB", "USD", 1 / 90.0, now()],
  );

  // 1 EUR = 1.08 USD
  await db.runAsync(
    `INSERT OR REPLACE INTO fx_rates (baseCode, quoteCode, rate, updatedAt) VALUES (?, ?, ?, ?)`,
    ["EUR", "USD", 1.08, now()],
  );

  // 1 USD = 0.93 EUR
  await db.runAsync(
    `INSERT OR REPLACE INTO fx_rates (baseCode, quoteCode, rate, updatedAt) VALUES (?, ?, ?, ?)`,
    ["USD", "EUR", 0.93, now()],
  );
}

/* ---------- Categories ---------- */

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "food",
    name: "Food",
    color: "#FF7043",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "transport",
    name: "Transport",
    color: "#42A5F5",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    color: "#AB47BC",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "utilities",
    name: "Utilities",
    color: "#26A69A",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "shopping",
    name: "Shopping",
    color: "#00F5D4",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "health",
    name: "Health",
    color: "#F15BB5",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "education",
    name: "Education",
    color: "#00BBF9",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "home",
    name: "Home",
    color: "#FF6B6B",
    createdAt: now(),
    updatedAt: now(),
  },
];

export async function seedCategories(): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    await insertCategory(category);
  }
}

/* ---------- Payment entries ---------- */

export const DEFAULT_PAYMENT_ENTRIES: PaymentEntry[] = [
  {
    id: "p_food_1",
    title: "Supermarket groceries",
    amount: 4500,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "food",
    dueDate: daysFromNow(-3),
    repeatRule: null,
    note: "Weekly shop",
    isPaid: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_transport_1",
    title: "Transit pass",
    amount: 3000,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "transport",
    dueDate: daysFromNow(-1),
    repeatRule: null,
    note: null,
    isPaid: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_subs_netflix",
    title: "Netflix",
    amount: 899,
    currencyCode: "USD",
    type: "subscription",
    categoryId: "subscriptions",
    dueDate: daysFromNow(5),
    repeatRule: "monthly",
    note: "Video streaming",
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_subs_weekly",
    title: "Gym Weekly",
    amount: 499, // 4.99
    currencyCode: "USD",
    type: "subscription",
    categoryId: "health",
    dueDate: daysFromNow(2),
    repeatRule: "weekly",
    note: "Weekly membership",
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_utilities",
    title: "Electricity",
    amount: 5200,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "utilities",
    dueDate: daysFromNow(10),
    repeatRule: null,
    note: "Monthly bill",
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_food_2",
    title: "Cafe lunch",
    amount: 1200,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "food",
    dueDate: daysFromNow(-7),
    repeatRule: null,
    note: "Business lunch",
    isPaid: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_transport_2",
    title: "Taxi",
    amount: 850,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "transport",
    dueDate: daysFromNow(-2),
    repeatRule: null,
    note: "Airport trip",
    isPaid: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_subs_spotify",
    title: "Spotify",
    amount: 1099, // $10.99
    currencyCode: "USD",
    type: "subscription",
    categoryId: "subscriptions",
    dueDate: daysFromNow(3),
    repeatRule: "monthly",
    note: "Music streaming",
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_utilities_water",
    title: "Water supply",
    amount: 1800,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "utilities",
    dueDate: daysFromNow(14),
    repeatRule: null,
    note: "Water bill",
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_subs_cloud",
    title: "Cloud Storage",
    amount: 299, // $2.99
    currencyCode: "USD",
    type: "subscription",
    categoryId: "subscriptions",
    dueDate: daysFromNow(1),
    repeatRule: "monthly",
    note: "Backup storage",
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_home_1",
    title: "Home supplies",
    amount: 7800,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "home",
    dueDate: daysFromNow(4),
    repeatRule: null,
    note: null,
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_internet",
    title: "Internet",
    amount: 3999,
    currencyCode: "USD",
    type: "bill",
    categoryId: "utilities",
    dueDate: daysFromNow(7),
    repeatRule: null,
    note: null,
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
];

export async function seedPaymentEntries(): Promise<void> {
  for (const entry of DEFAULT_PAYMENT_ENTRIES) {
    await insertPaymentEntry(entry);
  }
}
