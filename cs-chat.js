// ========================================
// CUSTOMER SERVICE CHAT - RAYY STORE
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
        alert('⚠️ Silakan login terlebih dahulu untuk menggunakan Customer Service!');
        window.location.href = 'profile.html';
        return false;
    }
    currentUser = userName;
    updateSidebarProfile();
    return true;
}

// Generate unique chat ID untuk user
function getChatId() {
    return `cs_${currentUser.replace(/[^a-zA-Z0-9]/g, '_')}`;
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
    
    const chatId = getChatId();
    const messageData = {
        id: Date.now().toString(),
        userId: currentUser,
        userName: currentUser,
        message: message,
        isFromUser: true,
        isFromCS: false,
        timestamp: Date.now(),
        timeStr: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        dateStr: new Date().toLocaleDateString('id-ID')
    };
    
    try {
        await database.ref(`cs_chat_messages/${chatId}`).push(messageData);
        
        await database.ref(`cs_chat_sessions/${chatId}`).set({
            userId: currentUser,
            userName: currentUser,
            lastMessage: message,
            lastMessageTime: Date.now(),
            lastMessageTimeStr: messageData.timeStr,
            status: 'pending'
        });
        
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
    const chatId = getChatId();
    
    if (messageListener) {
        database.ref(`cs_chat_messages/${chatId}`).off('value', messageListener);
    }
    
    messageListener = database.ref(`cs_chat_messages/${chatId}`).orderByChild('timestamp').limitToLast(100);
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
                <p>Kirim pesan ke Customer Service</p>
                <p style="font-size:12px; margin-top:8px;">CS akan membalas via Telegram</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => {
        const isOwn = msg.isFromUser === true;
        const senderName = isOwn ? currentUser : '🤖 Customer Service';
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
    
    // Play notifikasi untuk pesan baru dari CS
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.isFromCS === true) {
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
const typingRef = database.ref(`cs_chat_typing/${getChatId()}`);

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
    const chatId = getChatId();
    database.ref(`cs_chat_typing/${chatId}`).on('value', (snapshot) => {
        const data = snapshot.val();
        const indicator = document.getElementById('typingIndicator');
        if (data && (Date.now() - data.timestamp < 3000)) {
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    });
}

// Auto refresh setiap 5 detik (fallback)
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        const chatId = getChatId();
        database.ref(`cs_chat_messages/${chatId}`).off('value', messageListener);
        loadMessages();
    }, 5000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mark session as read
async function markSessionAsRead() {
    const chatId = getChatId();
    await database.ref(`cs_chat_sessions/${chatId}`).update({
        status: 'read',
        readAt: Date.now()
    });
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
    markSessionAsRead();
}