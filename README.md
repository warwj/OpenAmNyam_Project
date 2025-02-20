Анализ тональности текста с помощью ИИ

Описание проекта:

Этот проект представляет собой веб-приложение для анализа тональности текста с использованием модели машинного обучения. Приложение позволяет:
- Анализировать тональность введенного пользователем текста (положительная, нейтральная, отрицательная)
- Обрабатывать Excel-файлы с текстами и определять их тональность
- Использовать модель дообученную RuBERT-Tiny для анализа тональности
- Поддерживать тёмную тему для удобства использования
- Позволять пользователю отправлять обратную связь и дообучать модель

Функционал
- Чат-бот: Вводите текст и получайте анализ тональности
- Обработка Excel-файлов: Загружайте файлы, и бот определит тональность каждого сообщения
- Исправление ошибок: Если бот ошибся, можно отправить корректировку
- Тёмная тема: Переключение интерфейса для комфорта глаз

Архитектура проекта
- Backend: Flask (Python) + Hugging Face Transformers
- Frontend: HTML + CSS + JavaScript
- Модель: `rubert-tiny-sentiment-balanced`
- База данных обратной связи: CSV-файл для дообучения модели

Установка и запуск

Откройте приложение в браузере
Перейдите по адресу: https://openamnyamm-goshaloh.amvera.io/

Или:
1. Клонируйте репозиторий
```bash
git clone https://github.com/username/sentiment-analysis-bot.git
```

2. Установите зависимости
```bash
pip install -r requirements.txt
```

3. Запустите Flask-сервер
```bash
python app.py
```

Модель и метрики
- Используется Model1 (на основе RuBERT-Tiny-Sentiment), дообученная на тональности текстов
- Метрики:
  - Accuracy: 90%
  - Recall: 89%
  - F1-score: 89%
  - Время обработки: ~3 секунды на 1000 текстов
    
Model2 - к датасету на котором дообучивалась Model1 добавлены 50 элементов с помощью обратной связи при общении.

Model3 - к датасету на котором дообучивалась Model1 добавлены 65 элементов с помощью обратной связи при общении.

Model4 - к датасету на котором дообучивалась Model1 добавлены размеченные датасеты из 100 и 34 элементов.

Model5 - к датасету на котором дообучивалась Model1 добавлены 65 элементов с помощью обратной связи при общении и исправленные ответы на размеченные датасеты из 100 и 34 элементов.


Автор: Кирпичев Иван, Маркова Варя

Email: kirpichev2002@mail.ru, varvara.5160mark@gmail.com
