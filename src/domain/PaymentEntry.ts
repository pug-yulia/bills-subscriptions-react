export type PaymentType = "bill" | "subscription";

export type RepeatRule = "daily" | "weekly" | "monthly" | "yearly";

export interface PaymentEntry {
  id: string;
  title: string;
  /** сумма в минимальных единицах валюты (центы/копейки) */
  amount: number;
  /** код валюты, например "USD", "RUB" */
  currencyCode: string;
  type: PaymentType;
  categoryId: string;
  /** ISO-строка даты ближайшего платежа */
  dueDate: string;
  /** только для subscription; для bill отсутствует/null */
  repeatRule?: RepeatRule | null;
  note?: string | null;
  /** в SQLite хранится как 0/1 */
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}
