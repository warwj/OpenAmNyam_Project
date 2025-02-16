document.addEventListener("DOMContentLoaded", function () {
    // Проверяем, включена ли темная тема в localStorage
    if (localStorage.getItem("dark-mode") === "enabled") {
        document.body.classList.add("dark-mode");
        document.getElementById("theme-toggle").textContent = "☀️"; // Меняем иконку
    }

    // Убеждаемся, что шкала исправления тональности скрыта при загрузке
    document.getElementById("feedback-form").classList.add("hidden");

    // Отправка сообщения по нажатию Enter
    document.getElementById("user-input").addEventListener("keypress", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // Обработчик выбора файла
    document.getElementById("file-input").addEventListener("change", function (event) {
        let file = event.target.files[0];
        let uploadBtn = document.getElementById("upload-btn");

        if (file) {
            uploadBtn.disabled = false;
        } else {
            uploadBtn.disabled = true;
        }
    });
});

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
}

function sendMessage() {
    let userInput = document.getElementById("user-input");
    let message = userInput.value.trim();
    if (message === "") return;

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
    });
}

function uploadFile() {
    let fileInput = document.getElementById("file-input");
    let file = fileInput.files[0];

    if (!file) {
        alert("Файл не выбран.");
        return;
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
    fetch("/correct_feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: "last_message", correct_sentiment: correctSentiment })
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
