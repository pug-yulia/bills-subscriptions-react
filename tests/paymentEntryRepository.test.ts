import { PaymentEntry } from "../src/domain/PaymentEntry";

const mockDb = {
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

type Repo = typeof import("../src/repo/paymentEntryRepository");

describe("paymentEntryRepository", () => {
  let repo: Repo;

  const baseEntry: PaymentEntry = {
    id: "p1",
    title: "Netflix",
    amount: 180, // центы/копейки
    currencyCode: "USD",
    type: "subscription",
    categoryId: "subscriptions",
    dueDate: "2026-01-15T00:00:00.000Z",
    repeatRule: "monthly",
    note: "Test note",
    isPaid: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.resetModules();

    mockDb.runAsync.mockReset();
    mockDb.getFirstAsync.mockReset();
    mockDb.getAllAsync.mockReset();

    jest.doMock("../src/db/database", () => ({
      __esModule: true,
      db: mockDb,
    }));

    repo = require("../src/repo/paymentEntryRepository");
  });

  test("getPaymentEntriesCount: возвращает 0 если row=null", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    const count = await repo.getPaymentEntriesCount();

    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
      "SELECT COUNT(*) count FROM payment_entries",
    );
    expect(count).toBe(0);
  });

  test("getPaymentEntriesCount: возвращает значение count", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 7 });

    const count = await repo.getPaymentEntriesCount();

    expect(count).toBe(7);
  });

  test("getPaymentEntryById: возвращает null если не найдено", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    const res = await repo.getPaymentEntryById("x");

    expect(res).toBeNull();
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), [
      "x",
    ]);
  });

  test("getPaymentEntryById: маппит isPaid 0 -> false", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      ...baseEntry,
      isPaid: 0, // как в SQLite
    });

    const res = await repo.getPaymentEntryById(baseEntry.id);

    expect(res).not.toBeNull();
    expect(res!.isPaid).toBe(false);
  });

  test("getPaymentEntryById: маппит isPaid 1 -> true", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      ...baseEntry,
      isPaid: 1,
    });

    const res = await repo.getPaymentEntryById(baseEntry.id);

    expect(res).not.toBeNull();
    expect(res!.isPaid).toBe(true);
  });

  test("getAllPaymentEntries: возвращает массив и маппит isPaid", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { ...baseEntry, isPaid: 0 },
      { ...baseEntry, id: "p2", isPaid: 1 },
    ]);

    const res = await repo.getAllPaymentEntries();

    expect(mockDb.getAllAsync).toHaveBeenCalled();
    expect(res).toHaveLength(2);
    expect(res[0].isPaid).toBe(false);
    expect(res[1].isPaid).toBe(true);
  });

  test("insertPaymentEntry: конвертирует isPaid=false в 0, repeatRule/note -> значения", async () => {
    mockDb.runAsync.mockResolvedValueOnce({} as any);

    await repo.insertPaymentEntry(baseEntry);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO payment_entries"),
      [
        baseEntry.id,
        baseEntry.title,
        baseEntry.amount,
        baseEntry.currencyCode,
        baseEntry.type,
        baseEntry.categoryId,
        baseEntry.dueDate,
        baseEntry.repeatRule, // не null
        baseEntry.note, // не null
        0, // isPaid
        baseEntry.createdAt,
        baseEntry.updatedAt,
      ],
    );
  });

  test("insertPaymentEntry: repeatRule/note -> null если не заданы", async () => {
    mockDb.runAsync.mockResolvedValueOnce({} as any);

    const entry: PaymentEntry = {
      ...baseEntry,
      id: "p3",
      repeatRule: undefined as any, // допускаем отсутствие
      note: undefined,
      isPaid: true,
    };

    await repo.insertPaymentEntry(entry);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO payment_entries"),
      [
        entry.id,
        entry.title,
        entry.amount,
        entry.currencyCode,
        entry.type,
        entry.categoryId,
        entry.dueDate,
        null, // repeatRule
        null, // note
        1, // isPaid=true -> 1
        entry.createdAt,
        entry.updatedAt,
      ],
    );
  });

  test("updatePaymentEntry: обновляет поля и конвертирует isPaid", async () => {
    mockDb.runAsync.mockResolvedValueOnce({} as any);

    const entry: PaymentEntry = {
      ...baseEntry,
      title: "Netflix Premium",
      isPaid: true,
      updatedAt: "2026-01-03T00:00:00.000Z",
    };

    await repo.updatePaymentEntry(entry);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE payment_entries"),
      [
        entry.title,
        entry.amount,
        entry.currencyCode,
        entry.type,
        entry.categoryId,
        entry.dueDate,
        entry.repeatRule ?? null,
        entry.note ?? null,
        1, // isPaid=true
        entry.updatedAt,
        entry.id,
      ],
    );
  });

  test("setPaymentEntryPaidStatus: выставляет isPaid и updatedAt", async () => {
    mockDb.runAsync.mockResolvedValueOnce({} as any);

    await repo.setPaymentEntryPaidStatus(
      "p1",
      true,
      "2026-01-10T00:00:00.000Z",
    );

    expect(mockDb.runAsync).toHaveBeenCalledWith(expect.any(String), [
      1,
      "2026-01-10T00:00:00.000Z",
      "p1",
    ]);
  });

  test("deletePaymentEntry: удаляет по id", async () => {
    mockDb.runAsync.mockResolvedValueOnce({} as any);

    await repo.deletePaymentEntry("p1");

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      "DELETE FROM payment_entries WHERE id = ?",
      ["p1"],
    );
  });
});
