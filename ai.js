// ========== AI ASSISTANT PAGE SCRIPT ==========

const AI_NAME = "Rayy Asisten";
let isLoading = false;
let chatHistory = [];

function loadTheme() {
    const savedTheme = localStorage.getItem('bizzy_theme_mode');
    if (savedTheme === 'dark') { document.body.classList.add('dark'); document.body.classList.remove('light'); }
    else if (savedTheme === 'light') { document.body.classList.add('light'); document.body.classList.remove('dark'); }
    else { document.body.classList.add('dark'); document.body.classList.remove('light'); }
}

function getCurrentTime() { return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }

function showToast(msg) {
    let existing = document.querySelector('.toast');
    if (existing) existing.remove();
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showLoading(show) { const loader = document.getElementById('loadingOverlay'); if (show) loader.classList.add('show'); else loader.classList.remove('show'); }

function addMessage(sender, text, isHtml = false) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user' : 'bot'}`;
    const avatarIcon = sender === 'user' ? 'fa-user' : 'fa-robot';
    const avatarBg = sender === 'user' ? 'linear-gradient(95deg, #ff9800, #ff5722)' : 'linear-gradient(135deg, #FFD700, #FF8C00)';
    const name = sender === 'user' ? 'Anda' : AI_NAME;
    messageDiv.innerHTML = `<div class="message-avatar" style="background:${avatarBg}"><i class="fas ${avatarIcon}"></i></div><div class="message-content"><div class="message-name">${name}</div><div class="message-text">${isHtml ? text : escapeHtml(text)}</div><div class="message-time">${getCurrentTime()}</div></div>`;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    chatHistory.push({ role: sender, content: text, timestamp: new Date().toISOString() });
}

function showTyping() {
    const container = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `<div class="message-avatar" style="background:linear-gradient(135deg, #FFD700, #FF8C00)"><i class="fas fa-robot"></i></div><div class="message-content"><div class="message-name">${AI_NAME}</div><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}
function hideTyping() { const typing = document.getElementById('typingIndicator'); if (typing) typing.remove(); }

function filterResponse(response) {
    const negativeKeywords = ['bunuh', 'mati', 'tolol', 'bodoh', 'goblok', 'anjing', 'setan', 'narkoba', 'judi'];
    for (const keyword of negativeKeywords) {
        if (response.toLowerCase().includes(keyword)) return "Maaf, saya tidak bisa membahas hal itu. Yuk kita ngobrol yang lebih positif dan menyenangkan! 😊 Ada yang bisa saya bantu lainnya?";
    }
    if (response.length > 2000) response = response.substring(0, 2000) + "...";
    return response;
}

async function sendMessage() {
    if (isLoading) { showToast("Tunggu sebentar, Rayy masih berpikir..."); return; }
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;
    const welcomeCard = document.getElementById('welcomeCard');
    if (welcomeCard) welcomeCard.style.display = 'none';
    addMessage('user', message);
    input.value = '';
    input.focus();
    isLoading = true;
    showTyping();
    try {
        const response = await fetch(`https://api.skylow.web.id/api/ai/grok?q=${encodeURIComponent(message)}`);
        const data = await response.json();
        hideTyping();
        let aiResponse = "";
        if (data.status && data.response) aiResponse = data.response;
        else aiResponse = "Maaf, saya sedang sedikit sibuk. Coba tanya lagi ya! 😊";
        aiResponse = filterResponse(aiResponse);
        addMessage('bot', aiResponse);
    } catch (error) {
        hideTyping();
        console.error("AI Error:", error);
        addMessage('bot', "Maaf, saya sedang offline nih. Coba lagi sebentar ya! 🙏");
    } finally { isLoading = false; }
}

function sendSuggestion(text) { document.getElementById('messageInput').value = text; sendMessage(); }

function clearChat() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = `<div class="message bot"><div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><div class="message-name">${AI_NAME}</div><div class="message-text">Chat telah dibersihkan! Ada yang bisa saya bantu? 😊</div><div class="message-time">${getCurrentTime()}</div></div></div>`;
    chatHistory = [];
    const welcomeCard = document.getElementById('welcomeCard');
    if (welcomeCard) welcomeCard.style.display = 'block';
    showToast("Chat berhasil dibersihkan!");
}

// ========== GO BACK - SIMPAN STATE MUSIC SEBELUM PINDAH ==========
function goBack() {
    if (window.GlobalMusic && window.GlobalMusic.saveState) { 
        window.GlobalMusic.saveState(); 
    }
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease';
    setTimeout(() => { window.location.href = 'tools.html'; }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    document.getElementById('messageInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    document.querySelectorAll('.suggestion-chip').forEach(chip => { chip.addEventListener('click', () => { sendSuggestion(chip.getAttribute('data-msg')); }); });
    document.getElementById('messageInput').focus();
});