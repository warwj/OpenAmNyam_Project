document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("user-input").addEventListener("keypress", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    document.getElementById("file-input").addEventListener("change", function (event) {
        let file = event.target.files[0];
        let fileNameDisplay = document.getElementById("file-name");
        let uploadBtn = document.getElementById("upload-btn");

        if (file) {
            fileNameDisplay.textContent = "Выбран файл: " + file.name;
            uploadBtn.disabled = false;
        } else {
            fileNameDisplay.textContent = "Файл не выбран";
            uploadBtn.disabled = true;
        }
    });
});

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
        addMessage("bot", "⚠️ Файл не выбран.");
        return;
    }

    addMessage("user", `📂 Отправка файла: ${file.name}...`);

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
            addMessage("bot", `✅ Файл загружен! <a href="${data.file_url}" download>🔗 Скачать результат</a>`);
        }
    })
    .catch(() => {
        addMessage("bot", "❌ Ошибка загрузки файла.");
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
