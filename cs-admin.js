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
        const styleTag = document.getElementById('theme-style');
        if (styleTag) {
            styleTag.innerHTML = `
                :root {
                    --primary-color: ${theme.primaryColor || '#1e88e5'};
                    --primary-dark: ${theme.primaryDark || '#0d47a1'};
                    --primary-light: ${theme.primaryLight || '#42a5f5'};
                    --accent-color: ${theme.accentColor || '#ffd700'};
                    --accent-dark: ${theme.accentDark || '#ff8c00'};
                    --bg-light: #ffffff;
                    --bg-card: rgba(255,255,255,0.8);
                    --text-dark: #1a2a6c;
                    --text-light: #2c3e8f;
                }
            `;
        }
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

let currentAdmin = "admin1";
let currentAdminName = "Admin 1";
let selectedUserId = null;
let selectedUsername = null;
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

document.querySelectorAll('.admin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentAdmin = btn.getAttribute('data-admin');
        currentAdminName = currentAdmin === 'admin1' ? 'Admin 1' : 'Admin 2';
        loadUserList();
        selectedUserId = null;
        document.getElementById('chatContainer').style.display = 'none';
    });
});

async function loadUserList() {
    const chatsRef = ref(db, 'bizzy_chats');
    const snapshot = await get(chatsRef);
    const chats = snapshot.val();
    
    if (!chats) {
        document.getElementById('userList').innerHTML = '<div style="text-align:center; padding:20px;">Belum ada user yang chat</div>';
        return;
    }

    const userMap = new Map();
    
    for (const [chatId, chatData] of Object.entries(chats)) {
        if (chatId.includes(`_${currentAdmin}`)) {
            const userId = chatId.replace(`_${currentAdmin}`, '').replace('chat_', '');
            
            let username = userId;
            try {
                const userRef = ref(db, `bizzy_users/${userId}`);
                const userSnap = await get(userRef);
                if (userSnap.exists()) {
                    username = userSnap.val().username;
                }
            } catch(e) {}
            
            const lastMessage = chatData.lastMessage || '';
            const lastMessageTime = chatData.lastMessageTime || 0;
            const unread = chatData.unreadAdmin || false;
            
            userMap.set(userId, {
                userId: userId,
                username: username,
                lastMessage: lastMessage,
                lastMessageTime: lastMessageTime,
                unread: unread
            });
        }
    }
    
    if (userMap.size === 0) {
        document.getElementById('userList').innerHTML = '<div style="text-align:center; padding:20px;">Belum ada user yang chat ke admin ini</div>';
        return;
    }
    
    const users = Array.from(userMap.values()).sort((a,b) => b.lastMessageTime - a.lastMessageTime);
    
    let html = '';
    for (const user of users) {
        html += `
            <div class="user-item" onclick="selectUser('${user.userId}', '${escapeHtml(user.username)}')">
                <div>
                    <div class="user-name">${escapeHtml(user.username)}</div>
                    <div class="user-last-msg">${escapeHtml(user.lastMessage.substring(0, 30))}</div>
                </div>
                ${user.unread ? '<span class="unread-badge">Baru</span>' : ''}
            </div>
        `;
    }
    document.getElementById('userList').innerHTML = html;
}

window.selectUser = function(userId, username) {
    selectedUserId = userId;
    selectedUsername = username;
    document.getElementById('chatUserName').innerText = username;
    document.getElementById('chatContainer').style.display = 'flex';
    
    const chatRoomId = `chat_${userId}_${currentAdmin}`;
    update(ref(db, `bizzy_chats/${chatRoomId}`), { 
        unreadAdmin: false,
        lastRead: Date.now()
    });
    
    loadChatMessages();
    listenTyping();
};

function listenTyping() {
    if (!selectedUserId) return;
    const chatRoomId = `chat_${selectedUserId}_${currentAdmin}`;
    onValue(ref(db, `bizzy_chats/${chatRoomId}/typing`), (snapshot) => {
        const typing = snapshot.val();
        const indicator = document.getElementById('typingIndicator');
        if (typing && typing.isTyping) {
            indicator.innerHTML = `${escapeHtml(typing.username)} sedang mengetik...`;
        } else {
            indicator.innerHTML = '';
        }
    });
}

function loadChatMessages() {
    if (!selectedUserId) return;
    
    const chatRoomId = `chat_${selectedUserId}_${currentAdmin}`;
    chatRef = ref(db, `bizzy_chats/${chatRoomId}/messages`);
    
    onValue(chatRef, (snapshot) => {
        const messages = snapshot.val();
        const container = document.getElementById('chatMessages');
        
        if (!messages) {
            container.innerHTML = '<div style="text-align:center; padding:20px;">Belum ada pesan</div>';
            return;
        }
        
        const msgs = Object.values(messages).sort((a,b) => a.timestamp - b.timestamp);
        container.innerHTML = msgs.map(msg => `
            <div class="chat-message ${msg.senderId === selectedUserId ? 'user' : 'admin'}">
                <div class="chat-username">${escapeHtml(msg.senderName)} ${msg.senderId === selectedUserId ? '(User)' : '(Anda)'}</div>
                <div>${escapeHtml(msg.text)}</div>
                <div class="chat-time">${new Date(msg.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
    });
}

window.sendAdminMessage = function() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;
    if (!selectedUserId) {
        showToast("Pilih user terlebih dahulu!");
        return;
    }
    
    const chatRoomId = `chat_${selectedUserId}_${currentAdmin}`;
    const messageRef = ref(db, `bizzy_chats/${chatRoomId}/messages`);
    
    push(messageRef, {
        senderId: currentAdmin,
        senderName: currentAdminName,
        text: text,
        timestamp: Date.now(),
        read: false,
        isAdmin: true
    });
    
    update(ref(db, `bizzy_chats/${chatRoomId}`), {
        lastMessage: text,
        lastMessageTime: Date.now(),
        lastSender: currentAdminName,
        unreadUser: true
    });
    
    input.value = '';
    
    // Kirim notifikasi ke bot
    fetch(`https://api.telegram.org/bot8352764997:AAEP5JE2llOvuoNFoJvDlATOl2Mrzo4VZ-M/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: '7966336512',
            text: `💬 *BALASAN ADMIN DI CS WEB*\n\n👤 User: ${selectedUsername}\n📨 Pesan: ${text}\n👨‍💼 Admin: ${currentAdminName}\n\nUser akan mendapat notifikasi.`,
            parse_mode: 'Markdown'
        })
    }).catch(e => console.log);
};

// Typing indicator
document.getElementById('chatInput')?.addEventListener('input', () => {
    if (!selectedUserId) return;
    const chatRoomId = `chat_${selectedUserId}_${currentAdmin}`;
    set(ref(db, `bizzy_chats/${chatRoomId}/typing`), {
        isTyping: true,
        username: currentAdminName,
        timestamp: Date.now()
    });
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        set(ref(db, `bizzy_chats/${chatRoomId}/typing`), null);
    }, 2000);
});

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function goBack() {
    window.location.href = 'admin.html';
}

setInterval(() => {
    loadUserList();
}, 5000);

await loadCustomTheme();
await loadBotStatus();
loadUserList();

window.goBack = goBack;
window.sendAdminMessage = sendAdminMessage;
window.selectUser = selectUser;
window.copyCommand = copyCommand;
window.openBot = openBot;