import { Category } from "../src/domain/Category";

const mockDb = {
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

type Repo = typeof import("../src/repo/categoryRepository");

describe("categoryRepository", () => {
  let repo: Repo;

  beforeEach(() => {
    jest.resetModules();

    mockDb.runAsync.mockReset();
    mockDb.getFirstAsync.mockReset();
    mockDb.getAllAsync.mockReset();

    jest.doMock("../src/db/database", () => ({
      __esModule: true,
      db: mockDb,
    }));

    // ВАЖНО: require ПОСЛЕ doMock()
    repo = require("../src/repo/categoryRepository");
  });

  test("getCategoriesCount: возвращает 0 если row=null", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    const count = await repo.getCategoriesCount();

    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
      "SELECT COUNT(*) as count FROM categories",
    );
    expect(count).toBe(0);
  });

  test("getCategoriesCount: возвращает значение count", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 4 });

    const count = await repo.getCategoriesCount();

    expect(count).toBe(4);
  });

  test("getAllCategories: возвращает массив категорий", async () => {
    const rows: Category[] = [
      {
        id: "food",
        name: "Еда",
        color: "#FF7043",
        icon: undefined,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    mockDb.getAllAsync.mockResolvedValueOnce(rows);

    const result = await repo.getAllCategories();

    expect(mockDb.getAllAsync).toHaveBeenCalled();
    expect(result).toEqual(rows);
  });

  test("getCategoryById: возвращает null если не найдено", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    const result = await repo.getCategoryById("x");

    expect(result).toBeNull();
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), [
      "x",
    ]);
  });

  test("insertCategory: вызывает runAsync с корректными параметрами", async () => {
    const c: Category = {
      id: "transport",
      name: "Транспорт",
      color: "#42A5F5",
      icon: "car",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    mockDb.runAsync.mockResolvedValueOnce({} as any);

    await repo.insertCategory(c);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO categories"),
      [c.id, c.name, c.color, c.icon, c.createdAt, c.updatedAt],
    );
  });

  test("updateCategory: обновляет name/color/icon/updatedAt по id", async () => {
    const c: Category = {
      id: "food",
      name: "Еда (обновлено)",
      color: "#000000",
      icon: undefined,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    };

    mockDb.runAsync.mockResolvedValueOnce({} as any);

    await repo.updateCategory(c);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE categories"),
      [c.name, c.color, null, c.updatedAt, c.id],
    );
  });

  test("deleteCategory: удаляет по id", async () => {
    mockDb.runAsync.mockResolvedValueOnce({} as any);

    await repo.deleteCategory("food");

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      "DELETE FROM categories WHERE id = ?",
      ["food"],
    );
  });
});
