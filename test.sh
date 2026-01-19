#!/bin/bash

PROJECT_DIR="bills-subscriptions"
CURRENT_DIR="$(basename "$(pwd)")"

# Проверка директории
if [ "$CURRENT_DIR" != "$PROJECT_DIR" ]; then
  echo "Ошибка: скрипт должен быть запущен из директории '$PROJECT_DIR'"
  echo "Текущая директория: $CURRENT_DIR"
  exit 1
fi

# Очистка экрана
clear

echo "Директория проекта проверена: $PROJECT_DIR"
echo "Запуск тестов..."
echo "------------------------------"

npm test
