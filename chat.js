// ========== GLOBAL CHAT SYSTEM - 1 USER 1 DEVICE + ADMIN ==========
// Dengan Upload Foto ke ImgBB & Auto Scroll

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUHSGJ2Yaet7ue1x8WLcHn6LI627SINqg",
    authDomain: "rayy-digital-store.firebaseapp.com",
    databaseURL: "https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rayy-digital-store",
    storageBucket: "rayy-digital-store.firebasestorage.app",
    messagingSenderId: "537690791174",
    appId: "1:537690791174:web:c29f7cdfcae0506b6e1287"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ImgBB API Key
const IMGBB_API_KEY = 'a60507c67d4d1a5d3f6b0cecbb168314';

// Admin username (case sensitive) - HANYA "Rayy" yang jadi admin
const ADMIN_USERNAME = "Rayy";

// Global Variables
let currentUser = null;
let currentUserId = null;
let currentDeviceId = null;
let onlineRef = null;
let messagesRef = null;
let typingRef = null;
let isTyping = false;
let typingTimeout = null;
let messageLimit = 50;
let isAdmin = false;
let pendingImageFile = null;
let isUploading = false;
let scrollObserver = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const emojiBtn = document.getElementById('emojiBtn');
const imageBtn = document.getElementById('imageBtn');
const imageInput = document.getElementById('imageInput');
const emojiPicker = document.getElementById('emojiPicker');
const onlineCountSpan = document.getElementById('onlineCount');
const onlineUsersList = document.getElementById('onlineUsersList');
const onlinePanel = document.getElementById('onlinePanel');
const uploadProgress = document.getElementById('uploadProgress');
const kickModal = document.getElementById('kickModal');
const kickUserNameSpan = document.getElementById('kickUserName');

let userToKick = null;

// ========== UTILITIES ==========
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatTime(timestamp) {
    if (!timestamp) return 'baru saja';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 10) return 'baru saja';
    if (diff < 60) return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function generateDeviceId() {
    let deviceId = localStorage.getItem('chat_device_id');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 10);
        localStorage.setItem('chat_device_id', deviceId);
    }
    return deviceId;
}

// ========== LOAD THEME ==========
function loadTheme() {
    const savedTheme = localStorage.getItem('bizzy_theme_mode');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
    } else if (savedTheme === 'light') {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
    } else {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
    }
}
loadTheme();

// ========== CHECK IF USERNAME IS TAKEN ==========
async function isUsernameTaken(username) {
    const snapshot = await database.ref('chat/usernames').orderByChild('username').equalTo(username).once('value');
    const users = snapshot.val();
    
    if (users) {
        for (let id in users) {
            if (users[id].online && users[id].deviceId !== currentDeviceId) {
                return true;
            }
            if (!users[id].online) {
                await database.ref(`chat/usernames/${id}`).remove();
                return false;
            }
        }
    }
    return false;
}

// ========== LOGIN SYSTEM ==========
async function login() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        showToast('Masukkan username terlebih dahulu!');
        return;
    }
    
    if (username.length < 3) {
        showToast('Username minimal 3 karakter!');
        return;
    }
    
    if (username.length > 20) {
        showToast('Username maksimal 20 karakter!');
        return;
    }
    
    const taken = await isUsernameTaken(username);
    if (taken) {
        showToast(`Username "${username}" sedang digunakan di device lain!`, 'error');
        return;
    }
    
    currentDeviceId = generateDeviceId();
    currentUser = username;
    currentUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    // HANYA username "Rayy" yang jadi admin (case sensitive)
    isAdmin = (username === ADMIN_USERNAME);
    
    localStorage.setItem('chat_username', currentUser);
    localStorage.setItem('chat_userId', currentUserId);
    
    loginSuccess();
}

function loginSuccess() {
    loginScreen.style.opacity = '0';
    setTimeout(() => {
        loginScreen.style.display = 'none';
        chatScreen.style.display = 'flex';
        chatScreen.style.opacity = '0';
        setTimeout(() => {
            chatScreen.style.opacity = '1';
            chatScreen.style.transition = 'opacity 0.3s ease';
        }, 50);
    }, 200);
    
    setupFirebase();
    setupScrollObserver(); // Setup auto scroll
    messageInput.focus();
    
    if (isAdmin) {
        showToast(`Selamat datang, Admin ${currentUser}! Anda memiliki akses kick user.`, 'success');
    } else {
        showToast(`Selamat datang, ${currentUser}!`);
    }
}

