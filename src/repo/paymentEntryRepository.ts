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

export async function getPaymentEntriesCount(): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM payment_entries",
  );
  return row?.count ?? 0;
}
