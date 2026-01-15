import { Category } from '../domain/Category';
import { insertCategory } from '../repo/categoryRepository';

function now():string {
    return new Date().toISOString();
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: 'Еда',
    color: '#FF7043',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'transport',
    name: 'Транспорт',
    color: '#42A5F5',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'subscriptions',
    name: 'Подписки',
    color: '#AB47BC',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'utilities',
    name: 'Коммунальные услуги',
    color: '#26A69A',
    createdAt: now(),
    updatedAt: now(),
  },
];

export async function seedCategories():Promise<void> {
    for(const category of DEFAULT_CATEGORIES){
        await insertCategory(category);
    }
}