async function logout() {
    if (onlineRef && currentUserId) {
        await onlineRef.child(currentUserId).remove();
    }
    if (typingRef && currentUserId) {
        await typingRef.child(currentUserId).remove();
    }
    if (currentUserId) {
        await database.ref(`chat/usernames/${currentUserId}`).remove();
    }
    
    // Hentikan observer
    if (scrollObserver) {
        scrollObserver.disconnect();
        scrollObserver = null;
    }
    
    localStorage.removeItem('chat_username');
    localStorage.removeItem('chat_userId');
    
    currentUser = null;
    currentUserId = null;
    isAdmin = false;
    
    chatScreen.style.opacity = '0';
    setTimeout(() => {
        chatScreen.style.display = 'none';
        loginScreen.style.display = 'flex';
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.style.opacity = '1';
            loginScreen.style.transition = 'opacity 0.3s ease';
        }, 50);
    }, 200);
    
    showToast('Anda telah logout');
}

// ========== KICK USER (ADMIN ONLY) ==========
function openKickModal(userId, username) {
    if (!isAdmin) return;
    userToKick = { userId, username };
    kickUserNameSpan.innerText = username;
    kickModal.style.display = 'flex';
}

function closeKickModal() {
    kickModal.style.display = 'none';
    userToKick = null;
}

async function confirmKick() {
    if (!userToKick) return;
    
    const { userId, username } = userToKick;
    
    await messagesRef.push({
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        userId: 'system',
        username: 'System',
        text: `👑 Admin ${currentUser} mengeluarkan ${username} dari chat!`,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        type: 'system'
    });
    
    await onlineRef.child(userId).remove();
    await typingRef.child(userId).remove();
    await database.ref(`chat/usernames/${userId}`).remove();
    
    showToast(`${username} telah di-kick!`, 'success');
    closeKickModal();
}

// ========== SETUP SCROLL OBSERVER - PESAN BARU AUTO SCROLL ==========
function setupScrollObserver() {
    if (scrollObserver) {
        scrollObserver.disconnect();
    }
    
    scrollObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                // Cek apakah pesan baru dari user lain atau sendiri
                scrollToBottom();
            }
        });
    });
    
    scrollObserver.observe(messagesContainer, { 
        childList: true, 
        subtree: true 
    });
}

