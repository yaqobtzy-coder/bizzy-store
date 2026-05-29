// ========================================
// LIVE CHAT - RAYY STORE
// ========================================

let currentUser = '';
let messageListener = null;
let typingTimeout = null;
let refreshInterval = null;

// Sidebar functions
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function updateSidebarProfile() {
    const userName = localStorage.getItem('userName') || 'Customer';
    const userEmail = localStorage.getItem('userEmail') || 'customer@rayystore.com';
    document.getElementById('sidebarName').innerText = userName;
    document.getElementById('sidebarEmail').innerText = userEmail;
    currentUser = userName;
}

// Cek user login
function checkUserLogin() {
    const userName = localStorage.getItem('userName');
    if (!userName || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan login terlebih dahulu untuk menggunakan Live Chat!');
        window.location.href = 'profile.html';
        return false;
    }
    currentUser = userName;
    updateSidebarProfile();
    return true;
}

// Kirim pesan
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    if (!currentUser) {
        alert('Silakan login terlebih dahulu!');
        return;
    }
    
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    
    const messageData = {
        id: Date.now().toString(),
        userId: currentUser,
        userName: currentUser,
        message: message,
        isFromUser: true,
        isFromAdmin: false,
        timestamp: Date.now(),
        timeStr: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        dateStr: new Date().toLocaleDateString('id-ID')
    };
    
    try {
        await database.ref('live_chat_messages').push(messageData);
        input.value = '';
        scrollToBottom();
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Gagal mengirim pesan. Coba lagi.');
    } finally {
        sendBtn.disabled = false;
        input.focus();
    }
}

// Load dan listen pesan dari Firebase
function loadMessages() {
    if (messageListener) {
        database.ref('live_chat_messages').off('value', messageListener);
    }
    
    messageListener = database.ref('live_chat_messages').orderByChild('timestamp').limitToLast(100);
    messageListener.on('value', (snapshot) => {
        const messages = [];
        snapshot.forEach(child => {
            messages.push({ id: child.key, ...child.val() });
        });
        messages.sort((a, b) => a.timestamp - b.timestamp);
        renderMessages(messages);
    });
}

function renderMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-chat">
                <i class="fas fa-comment-dots"></i>
                <p>Belum ada pesan. Jadilah yang pertama!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => {
        const isOwn = msg.userName === currentUser;
        const senderName = msg.isFromAdmin ? '📢 Admin' : msg.userName;
        return `
            <div class="message ${isOwn ? 'message-right' : 'message-left'}">
                <div class="message-bubble">${escapeHtml(msg.message)}</div>
                <div class="message-info">
                    <span class="message-name">${escapeHtml(senderName)}</span>
                    <span>${msg.timeStr || '-'}</span>
                </div>
            </div>
        `;
    }).join('');
    
    scrollToBottom();
    
    // Play notifikasi untuk pesan baru dari admin
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.isFromAdmin === true && lastMessage.userName !== currentUser) {
        playNotificationSound();
    }
}

function playNotificationSound() {
    const audio = document.getElementById('notificationSound');
    if (audio) {
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// Typing indicator
let isTyping = false;
const typingRef = database.ref('live_chat_typing');

function startTyping() {
    if (!currentUser) return;
    if (!isTyping) {
        isTyping = true;
        typingRef.set({
            userId: currentUser,
            userName: currentUser,
            timestamp: Date.now()
        });
    }
    
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        if (isTyping) {
            isTyping = false;
            typingRef.remove();
        }
    }, 2000);
}

function listenTyping() {
    typingRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const indicator = document.getElementById('typingIndicator');
        if (data && data.userName !== currentUser && (Date.now() - data.timestamp < 3000)) {
            indicator.style.display = 'block';
            indicator.innerHTML = `<i class="fas fa-ellipsis-h"></i> ${escapeHtml(data.userName)} sedang mengetik...`;
        } else {
            indicator.style.display = 'none';
        }
    });
}

// Auto refresh setiap 5 detik (fallback)
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (messageListener) {
            database.ref('live_chat_messages').off('value', messageListener);
            loadMessages();
        }
    }, 5000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enter key to send
document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('messageInput')?.addEventListener('input', () => {
    startTyping();
});

// Initialize
document.getElementById('menuToggle').onclick = toggleSidebar;
document.getElementById('sidebarClose').onclick = closeSidebar;

if (checkUserLogin()) {
    loadMessages();
    listenTyping();
    startAutoRefresh();
}