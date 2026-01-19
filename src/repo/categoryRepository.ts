import { db } from "../db/database";
import { Category } from "../domain/Category";

/**
 * Получить количество категорий (для seed-инициализации)
 */
export async function getCategoriesCount(): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM categories`,
  );
  return row?.count ?? 0;
}

/**
 * Получить все категории
 */
export async function getAllCategories(): Promise<Category[]> {
  const rows = await db.getAllAsync<Category>(
    `
    SELECT
      id,
      name,
      color,
      icon,
      createdAt,
      updatedAt
    FROM categories
    ORDER BY name ASC
    `,
  );

  return rows;
}

/**
 * Получить категорию по id
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const row = await db.getFirstAsync<Category>(
    `
    SELECT
      id,
      name,
      color,
      icon,
      createdAt,
      updatedAt
    FROM categories
    WHERE id = ?
    `,
    [id],
  );
  return row ?? null;
}

/**
 * Добавить категорию
 */
export async function insertCategory(category: Category): Promise<void> {
  await db.runAsync(
    `
    INSERT INTO categories (
      id,
      name,
      color,
      icon,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      category.id,
      category.name,
      category.color ?? null,
      category.icon ?? null,
      category.createdAt,
      category.updatedAt,
    ],
  );
}

/**
 * Обновить категорию
 */
export async function updateCategory(category: Category): Promise<void> {
  await db.runAsync(
    `
    UPDATE categories
    SET
      name = ?,
      color = ?,
      icon = ?,
      updatedAt = ?
    WHERE id = ?
    `,
    [
      category.name,
      category.color ?? null,
      category.icon ?? null,
      category.updatedAt,
      category.id,
    ],
  );
}

/**
 * Удалить категорию
 */
export async function deleteCategory(id: string): Promise<void> {
  await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
}
