import * as SQLite from 'expo-sqlite';
import {CREATE_TABLES_SQL} from './schema';

export const db = SQLite.openDatabaseSync('payments.db');

export async function initDb(): Promise<void> {
    await db.execAsync(CREATE_TABLES_SQL);
}