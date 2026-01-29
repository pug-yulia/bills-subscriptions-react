#!/bin/bash

PROJECT_DIR="bills-subscriptions"
CURRENT_DIR="$(basename "$(pwd)")"

if [ "$CURRENT_DIR" != "$PROJECT_DIR" ]; then
  echo "Ошибка: скрипт должен быть запущен из директории '$PROJECT_DIR'"
  echo "Текущая директория: $CURRENT_DIR"
  exit 1
fi

RESET_FLAG="0"
if [ "$1" = "--reset-db" ]; then
  RESET_FLAG="1"
fi

echo "Директория проекта проверена: $PROJECT_DIR"
if [ "$RESET_FLAG" = "1" ]; then
  echo "Режим: сброс БД при старте (RESET_DB=1)"
else
  echo "Режим: обычный запуск"
fi

# Передаём переменную окружения в Expo (она попадёт в process.env)
export RESET_DB="$RESET_FLAG"

echo "Запуск Expo (iOS, очистка кеша)..."
npx expo start -c --ios
