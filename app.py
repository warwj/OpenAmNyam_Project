from flask import Flask, render_template, request, jsonify, send_file
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
import torch
import pandas as pd
import os

app = Flask(__name__)

# Пути к файлам
MODEL_DIR = "D:/modelivan"  # Укажите корректный путь к модели
FEEDBACK_FILE = "user_feedback.csv"
UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "results"

# Создаем папки, если их нет
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# Загружаем предобученную модель
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)

# Словарь для отображения числовых меток в текст
sentiment_mapping = {
    0: "Отрицательный тон 😞",
    1: "Нейтральный тон 😐",
    2: "Положительный тон 😊"
}

@app.route("/")
def index():
    """Отображает главную страницу"""
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    """Обрабатывает текст и возвращает предсказанную тональность"""
    data = request.get_json()
    text = data.get("text", "")
    if not text.strip():
        return jsonify({"sentiment": "Введите текст для анализа."})

    # Токенизация и предсказание
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    outputs = model(**inputs)
    pred = torch.argmax(outputs.logits, dim=1).item()
    sentiment = sentiment_mapping.get(pred, "Неизвестно")

    return jsonify({"sentiment": sentiment, "message_id": text})  # Используем текст как message_id

@app.route("/upload", methods=["POST"])
def upload():
    """Обрабатывает загруженный Excel-файл и возвращает обработанный файл"""
    if "file" not in request.files:
        return jsonify({"error": "Файл не найден"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Файл не выбран"}), 400

    try:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        df = pd.read_excel(file_path, engine="openpyxl")

        # Анализируем каждый текст из первого столбца
        for index, text in enumerate(df.iloc[:, 0]):
            if isinstance(text, str) and text.strip():
                inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
                outputs = model(**inputs)
                pred = torch.argmax(outputs.logits, dim=1).item()
                sentiment = sentiment_mapping.get(pred, "Неизвестно")
                df.loc[index, "Тональность"] = sentiment

        result_filename = f"results_{file.filename}"
        result_path = os.path.join(RESULT_FOLDER, result_filename)
        df.to_excel(result_path, index=False, engine="openpyxl")

        return jsonify({"file_url": f"/download/{result_filename}"})
    except Exception as e:
        return jsonify({"error": f"Ошибка обработки файла: {str(e)}"}), 500

@app.route("/correct_feedback", methods=["POST"])
def correct_feedback():
    """Сохраняет исправления пользователя для дальнейшего дообучения модели"""
    data = request.get_json()
    message_id = data.get("message_id")
    correct_sentiment = data.get("correct_sentiment")

    if not message_id or not correct_sentiment:
        return jsonify({"error": "Некорректные данные"}), 400

    # Сохраняем исправление в CSV
    feedback_data = pd.DataFrame([[message_id, correct_sentiment]], columns=["message_id", "correct_sentiment"])
    if os.path.exists(FEEDBACK_FILE):
        feedback_data.to_csv(FEEDBACK_FILE, mode='a', header=False, index=False, encoding="utf-8")
    else:
        feedback_data.to_csv(FEEDBACK_FILE, mode='w', index=False, encoding="utf-8")

    return jsonify({"message": "Отзыв сохранен"}), 200

@app.route("/train", methods=["POST"])
def train_model():
    """Дообучает модель на пользовательских исправлениях"""
    if not os.path.exists(FEEDBACK_FILE):
        return jsonify({"error": "Нет данных для дообучения"}), 400

    feedback_data = pd.read_csv(FEEDBACK_FILE)

    if feedback_data.empty:
        return jsonify({"error": "Файл с исправлениями пуст"}), 400

    texts = feedback_data["message_id"].tolist()
    labels = feedback_data["correct_sentiment"].tolist()

    # Преобразуем текстовые метки в числовые
    label_map = {"negative": 0, "neutral": 1, "positive": 2}
    labels = torch.tensor([label_map[label] for label in labels])

    # Токенизируем тексты
    inputs = tokenizer(texts, padding=True, truncation=True, return_tensors="pt")

    # Определяем параметры тренировки
    training_args = TrainingArguments(
        output_dir="./fine_tuned_model",
        num_train_epochs=3,
        per_device_train_batch_size=4,
        save_steps=500,
        save_total_limit=2,
        logging_dir="./logs",
    )

    # Запускаем дообучение
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset={"input_ids": inputs["input_ids"], "labels": labels},
    )
    trainer.train()

    # Сохраняем обновленную модель
    model.save_pretrained("fine_tuned_rubert")
    tokenizer.save_pretrained("fine_tuned_rubert")

    return jsonify({"message": "Модель успешно дообучена!"}), 200

@app.route("/download/<filename>")
def download_file(filename):
    """Отправляет обработанный файл на скачивание"""
    file_path = os.path.join(RESULT_FOLDER, filename)
    return send_file(file_path, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True, threaded=True, host="0.0.0.0", port=5000)
