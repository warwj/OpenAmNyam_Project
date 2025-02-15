from flask import Flask, render_template, request, jsonify, send_file
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import pandas as pd
import os

app = Flask(__name__)

# Путь к сохранённой модели (распакованный архив)
model_directory = "D:\modelivan"  # Укажите корректный путь
tokenizer = AutoTokenizer.from_pretrained(model_directory)
model = AutoModelForSequenceClassification.from_pretrained(model_directory)

# Словарь для отображения числовых меток в понятный текст с эмодзи
sentiment_mapping = {
    0: "Отрицательный тон 😞",
    1: "Нейтральный тон 😐",
    2: "Положительный тон 😊"
}

UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "results"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    """Обрабатывает текст из запроса и возвращает предсказанную тональность с использованием модели"""
    data = request.get_json()
    text = data.get("text", "")
    if not text.strip():
        return jsonify({"sentiment": "Введите текст для анализа."})

    # Токенизация и предсказание
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    outputs = model(**inputs)
    pred = torch.argmax(outputs.logits, dim=1).item()
    sentiment = sentiment_mapping.get(pred, "Неизвестно")

    return jsonify({"sentiment": sentiment})


@app.route("/upload", methods=["POST"])
def upload():
    """Обрабатывает загруженный Excel-файл, прогнозирует тональность для каждого текста в первом столбце,
    сохраняет результат и возвращает ссылку для скачивания"""
    if "file" not in request.files:
        return jsonify({"error": "Файл не найден"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Файл не выбран"}), 400

    try:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        df = pd.read_excel(file_path, engine="openpyxl")

        # Обрабатываем каждую строку (анализируем первый столбец)
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


@app.route("/download/<filename>")
def download_file(filename):
    """Отправляет обработанный файл на скачивание"""
    file_path = os.path.join(RESULT_FOLDER, filename)
    return send_file(file_path, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True, threaded=True, host="0.0.0.0", port=5000)


