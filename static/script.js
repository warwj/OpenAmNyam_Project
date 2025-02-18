document.addEventListener("DOMContentLoaded", function () {
    // Проверяем, включена ли темная тема в localStorage
    if (localStorage.getItem("dark-mode") === "enabled") {
        document.body.classList.add("dark-mode");
        document.getElementById("theme-toggle").textContent = "☀️"; // Меняем иконку
    }

    showBotInstructions();

    // Убеждаемся, что шкала исправления тональности скрыта при загрузке
    document.getElementById("feedback-form").classList.add("hidden");

    let fileInput = document.getElementById("file-input");
    let uploadBtn = document.getElementById("upload-btn");
    let fileNameDisplay = document.getElementById("file-name");
    let fileNameText = document.getElementById("file-name-text");

    // Гарантированно скрываем элементы при загрузке страницы
    fileNameDisplay.style.display = "none";
    uploadBtn.style.display = "none";

    fileInput.addEventListener("change", function (event) {
        let file = event.target.files[0];

        if (file && file.name.endsWith(".xlsx")) {
            fileNameText.textContent = file.name; // Устанавливаем текст
            fileNameDisplay.style.display = "block"; // Показываем пометку
            uploadBtn.style.display = "inline-block"; // Показываем кнопку
        } else {
            fileNameDisplay.style.display = "none"; // Скрываем пометку
            uploadBtn.style.display = "none"; // Скрываем кнопку
        }
    });

    // Удаляем инструкцию после первого ввода сообщения
    document.getElementById("user-input").addEventListener("keypress", function (event) {
        if (document.getElementById("bot-instruction")) {
            document.getElementById("bot-instruction").remove();
        }
    });

    // Поддержка темной темы для инструкции
    if (document.body.classList.contains("dark-mode")) {
        updateInstructionTheme();
    }

    // Отправка сообщения по нажатию Enter
    document.getElementById("user-input").addEventListener("keypress", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
});

// Функция для добавления инструкции при запуске
function showBotInstructions() {
    let chatContainer = document.querySelector(".chat-container");
    let instructionDiv = document.createElement("div");
    instructionDiv.id = "bot-instruction";
    instructionDiv.innerHTML = `
        <strong>Привет! Я ваш бот-помощник </strong><br>
        Вот что я умею:<br>
        ▫️ Определять тональность текста — просто напишите сообщение.<br>
        ▫️ Обрабатывать Excel-файлы — загрузите файл с текстами, и я определю их тональность.<br>
        ▫️ Переключать тёмную тему 🌙.<br><br>
        <br>
        Если тональность неверная, нажмите <em>"Тональность определена ошибочно"</em>.<br>
        <strong>Чтобы начать, введите текст или загрузите файл!</strong><br>
    `;

     // Стилизация
    instructionDiv.style.position = "absolute";
    instructionDiv.style.top = "50%";
    instructionDiv.style.left = "50%";
    instructionDiv.style.transform = "translate(-50%, -50%)";
    instructionDiv.style.width = "80%";
    instructionDiv.style.maxWidth = "500px";
    instructionDiv.style.background = "#f8f9fa";
    instructionDiv.style.padding = "15px";
    instructionDiv.style.borderRadius = "12px";
    instructionDiv.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.1)";
    instructionDiv.style.textAlign = "center";
    instructionDiv.style.fontSize = "14px";
    instructionDiv.style.zIndex = "1000";

    // Подключаем стили в зависимости от темы
    updateInstructionTheme(instructionDiv);

    // Добавляем в контейнер
    chatContainer.appendChild(instructionDiv);
}

// Функция обновления инструкции под темную тему
function updateInstructionTheme(instructionDiv = document.getElementById("bot-instruction")) {
    if (!instructionDiv) return;

    if (document.body.classList.contains("dark-mode")) {
        instructionDiv.style.background = "#333";
        instructionDiv.style.color = "#ddd";
        instructionDiv.style.boxShadow = "0px 4px 10px rgba(255, 255, 255, 0.1)";
    } else {
        instructionDiv.style.background = "#f8f9fa";
        instructionDiv.style.color = "#000";
        instructionDiv.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.1)";
    }
}

// Переключение темной темы
function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    let themeButton = document.getElementById("theme-toggle");
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("dark-mode", "enabled");
        themeButton.textContent = "☀️";
    } else {
        localStorage.setItem("dark-mode", "disabled");
        themeButton.textContent = "🌙";
    }

    // Обновляем тему инструкции, если она еще отображается
    updateInstructionTheme();
}

let lastMessageId = null;

function sendMessage() {
    let userInput = document.getElementById("user-input");
    let message = userInput.value.trim();
    if (message === "") return;

     // Удаляем инструкцию перед отправкой первого сообщения
    if (document.getElementById("bot-instruction")) {
        document.getElementById("bot-instruction").remove();
    }

    addMessage("user", message);
    userInput.value = "";

    fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message })
    })
    .then(response => response.json())
    .then(data => {
        addMessage("bot", data.sentiment);
        lastMessageId = data.message_id;
    });
}

function uploadFile() {
    let fileInput = document.getElementById("file-input");
    let file = fileInput.files[0];

    if (!file) {
        alert("Файл не выбран.");
        return;
    }

    // Удаляем инструкцию перед отправкой первого файла
    if (document.getElementById("bot-instruction")) {
        document.getElementById("bot-instruction").remove();
    }

    addMessage("user", `📂 Отправлен файл: ${file.name}`);

    let formData = new FormData();
    formData.append("file", file);

    fetch("/upload", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            addMessage("bot", `❌ Ошибка: ${data.error}`);
        } else {
            addMessage("bot", `✅ Файл обработан! <a href="${data.file_url}" download>🔗 Скачать результат</a>`);
        }
    });
}

// Показать/скрыть форму исправления тональности
function showFeedbackForm() {
    let feedbackForm = document.getElementById("feedback-form");
    feedbackForm.classList.toggle("hidden");
}

function sendCorrection(correctSentiment) {
    if (!lastMessageId) {
        alert("Ошибка: отсутствует идентификатор сообщения.");
        return;
    }

    fetch("/correct_feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: lastMessageId, correct_sentiment: correctSentiment })
    })
    .then(() => {
        alert("Спасибо! Ваш отзыв учтен.");
        document.getElementById("feedback-form").classList.add("hidden");
    });
}

function addMessage(sender, text) {
    let chatBox = document.getElementById("chat-box");
    let messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message", sender);
    messageDiv.innerHTML = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
