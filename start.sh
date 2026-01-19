#!/bin/bash

PROJECT_DIR="bills-subscriptions"
CURRENT_DIR="$(basename "$(pwd)")"

if [ "$CURRENT_DIR" != "$PROJECT_DIR" ]; then
  echo "Ошибка: скрипт должен быть запущен из директории '$PROJECT_DIR'"
  echo "Текущая директория: $CURRENT_DIR"
  exit 1
fi

echo "Директория проекта проверена: $PROJECT_DIR"
echo "Запуск Expo (iOS, очистка кеша)..."

npx expo start -c --ios
