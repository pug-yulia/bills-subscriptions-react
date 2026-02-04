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
}

/* ---------- Categories ---------- */

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "food",
    name: "Еда",
    color: "#FF7043",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "transport",
    name: "Транспорт",
    color: "#42A5F5",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "subscriptions",
    name: "Подписки",
    color: "#AB47BC",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "utilities",
    name: "Коммунальные услуги",
    color: "#26A69A",
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
    title: "Продукты в супермаркете",
    amount: 4500,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "food",
    dueDate: daysFromNow(-3),
    repeatRule: null,
    note: "Еженедельная покупка",
    isPaid: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_transport_1",
    title: "Проездной билет",
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
    note: "Видео-сервис",
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
    categoryId: "subscriptions",
    dueDate: daysFromNow(2),
    repeatRule: "weekly",
    note: "Еженедельная подписка",
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_utilities",
    title: "Электроэнергия",
    amount: 5200,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "utilities",
    dueDate: daysFromNow(10),
    repeatRule: null,
    note: "Квитанция за месяц",
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },

  {
    id: "p_food_2",
    title: "Обед в кафе",
    amount: 1200,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "food",
    dueDate: daysFromNow(-7),
    repeatRule: null,
    note: "Бизнес-ланч",
    isPaid: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_transport_2",
    title: "Такси",
    amount: 850,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "transport",
    dueDate: daysFromNow(-2),
    repeatRule: null,
    note: "Поездка в аэропорт",
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
    note: "Музыкальный сервис",
    isPaid: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "p_utilities_water",
    title: "Водоснабжение",
    amount: 1800,
    currencyCode: "RUB",
    type: "bill",
    categoryId: "utilities",
    dueDate: daysFromNow(14),
    repeatRule: null,
    note: "Квитанция за воду",
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
    note: "Резервное копирование",
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
