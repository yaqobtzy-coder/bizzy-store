import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase, ref, get, push, onValue, set, update } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBUHSGJ2Yaet7ue1x8WLcHn6LI627SINqg",
    authDomain: "rayy-digital-store.firebaseapp.com",
    databaseURL: "https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rayy-digital-store",
    storageBucket: "rayy-digital-store.firebasestorage.app",
    messagingSenderId: "537690791174",
    appId: "1:537690791174:web:c29f7cdfcae0506b6e1287"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function loadCustomTheme() {
    const themeRef = ref(db, 'bizzy_settings/theme');
    const snapshot = await get(themeRef);
    const theme = snapshot.val();
    if (theme) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.primaryColor || '#1e88e5');
        root.style.setProperty('--primary-dark', theme.primaryDark || '#0d47a1');
        root.style.setProperty('--primary-light', theme.primaryLight || '#42a5f5');
        root.style.setProperty('--accent-color', theme.accentColor || '#ffd700');
        root.style.setProperty('--accent-dark', theme.accentDark || '#ff8c00');
    }
}

async function loadBotStatus() {
    const botConfigRef = ref(db, 'bizzy_settings/bot_config');
    const snapshot = await get(botConfigRef);
    const config = snapshot.val();
    const dot = document.getElementById('botStatusDot');
    const text = document.getElementById('botStatusText');
    
    if (config && config.online) {
        dot.className = 'status-dot online';
        text.innerHTML = '<i class="fab fa-telegram"></i> Bot Online';
    } else {
        dot.className = 'status-dot offline';
        text.innerHTML = '<i class="fab fa-telegram"></i> Bot Offline';
    }
}

let currentUserId = localStorage.getItem("bizzy_userId");
let currentUsername = localStorage.getItem("bizzy_username");
let selectedAdmin = "admin1";
let selectedAdminPhone = "6281772352832";
let chatRef = null;
let typingTimeout = null;

function showToast(msg) {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function copyCommand(command) {
    navigator.clipboard.writeText(command);
    showToast(`✅ Command ${command} disalin! Gunakan di @BizzyImpactBot`);
}

function openBot() {
    window.open('https://t.me/BizzyImpactBot', '_blank');
}

document.querySelectorAll('.admin-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.admin-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedAdmin = card.getAttribute('data-admin');
        selectedAdminPhone = card.getAttribute('data-phone');
        document.getElementById('chatTargetName').innerText = selectedAdmin === 'admin1' ? 'Admin 1' : 'Admin 2';
        loadChat();
        listenTyping();
    });
});

function loadChat() {
    if (!currentUserId) {
        document.getElementById('chatMessages').innerHTML = `
            <div style="text-align:center; padding:20px;">
                <i class="fas fa-lock"></i> Silakan login terlebih dahulu
            </div>
        `;
        return;
    }

    const chatRoomId = `chat_${currentUserId}_${selectedAdmin}`;
    chatRef = ref(db, `bizzy_chats/${chatRoomId}/messages`);
    
    onValue(chatRef, (snapshot) => {
        const messages = snapshot.val();
        const container = document.getElementById('chatMessages');
        
        if (!messages) {
            container.innerHTML = '<div style="text-align:center; padding:20px;">Belum ada pesan. Mulai chat sekarang!</div>';
            return;
        }
        
        const msgs = Object.values(messages).sort((a,b) => a.timestamp - b.timestamp);
        container.innerHTML = msgs.map(msg => `
            <div class="chat-message ${msg.senderId === currentUserId ? 'own' : 'other'}">
                <div class="chat-username">${escapeHtml(msg.senderName)} ${msg.senderId === currentUserId ? '(Anda)' : '(Admin)'}</div>
                <div>${escapeHtml(msg.text)}</div>
                <div class="chat-time">${new Date(msg.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
    });
}

window.sendMessage = function() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;
    if (!currentUserId) {
        showToast("Silakan login terlebih dahulu!");
        return;
    }
    
    const chatRoomId = `chat_${currentUserId}_${selectedAdmin}`;
    const messageRef = ref(db, `bizzy_chats/${chatRoomId}/messages`);
    
    push(messageRef, {
        senderId: currentUserId,
        senderName: currentUsername || 'User',
        text: text,
        timestamp: Date.now(),
        read: false
    });
    
    update(ref(db, `bizzy_chats/${chatRoomId}`), {
        lastMessage: text,
        lastMessageTime: Date.now(),
        lastSender: currentUsername,
        unreadAdmin: true
    });
    
    input.value = '';
    
    // Notifikasi ke bot
    fetch(`https://api.telegram.org/bot8352764997:AAEP5JE2llOvuoNFoJvDlATOl2Mrzo4VZ-M/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: '7966336512',
            text: `💬 *PESAN BARU DI CS WEB*\n\n👤 User: ${currentUsername}\n📨 Pesan: ${text.substring(0, 100)}\n👨‍💼 Admin: ${selectedAdmin === 'admin1' ? 'Admin 1' : 'Admin 2'}\n\n💡 Gunakan /cs di bot untuk membalas.`,
            parse_mode: 'Markdown'
        })
    }).catch(e => console.log);
};

document.getElementById('chatInput')?.addEventListener('input', () => {
    if (!currentUserId) return;
    const chatRoomId = `chat_${currentUserId}_${selectedAdmin}`;
    set(ref(db, `bizzy_chats/${chatRoomId}/typing`), {
        isTyping: true,
        username: currentUsername,
        timestamp: Date.now()
    });
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        set(ref(db, `bizzy_chats/${chatRoomId}/typing`), null);
    }, 2000);
});

function listenTyping() {
    if (!currentUserId) return;
    const chatRoomId = `chat_${currentUserId}_${selectedAdmin}`;
    onValue(ref(db, `bizzy_chats/${chatRoomId}/typing`), (snapshot) => {
        const typing = snapshot.val();
        const indicator = document.getElementById('typingIndicator');
        if (typing && typing.isTyping && typing.username !== currentUsername) {
            indicator.innerHTML = `${escapeHtml(typing.username)} sedang mengetik...`;
        } else {
            indicator.innerHTML = '';
        }
    });
}

document.getElementById('whatsappBtn')?.addEventListener('click', () => {
    const message = `Halo Admin Bizzy Impact, saya ${currentUsername || 'User'} mau bertanya tentang jasa joki.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${selectedAdminPhone}?text=${encodedMessage}`, '_blank');
});

function goBack() {
    window.location.href = 'index.html';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

await loadCustomTheme();
await loadBotStatus();

if (!currentUserId || !currentUsername) {
    document.getElementById('chatMessages').innerHTML = `
        <div style="text-align:center; padding:20px;">
            <i class="fas fa-lock"></i> Silakan login terlebih dahulu<br>
            <button class="btn-secondary" onclick="window.location.href='index.html'" style="margin-top:10px;">Login Sekarang</button>
        </div>
    `;
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.disabled = true;
} else {
    loadChat();
    listenTyping();
}

window.goBack = goBack;
window.sendMessage = sendMessage;
window.copyCommand = copyCommand;
window.openBot = openBot;