// ========== SCROLL TO BOTTOM - RESPONSIF ==========
function scrollToBottom() {
    if (messagesContainer) {
        // Langsung scroll tanpa timeout
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// ========== FIREBASE SETUP ==========
function setupFirebase() {
    database.ref(`chat/usernames/${currentUserId}`).set({
        username: currentUser,
        deviceId: currentDeviceId,
        online: true,
        isAdmin: isAdmin,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    onlineRef = database.ref('chat/online');
    const userOnlineRef = onlineRef.child(currentUserId);
    
    userOnlineRef.set({
        username: currentUser,
        isAdmin: isAdmin,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
    
    userOnlineRef.onDisconnect().remove();
    
    onlineRef.on('value', (snapshot) => {
        const users = snapshot.val();
        let count = 0;
        let usersHtml = '';
        
        if (users) {
            const userList = [];
            for (let id in users) {
                if (users[id]) {
                    userList.push({
                        id: id,
                        username: users[id].username,
                        isAdmin: users[id].isAdmin || false
                    });
                    count++;
                }
            }
            
            userList.sort((a, b) => a.username.localeCompare(b.username));
            
            userList.forEach(user => {
                // HANYA username "Rayy" yang tampil sebagai admin
                const isUserAdmin = (user.username === ADMIN_USERNAME);
                usersHtml += `
                    <div class="online-user">
                        <i class="fas fa-circle"></i>
                        <span>
                            ${escapeHtml(user.username)}
                            ${isUserAdmin ? '<span class="admin-badge"><i class="fas fa-crown"></i> Admin</span>' : ''}
                            ${user.username === currentUser ? '<span style="margin-left: auto; font-size: 0.6rem; opacity: 0.5;">(You)</span>' : ''}
                        </span>
                        ${isAdmin && user.id !== currentUserId ? `<button class="kick-btn" onclick="openKickModal('${user.id}', '${escapeHtml(user.username)}')"><i class="fas fa-gavel"></i></button>` : ''}
                    </div>
                `;
            });
        }
        
        if (usersHtml === '') usersHtml = '<div class="loading-users">Tidak ada user online</div>';
        
        onlineUsersList.innerHTML = usersHtml;
        onlineCountSpan.innerText = count;
    });
    
    messagesRef = database.ref('chat/messages');
    
    messagesRef.limitToLast(messageLimit).on('child_added', (snapshot) => {
        const message = snapshot.val();
        addMessageToUI(message);
        // Scroll otomatis ke bawah saat pesan baru masuk
        scrollToBottom();
    });
    
    messagesRef.limitToLast(messageLimit).on('child_removed', (snapshot) => {
        const removedMsg = snapshot.val();
        const msgElement = document.querySelector(`.message[data-id="${removedMsg.id}"]`);
        if (msgElement) msgElement.remove();
    });
    
    typingRef = database.ref('chat/typing');
    
    typingRef.on('value', (snapshot) => {
        const typing = snapshot.val();
        const existingTyping = document.querySelector('.typing-indicator-global');
        if (existingTyping) existingTyping.remove();
        
        if (typing) {
            let typingUsers = [];
            for (let id in typing) {
                if (id !== currentUserId && typing[id].isTyping) {
                    typingUsers.push(typing[id].username);
                }
            }
            
            if (typingUsers.length > 0) {
                const typingHtml = document.createElement('div');
                typingHtml.className = 'message bot typing-indicator-global';
                typingHtml.innerHTML = `
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-bubble">
                            <div class="typing-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <div class="typing-text">${typingUsers.join(', ')} ${typingUsers.length === 1 ? 'sedang' : 'sedang'} mengetik...</div>
                        </div>
                    </div>
                `;
                messagesContainer.appendChild(typingHtml);
                scrollToBottom();
            }
        }
    });
    
    messageInput.addEventListener('input', () => {
        if (!isTyping) {
            isTyping = true;
            typingRef.child(currentUserId).set({
                username: currentUser,
                isTyping: true
            });
        }
        
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            isTyping = false;
            typingRef.child(currentUserId).remove();
        }, 1000);
    });
}

// ========== UPLOAD IMAGE TO IMGBB ==========
async function uploadImageToImgbb(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data?.error?.message || 'Upload gagal');
    }
    
    return data.data.url;
}

// ========== SEND MESSAGE WITH IMAGE ==========
async function sendMessageWithImage(file, caption = '') {
    if (!file) return false;
    
    if (!file.type.startsWith('image/')) {
        showToast('Hanya file gambar yang diperbolehkan!');
        return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('Ukuran gambar maksimal 10MB!');
        return false;
    }
    
    if (uploadProgress) uploadProgress.style.display = 'flex';
    
    try {
        const imageUrl = await uploadImageToImgbb(file);
        
        if (uploadProgress) uploadProgress.style.display = 'none';
        
        const messageData = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: currentUserId,
            username: currentUser,
            isAdmin: isAdmin,
            text: caption || '',
            imageUrl: imageUrl,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'image'
        };
        
        await messagesRef.push(messageData);
        showToast('Gambar berhasil dikirim!', 'success');
        return true;
        
    } catch (error) {
        console.error('Upload error:', error);
        if (uploadProgress) uploadProgress.style.display = 'none';
        showToast('Gagal mengunggah gambar: ' + error.message, 'error');
        return false;
    }
}

// ========== SEND TEXT MESSAGE ==========
async function sendTextMessage(text) {
    if (!text.trim()) return false;
    
    const messageData = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        userId: currentUserId,
        username: currentUser,
        isAdmin: isAdmin,
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        type: 'text'
    };
    
    await messagesRef.push(messageData);
    return true;
}

// ========== SEND MESSAGE (MAIN FUNCTION) ==========
async function sendMessage() {
    const text = messageInput.value.trim();
    
    if (pendingImageFile) {
        await sendMessageWithImage(pendingImageFile, text);
        pendingImageFile = null;
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        if (typingRef && currentUserId) {
            typingRef.child(currentUserId).remove();
        }
        isTyping = false;
        // Scroll ke bawah setelah kirim pesan
        scrollToBottom();
        return;
    }
    
    if (text) {
        await sendTextMessage(text);
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        if (typingRef && currentUserId) {
            typingRef.child(currentUserId).remove();
        }
        isTyping = false;
        // Scroll ke bawah setelah kirim pesan
        scrollToBottom();
    }
}

// ========== HANDLE IMAGE SELECTION ==========
function handleImageSelect(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        showToast('Gambar siap dikirim! Tekan send untuk mengirim.', 'success');
        pendingImageFile = file;
    };
    reader.readAsDataURL(file);
}

