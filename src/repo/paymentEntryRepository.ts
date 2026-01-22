import { db } from "../db/database";
import { PaymentEntry } from "../domain/PaymentEntry";

/**
 * Внутренний тип строки из SQLite: isPaid хранится как 0/1
 */
type PaymentEntryRow = Omit<PaymentEntry, "isPaid"> & { isPaid: number };

function mapRowToEntry(row: PaymentEntryRow): PaymentEntry {
  return {
    ...row,
    isPaid: row.isPaid === 1,
  };
}

function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Количество записей (можно использовать для seed/проверок)
 */
export async function getPaymentEntriesCount(): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) count FROM payment_entries"
  );
  return row?.count ?? 0;
}

/**
 * Получить все записи (по умолчанию сортируем по dueDate, затем по title)
 */
export async function getAllPaymentEntries(): Promise<PaymentEntry[]> {
  const rows = await db.getAllAsync<PaymentEntryRow>(
    `
    SELECT
      id,
      title,
      amount,
      currency,
      type,
      categoryId,
      dueDate,
      repeatRule,
      note,
      isPaid,
      createdAt,
      updatedAt
    FROM payment_entries
    ORDER BY dueDate ASC, title ASC
    `
  );

  return rows.map(mapRowToEntry);
}

/**
 * Получить запись по id
 */
export async function getPaymentEntryById(id: string): Promise<PaymentEntry | null> {
  const row = await db.getFirstAsync<PaymentEntryRow>(
    `
    SELECT
      id,
      title,
      amount,
      currency,
      type,
      categoryId,
      dueDate,
      repeatRule,
      note,
      isPaid,
      createdAt,
      updatedAt
    FROM payment_entries
    WHERE id = ?
    `,
    [id]
  );

  return row ? mapRowToEntry(row) : null;
}

/**
 * Получить записи по категории
 */
export async function getPaymentEntriesByCategory(categoryId: string): Promise<PaymentEntry[]> {
  const rows = await db.getAllAsync<PaymentEntryRow>(
    `
    SELECT
      id,
      title,
      amount,
      currency,
      type,
      categoryId,
      dueDate,
      repeatRule,
      note,
      isPaid,
      createdAt,
      updatedAt
    FROM payment_entries
    WHERE categoryId = ?
    ORDER BY dueDate ASC, title ASC
    `,
    [categoryId]
  );

  return rows.map(mapRowToEntry);
}

/**
 * Получить записи за период по dueDate (включительно)
 * dateFrom/dateTo — ISO-строки вида "2026-01-01T00:00:00.000Z"
 */
export async function getPaymentEntriesByDueDateRange(
  dateFrom: string,
  dateTo: string
): Promise<PaymentEntry[]> {
  const rows = await db.getAllAsync<PaymentEntryRow>(
    `
    SELECT
      id,
      title,
      amount,
      currency,
      type,
      categoryId,
      dueDate,
      repeatRule,
      note,
      isPaid,
      createdAt,
      updatedAt
    FROM payment_entries
    WHERE dueDate >= ? AND dueDate <= ?
    ORDER BY dueDate ASC, title ASC
    `,
    [dateFrom, dateTo]
  );

  return rows.map(mapRowToEntry);
}

/**
 * Вставка новой записи
 */
export async function insertPaymentEntry(entry: PaymentEntry): Promise<void> {
  await db.runAsync(
    `
    INSERT INTO payment_entries (
      id,
      title,
      amount,
      currency,
      type,
      categoryId,
      dueDate,
      repeatRule,
      note,
      isPaid,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      entry.id,
      entry.title,
      entry.amount,
      entry.currency,
      entry.type,
      entry.categoryId,
      entry.dueDate,
      entry.repeatRule ?? null,
      entry.note ?? null,
      boolToInt(entry.isPaid),
      entry.createdAt,
      entry.updatedAt,
    ]
  );
}

/**
 * Полное обновление записи
 */
export async function updatePaymentEntry(entry: PaymentEntry): Promise<void> {
  await db.runAsync(
    `
    UPDATE payment_entries
    SET
      title = ?,
      amount = ?,
      currency = ?,
      type = ?,
      categoryId = ?,
      dueDate = ?,
      repeatRule = ?,
      note = ?,
      isPaid = ?,
      updatedAt = ?
    WHERE id = ?
    `,
    [
      entry.title,
      entry.amount,
      entry.currency,
      entry.type,
      entry.categoryId,
      entry.dueDate,
      entry.repeatRule ?? null,
      entry.note ?? null,
      boolToInt(entry.isPaid),
      entry.updatedAt,
      entry.id,
    ]
  );
}

/**
 * Быстрое изменение статуса оплаты (полезно для UI)
 */
export async function setPaymentEntryPaidStatus(
  id: string,
  isPaid: boolean,
  updatedAt: string
): Promise<void> {
  await db.runAsync(
    `
    UPDATE payment_entries
    SET isPaid = ?, updatedAt = ?
    WHERE id = ?
    `,
    [boolToInt(isPaid), updatedAt, id]
  );
}

/**
 * Удалить запись по id
 */
export async function deletePaymentEntry(id: string): Promise<void> {
  await db.runAsync("DELETE FROM payment_entries WHERE id = ?", [id]);
}

/**
 * Аналитика: сумма расходов по категориям за период.
 * Возвращает массив объектов { categoryId, totalAmount }
 */
export async function getExpenseTotalsByCategory(
  dateFrom: string,
  dateTo: string
): Promise<Array<{ categoryId: string; totalAmount: number }>> {
  const rows = await db.getAllAsync<{ categoryId: string; totalAmount: number }>(
    `
    SELECT
      categoryId,
      SUM(amount) totalAmount
    FROM payment_entries
    WHERE dueDate >= ? AND dueDate <= ?
    GROUP BY categoryId
    ORDER BY totalAmount DESC
    `,
    [dateFrom, dateTo]
  );

  // SUM может вернуть null, если нет строк — но тогда rows будет пустым.
  return rows.map(r => ({
    categoryId: r.categoryId,
    totalAmount: r.totalAmount ?? 0,
  }));
}

/**
 * Аналитика: общая сумма расходов за период
 */
export async function getExpenseTotal(
  dateFrom: string,
  dateTo: string
): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    `
    SELECT SUM(amount) total
    FROM payment_entries
    WHERE dueDate >= ? AND dueDate <= ?
    `,
    [dateFrom, dateTo]
  );

  return row?.total ?? 0;
}
