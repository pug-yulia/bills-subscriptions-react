import { db } from "../db/database";
import { PaymentEntry } from "../domain/PaymentEntry";

type PaymentEntryRow = Omit<PaymentEntry, "isPaid"> & { isPaid: number };

function mapRowToEntry(row: PaymentEntryRow): PaymentEntry {
  return { ...row, isPaid: row.isPaid === 1 };
}
function boolToInt(v: boolean) {
  return v ? 1 : 0;
}

export async function getPaymentEntriesCount(): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) count FROM payment_entries",
  );
  return row?.count ?? 0;
}

export async function getAllPaymentEntries(): Promise<PaymentEntry[]> {
  const rows = await db.getAllAsync<PaymentEntryRow>(`
    SELECT
      id,
      title,
      amount,
      currencyCode,
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
  `);

  return rows.map(mapRowToEntry);
}

export async function getPaymentEntryById(
  id: string,
): Promise<PaymentEntry | null> {
  const row = await db.getFirstAsync<PaymentEntryRow>(
    `
    SELECT
      id,
      title,
      amount,
      currencyCode,
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
    [id],
  );

  return row ? mapRowToEntry(row) : null;
}

export async function insertPaymentEntry(entry: PaymentEntry): Promise<void> {
  await db.runAsync(
    `
    INSERT INTO payment_entries (
      id,
      title,
      amount,
      currencyCode,
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
      entry.currencyCode,
      entry.type,
      entry.categoryId,
      entry.dueDate,
      entry.repeatRule ?? null,
      entry.note ?? null,
      boolToInt(entry.isPaid),
      entry.createdAt,
      entry.updatedAt,
    ],
  );
}

export async function updatePaymentEntry(entry: PaymentEntry): Promise<void> {
  await db.runAsync(
    `
    UPDATE payment_entries
    SET
      title = ?,
      amount = ?,
      currencyCode = ?,
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
      entry.currencyCode,
      entry.type,
      entry.categoryId,
      entry.dueDate,
      entry.repeatRule ?? null,
      entry.note ?? null,
      boolToInt(entry.isPaid),
      entry.updatedAt,
      entry.id,
    ],
  );
}

export async function deletePaymentEntry(id: string): Promise<void> {
  await db.runAsync("DELETE FROM payment_entries WHERE id = ?", [id]);
}

export async function setPaymentEntryPaidStatus(
  id: string,
  isPaid: boolean,
  updatedAt: string,
): Promise<void> {
  await db.runAsync(
    `
    UPDATE payment_entries
    SET
      isPaid = ?,
      updatedAt = ?
    WHERE id = ?
    `,
    [isPaid ? 1 : 0, updatedAt, id],
  );
}