// ========== DISPLAY MESSAGES ==========
function addMessageToUI(message) {
    const isOwn = message.userId === currentUserId;
    const isSystem = message.userId === 'system';
    
    if (isSystem) {
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message';
        systemDiv.innerHTML = message.text;
        messagesContainer.appendChild(systemDiv);
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
    messageDiv.setAttribute('data-id', message.id);
    
    // HANYA username "Rayy" yang dapat badge admin
    const isUserAdmin = (message.username === ADMIN_USERNAME);
    
    let contentHtml = '';
    
    if (message.type === 'image') {
        contentHtml = `
            <div class="message-bubble">
                <div class="message-sender">
                    ${escapeHtml(message.username)}${isOwn ? ' (You)' : ''}
                    ${isUserAdmin ? '<span class="admin-badge"><i class="fas fa-crown"></i> Admin</span>' : ''}
                </div>
                <img src="${message.imageUrl}" class="message-image" onclick="previewImage('${message.imageUrl}')" alt="Image" loading="lazy">
                ${message.text ? `<div class="message-text" style="margin-top: 8px;">${escapeHtml(message.text)}</div>` : ''}
                <div class="message-time">${formatTime(message.timestamp)}</div>
            </div>
        `;
    } else {
        contentHtml = `
            <div class="message-bubble">
                <div class="message-sender">
                    ${escapeHtml(message.username)}${isOwn ? ' (You)' : ''}
                    ${isUserAdmin ? '<span class="admin-badge"><i class="fas fa-crown"></i> Admin</span>' : ''}
                </div>
                <div class="message-text">${escapeHtml(message.text).replace(/\n/g, '<br>')}</div>
                <div class="message-time">${formatTime(message.timestamp)}</div>
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            ${contentHtml}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
}

function previewImage(url) {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `<img src="${url}" alt="Preview">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
}

function toggleEmojiPicker() {
    if (emojiPicker.style.display === 'none') {
        emojiPicker.style.display = 'block';
    } else {
        emojiPicker.style.display = 'none';
    }
}

function addEmoji(emoji) {
    messageInput.value += emoji;
    messageInput.focus();
    autoResizeTextarea();
    emojiPicker.style.display = 'none';
}

function toggleOnlinePanel() {
    onlinePanel.classList.toggle('expanded');
    const icon = document.getElementById('panelToggleIcon');
    if (icon) {
        icon.style.transform = onlinePanel.classList.contains('expanded') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

// ========== NAVIGASI LANGSUNG KE WEB LAIN ==========
function navigateTo(page) {
    if (window.GlobalMusic && window.GlobalMusic.saveState) {
        window.GlobalMusic.saveState();
    }
    
    if (onlineRef && currentUserId) {
        onlineRef.child(currentUserId).remove();
    }
    if (typingRef && currentUserId) {
        typingRef.child(currentUserId).remove();
    }
    if (currentUserId) {
        database.ref(`chat/usernames/${currentUserId}`).remove();
    }
    
    // Hentikan observer
    if (scrollObserver) {
        scrollObserver.disconnect();
        scrollObserver = null;
    }
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease';
    setTimeout(() => {
        window.location.href = page;
    }, 200);
}

// ========== GO BACK TO TOOLS - SIMPAN STATE MUSIC ==========
function goBackToTools() {
    if (window.GlobalMusic && window.GlobalMusic.saveState) {
        window.GlobalMusic.saveState();
    }
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease';
    setTimeout(() => {
        window.location.href = 'tools.html';
    }, 200);
}

// ========== EVENT LISTENERS ==========
loginBtn.addEventListener('click', login);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});

logoutBtn.addEventListener('click', logout);

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

messageInput.addEventListener('input', autoResizeTextarea);

emojiBtn.addEventListener('click', toggleEmojiPicker);

imageBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        handleImageSelect(e.target.files[0]);
    }
    imageInput.value = '';
});

document.addEventListener('click', (e) => {
    if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
        if (emojiPicker.style.display === 'block') {
            emojiPicker.style.display = 'none';
        }
    }
});

document.querySelectorAll('.emoji').forEach(emoji => {
    emoji.addEventListener('click', () => addEmoji(emoji.textContent));
});

async function checkSavedUser() {
    const savedUser = localStorage.getItem('chat_username');
    const savedUserId = localStorage.getItem('chat_userId');
    
    if (savedUser && savedUserId) {
        currentDeviceId = generateDeviceId();
        const taken = await isUsernameTaken(savedUser);
        if (!taken) {
            currentUser = savedUser;
            currentUserId = savedUserId;
            isAdmin = (savedUser === ADMIN_USERNAME);
            loginSuccess();
        } else {
            localStorage.removeItem('chat_username');
            localStorage.removeItem('chat_userId');
        }
    }
}

checkSavedUser();

// Expose functions to global
window.previewImage = previewImage;
window.toggleOnlinePanel = toggleOnlinePanel;
window.goBackToTools = goBackToTools;
window.navigateTo = navigateTo;
window.openKickModal = openKickModal;
window.closeKickModal = closeKickModal;
window.confirmKick = confirmKick;

console.log('💬 Global Chat System Ready! 1 User = 1 Device | Admin: Rayy');
console.log('📸 Upload gambar menggunakan ImgBB API');
console.log('🔄 Auto scroll aktif - pesan baru tidak akan kepotong!');