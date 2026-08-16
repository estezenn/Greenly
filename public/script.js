const input = document.getElementById("user-input");
const button = document.getElementById("send-button");
const chatBox = document.getElementById("chat-box");

async function sendMessage() {

    const message = input.value.trim();

    if (message === "") return;

    // İlk mesajda tek bir class ile geçişi tetikle (görünüm CSS'te yönetiliyor)
    if (!document.body.classList.contains("started")) {
        document.body.classList.add("started");

        // Eğer "Yeni Sohbet" aktifse başlığını güncelle
        const activeItem = document.querySelector(".history-item.active");
        if (activeItem && activeItem.innerText === "Yeni Sohbet") {
            const preview = message.length > 20 ? message.substring(0, 20) + "..." : message;
            activeItem.innerText = preview;
        }
    }

    // Kullanıcı mesajı
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user");
    userMessage.innerText = message;

    chatBox.appendChild(userMessage);

    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // Typing indicator ekle
    const typingIndicator = document.createElement("div");
    typingIndicator.classList.add("typing-indicator");
    typingIndicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;

    let data;
    try {
        // Sunucuya gönder
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        data = await response.json();
    } catch (error) {
        console.error("Chat error:", error);
        data = { reply: "Bir hata oluştu. Lütfen tekrar deneyin." };
    } finally {
        // Typing indicator'ı kaldır
        typingIndicator.remove();
    }

    // Bot mesajı wrapper
    const botWrapper = document.createElement("div");
    botWrapper.classList.add("bot-wrapper");

    // Bot metin balonu
    const botMessage = document.createElement("div");
    botMessage.classList.add("message", "bot");
    botMessage.innerText = data.reply;
    botWrapper.appendChild(botMessage);

    // Kaynak etiketleri (varsa)
    if (data.sources && data.sources.length > 0) {
        const sourcesEl = document.createElement("div");
        sourcesEl.classList.add("sources");

        const label = document.createElement("span");
        label.classList.add("sources-label");
        label.innerText = "Kaynak:";
        sourcesEl.appendChild(label);

        data.sources.forEach(src => {
            const tag = document.createElement("span");
            tag.classList.add("source-tag");
            // Sadece dosya adını göster (tam yol gelebilir)
            tag.innerText = src.split(/[\\/]/).pop();
            sourcesEl.appendChild(tag);
        });

        botWrapper.appendChild(sourcesEl);
    }

    chatBox.appendChild(botWrapper);

    // En alta kaydır
    chatBox.scrollTop = chatBox.scrollHeight;
}

function resizeImage(file, maxSize = 1024, quality = 0.7) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            const img = new Image();

            img.onload = () => {

                let width = img.width;
                let height = img.height;

                // En uzun kenarı 1024 px yap
                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round(height * maxSize / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round(width * maxSize / height);
                        height = maxSize;
                    }
                }

                const canvas = document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(img, 0, 0, width, height);

                // JPEG olarak sıkıştır
                const compressed = canvas.toDataURL(
                    "image/jpeg",
                    quality
                );

                resolve(compressed);
            };

            img.onerror = reject;
            img.src = reader.result;
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Sidebar Toggle Logic
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.getElementById("sidebar");

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
    });
}

// History & New Chat Logic
const newChatBtn = document.getElementById("new-chat-btn");
const historyList = document.getElementById("history-list");

function selectChat(element) {
    document.querySelectorAll(".history-item").forEach(item => item.classList.remove("active"));
    element.classList.add("active");

    // Ekranı temizle
    chatBox.innerHTML = '';

    if (element.innerText === "Yeni Sohbet") {
        document.body.classList.remove("started");
    } else {
        document.body.classList.add("started");
        // Önceki sohbetin yüklendiğini simüle eden bir mesaj
        const botWrapper = document.createElement("div");
        botWrapper.classList.add("bot-wrapper");
        const botMsg = document.createElement("div");
        botMsg.classList.add("message", "bot");
        botMsg.innerText = "Bu, önceki sohbetinizin geçmişidir. (" + element.innerText + ")";
        botWrapper.appendChild(botMsg);
        chatBox.appendChild(botWrapper);
    }
}

if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
        const activeItem = document.querySelector(".history-item.active");
        // Zaten boş bir "Yeni Sohbet" varsa tekrar oluşturma
        if (activeItem && activeItem.innerText === "Yeni Sohbet" && chatBox.innerHTML === "") {
            return;
        }

        document.querySelectorAll(".history-item").forEach(item => item.classList.remove("active"));

        const newItem = document.createElement("li");
        newItem.classList.add("history-item", "active");
        newItem.innerText = "Yeni Sohbet";
        newItem.addEventListener("click", () => selectChat(newItem));

        // Geçmişin en üstüne ekle
        historyList.insertBefore(newItem, historyList.firstChild);

        // Sohbet ekranını temizle ve ana ekrana dön
        chatBox.innerHTML = '';
        document.body.classList.remove("started");
        input.value = '';
    });
}

// Mevcut geçmiş öğelerine tıklama olayı ekle
document.querySelectorAll(".history-item").forEach(item => {
    item.addEventListener("click", () => selectChat(item));
});