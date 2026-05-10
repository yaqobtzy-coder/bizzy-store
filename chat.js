// ========== GLOBAL CHAT SYSTEM - 1 USER 1 DEVICE + ADMIN ==========
// Dengan Upload Foto ke ImgBB & Auto Scroll + Floating Chat Button + Drawer Layout Baru

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
let database;
let storage;

try {
    if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }
    database = firebase.database();
    storage = firebase.storage();
    console.log('✅ Firebase initialized');
} catch (error) {
    console.error('❌ Firebase init error:', error);
}

// ImgBB API Key
const IMGBB_API_KEY = 'a60507c67d4d1a5d3f6b0cecbb168314';

// Admin username
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
let pendingImageCaption = ''; // FIX: simpan caption untuk foto
let scrollObserver = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const messagesContainer = document.getElementById('messagesContainer');
const onlineCountSpan = document.getElementById('onlineCount');
const onlineUsersList = document.getElementById('onlineUsersList');
const onlinePanel = document.getElementById('onlinePanel');
const uploadProgress = document.getElementById('uploadProgress');
const kickModal = document.getElementById('kickModal');
const kickUserNameSpan = document.getElementById('kickUserName');

let userToKick = null;
let floatingEmojiPicker = null;

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

// ========== CHECK USERNAME ==========
async function isUsernameTaken(username) {
    if (!database) return false;
    try {
        const snapshot = await database.ref('chat/usernames').orderByChild('username').equalTo(username).once('value');
        const users = snapshot.val();
        if (users) {
            for (let id in users) {
                if (users[id].online && users[id].deviceId !== currentDeviceId) return true;
                if (!users[id].online) await database.ref(`chat/usernames/${id}`).remove();
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking username:', error);
        return false;
    }
}

// ========== LOGIN ==========
async function login() {
    if (!database) {
        showToast('Database sedang inisialisasi, coba lagi...', 'error');
        return;
    }
    
    const username = usernameInput.value.trim();
    if (!username) { showToast('Masukkan username!'); return; }
    if (username.length < 3) { showToast('Minimal 3 karakter!'); return; }
    if (username.length > 20) { showToast('Maksimal 20 karakter!'); return; }
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Memproses...';
    
    try {
        currentDeviceId = generateDeviceId();
        const taken = await isUsernameTaken(username);
        if (taken) {
            showToast(`Username "${username}" sedang digunakan!`, 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk ke Chat';
            return;
        }
        
        currentUser = username;
        currentUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        isAdmin = (username === ADMIN_USERNAME);
        
        localStorage.setItem('chat_username', currentUser);
        localStorage.setItem('chat_userId', currentUserId);
        
        loginSuccess();
    } catch (error) {
        showToast('Gagal login: ' + error.message, 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk ke Chat';
    }
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
            setupFirebase();
            setupScrollObserver();
            setupDrawerEvents();
            if (isAdmin) {
                showToast(`Selamat datang, Admin ${currentUser}!`, 'success');
            } else {
                showToast(`Selamat datang, ${currentUser}!`);
            }
        }, 50);
    }, 200);
}

async function logout() {
    if (onlineRef && currentUserId) try { await onlineRef.child(currentUserId).remove(); } catch(e) {}
    if (typingRef && currentUserId) try { await typingRef.child(currentUserId).remove(); } catch(e) {}
    if (currentUserId && database) try { await database.ref(`chat/usernames/${currentUserId}`).remove(); } catch(e) {}
    
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
    
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
            usernameInput.value = '';
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk ke Chat';
        }, 50);
    }, 200);
    
    showToast('Anda telah logout');
}

// ========== KICK USER ==========
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
    if (!userToKick || !messagesRef) return;
    const { userId, username } = userToKick;
    try {
        await messagesRef.push({
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: 'system',
            username: 'System',
            text: `👑 Admin ${currentUser} mengeluarkan ${username} dari chat!`,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'system'
        });
        if (onlineRef) await onlineRef.child(userId).remove();
        if (typingRef) await typingRef.child(userId).remove();
        if (database) await database.ref(`chat/usernames/${userId}`).remove();
        showToast(`${username} telah di-kick!`, 'success');
        closeKickModal();
    } catch(e) { showToast('Gagal kick user!', 'error'); }
}

// ========== SCROLL ==========
function setupScrollObserver() {
    if (scrollObserver) scrollObserver.disconnect();
    if (!messagesContainer) return;
    scrollObserver = new MutationObserver(() => scrollToBottom());
    scrollObserver.observe(messagesContainer, { childList: true, subtree: true });
}

function scrollToBottom() {
    if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ========== FIREBASE SETUP ==========
function setupFirebase() {
    if (!database) return;
    
    database.ref(`chat/usernames/${currentUserId}`).set({
        username: currentUser, deviceId: currentDeviceId, online: true,
        isAdmin: isAdmin, joinedAt: firebase.database.ServerValue.TIMESTAMP
    }).catch(e => console.error(e));
    
    onlineRef = database.ref('chat/online');
    const userOnlineRef = onlineRef.child(currentUserId);
    userOnlineRef.set({ username: currentUser, isAdmin: isAdmin, lastSeen: firebase.database.ServerValue.TIMESTAMP }).catch(e => console.error(e));
    userOnlineRef.onDisconnect().remove();
    
    onlineRef.on('value', (snapshot) => {
        const users = snapshot.val();
        let count = 0;
        let usersHtml = '';
        if (users) {
            const userList = [];
            for (let id in users) {
                if (users[id]) {
                    userList.push({ id, username: users[id].username, isAdmin: users[id].isAdmin || false });
                    count++;
                }
            }
            userList.sort((a, b) => a.username.localeCompare(b.username));
            userList.forEach(user => {
                const isUserAdmin = (user.username === ADMIN_USERNAME);
                usersHtml += `
                    <div class="online-user">
                        <i class="fas fa-circle"></i>
                        <span>${escapeHtml(user.username)}${isUserAdmin ? '<span class="admin-badge"><i class="fas fa-crown"></i> Admin</span>' : ''}${user.username === currentUser ? '<span style="margin-left: auto; font-size: 0.6rem; opacity: 0.5;">(You)</span>' : ''}</span>
                        ${isAdmin && user.id !== currentUserId ? `<button class="kick-btn" onclick="openKickModal('${user.id}', '${escapeHtml(user.username)}')"><i class="fas fa-gavel"></i></button>` : ''}
                    </div>
                `;
            });
        }
        if (usersHtml === '') usersHtml = '<div class="loading-users">Tidak ada user online</div>';
        if (onlineUsersList) onlineUsersList.innerHTML = usersHtml;
        if (onlineCountSpan) onlineCountSpan.innerText = count;
    });
    
    messagesRef = database.ref('chat/messages');
    messagesRef.limitToLast(messageLimit).on('child_added', (snapshot) => {
        addMessageToUI(snapshot.val());
        scrollToBottom();
    });
    messagesRef.limitToLast(messageLimit).on('child_removed', (snapshot) => {
        const msg = document.querySelector(`.message[data-id="${snapshot.val().id}"]`);
        if (msg) msg.remove();
    });
    
    typingRef = database.ref('chat/typing');
    typingRef.on('value', (snapshot) => {
        const typing = snapshot.val();
        const existing = document.querySelector('.typing-indicator-global');
        if (existing) existing.remove();
        if (typing) {
            let typingUsers = [];
            for (let id in typing) {
                if (id !== currentUserId && typing[id].isTyping) typingUsers.push(typing[id].username);
            }
            if (typingUsers.length > 0 && messagesContainer) {
                const typingHtml = document.createElement('div');
                typingHtml.className = 'message bot typing-indicator-global';
                typingHtml.innerHTML = `
                    <div class="message-avatar"><i class="fas fa-robot"></i></div>
                    <div class="message-content"><div class="message-bubble"><div class="typing-dots"><span></span><span></span><span></span></div><div class="typing-text">${typingUsers.join(', ')} ${typingUsers.length === 1 ? 'sedang' : 'sedang'} mengetik...</div></div></div>
                `;
                messagesContainer.appendChild(typingHtml);
                scrollToBottom();
            }
        }
    });
}

// ========== UPLOAD IMAGE ==========
async function uploadImageToImgbb(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
    const data = await response.json();
    if (!data.success) throw new Error(data?.error?.message || 'Upload gagal');
    return data.data.url;
}

async function sendMessageWithImage(file, caption = '') {
    if (!file) return false;
    if (!file.type.startsWith('image/')) { showToast('Hanya file gambar!'); return false; }
    if (file.size > 10 * 1024 * 1024) { showToast('Maksimal 10MB!'); return false; }
    if (uploadProgress) uploadProgress.style.display = 'flex';
    try {
        const imageUrl = await uploadImageToImgbb(file);
        if (uploadProgress) uploadProgress.style.display = 'none';
        await messagesRef.push({
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: currentUserId, username: currentUser, isAdmin: isAdmin,
            text: caption || '', imageUrl: imageUrl,
            timestamp: firebase.database.ServerValue.TIMESTAMP, type: 'image'
        });
        showToast('Gambar berhasil dikirim!', 'success');
        return true;
    } catch (error) {
        if (uploadProgress) uploadProgress.style.display = 'none';
        showToast('Gagal upload: ' + error.message, 'error');
        return false;
    }
}

async function sendTextMessage(text) {
    if (!text.trim() || !messagesRef) return false;
    await messagesRef.push({
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        userId: currentUserId, username: currentUser, isAdmin: isAdmin,
        text: text, timestamp: firebase.database.ServerValue.TIMESTAMP, type: 'text'
    });
    return true;
}

// ========== FIX: SEND MESSAGE HANDLER (Kirim foto & teks) ==========
async function handleSendMessage() {
    const drawerMessageInput = document.getElementById('drawerMessageInput');
    const text = drawerMessageInput?.value.trim() || '';
    
    // CASE 1: Ada foto pending
    if (pendingImageFile) {
        // Kirim foto dengan caption (text)
        await sendMessageWithImage(pendingImageFile, text);
        // Reset setelah kirim
        pendingImageFile = null;
        pendingImageCaption = '';
        if (drawerMessageInput) drawerMessageInput.value = '';
        // Reset tinggi textarea
        if (drawerMessageInput) {
            drawerMessageInput.style.height = 'auto';
        }
        return;
    }
    
    // CASE 2: Kirim teks biasa
    if (text) {
        await sendTextMessage(text);
        if (drawerMessageInput) drawerMessageInput.value = '';
        if (drawerMessageInput) drawerMessageInput.style.height = 'auto';
    }
}

// ========== DRAWER HANDLERS ==========
function setupDrawerEvents() {
    const drawerMessageInput = document.getElementById('drawerMessageInput');
    const drawerSendBtn = document.getElementById('drawerSendBtn');
    const drawerEmojiBtn = document.getElementById('drawerEmojiBtn');
    const drawerImageBtn = document.getElementById('drawerImageBtn');
    const chatDrawer = document.getElementById('chatDrawer');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const floatingChatBtn = document.getElementById('floatingChatBtn');
    const imageInput = document.getElementById('imageInput');
    
    // Open drawer
    if (floatingChatBtn) {
        floatingChatBtn.addEventListener('click', () => {
            if (chatDrawer) chatDrawer.classList.add('open');
            setTimeout(() => {
                if (drawerMessageInput) {
                    drawerMessageInput.focus();
                }
            }, 150);
        });
    }
    
    // Close drawer
    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', () => {
            if (chatDrawer) chatDrawer.classList.remove('open');
        });
    }
    
    // FIX: Send message button - pake handleSendMessage
    if (drawerSendBtn) {
        drawerSendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleSendMessage();
        });
    }
    
    // Enter key
    if (drawerMessageInput) {
        drawerMessageInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                await handleSendMessage();
            }
        });
        
        drawerMessageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 80) + 'px';
        });
    }
    
    // Emoji button
    if (drawerEmojiBtn) {
        drawerEmojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFloatingEmojiPicker();
        });
    }
    
    // FIX: Image button - pilih gambar
    if (drawerImageBtn && imageInput) {
        drawerImageBtn.addEventListener('click', () => {
            imageInput.click();
        });
    }
    
    // FIX: Image input change - simpan pending image
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                pendingImageFile = file;
                showToast(`📷 Gambar "${file.name}" siap dikirim! Tekan kirim.`, 'success');
                // Fokus ke input untuk tambah caption
                if (drawerMessageInput) {
                    drawerMessageInput.focus();
                }
            }
            imageInput.value = ''; // Reset biar bisa upload file sama lagi
        });
    }
}

// Floating Emoji Picker
function toggleFloatingEmojiPicker() {
    const drawerMessageInput = document.getElementById('drawerMessageInput');
    
    if (floatingEmojiPicker && floatingEmojiPicker.style.display === 'block') {
        floatingEmojiPicker.style.display = 'none';
        return;
    }
    
    if (!floatingEmojiPicker) {
        floatingEmojiPicker = document.createElement('div');
        floatingEmojiPicker.className = 'floating-emoji-picker';
        floatingEmojiPicker.innerHTML = `
            <div class="emoji-list">
                <span class="emoji">😀</span><span class="emoji">😃</span><span class="emoji">😄</span><span class="emoji">😁</span>
                <span class="emoji">😆</span><span class="emoji">😅</span><span class="emoji">😂</span><span class="emoji">🤣</span>
                <span class="emoji">😊</span><span class="emoji">😇</span><span class="emoji">🙂</span><span class="emoji">🙃</span>
                <span class="emoji">😉</span><span class="emoji">😌</span><span class="emoji">😍</span><span class="emoji">🥰</span>
                <span class="emoji">😘</span><span class="emoji">😗</span><span class="emoji">😙</span><span class="emoji">😚</span>
                <span class="emoji">❤️</span><span class="emoji">🧡</span><span class="emoji">💛</span><span class="emoji">💚</span>
                <span class="emoji">💙</span><span class="emoji">💜</span><span class="emoji">🖤</span><span class="emoji">🤍</span>
                <span class="emoji">👍</span><span class="emoji">👎</span><span class="emoji">🙏</span><span class="emoji">🎉</span>
                <span class="emoji">🔥</span><span class="emoji">⭐</span><span class="emoji">🌟</span><span class="emoji">💯</span>
            </div>
        `;
        document.body.appendChild(floatingEmojiPicker);
        
        floatingEmojiPicker.querySelectorAll('.emoji').forEach(emoji => {
            emoji.addEventListener('click', () => {
                const drawerMessageInput = document.getElementById('drawerMessageInput');
                if (drawerMessageInput) {
                    drawerMessageInput.value += emoji.textContent;
                    drawerMessageInput.focus();
                }
                if (floatingEmojiPicker) floatingEmojiPicker.style.display = 'none';
            });
        });
    }
    
    floatingEmojiPicker.style.display = 'block';
}

// Close emoji picker on click outside
document.addEventListener('click', (e) => {
    const drawerEmojiBtn = document.getElementById('drawerEmojiBtn');
    if (floatingEmojiPicker && !floatingEmojiPicker.contains(e.target) && e.target !== drawerEmojiBtn) {
        floatingEmojiPicker.style.display = 'none';
    }
});

// ========== DISPLAY MESSAGES ==========
function addMessageToUI(message) {
    if (!messagesContainer) return;
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
    const isUserAdmin = (message.username === ADMIN_USERNAME);
    
    let contentHtml = '';
    if (message.type === 'image') {
        contentHtml = `
            <div class="message-bubble">
                <div class="message-sender">${escapeHtml(message.username)}${isOwn ? ' (You)' : ''}${isUserAdmin ? '<span class="admin-badge"><i class="fas fa-crown"></i> Admin</span>' : ''}</div>
                <img src="${message.imageUrl}" class="message-image" onclick="previewImage('${message.imageUrl}')" loading="lazy">
                ${message.text ? `<div class="message-text" style="margin-top: 8px;">${escapeHtml(message.text)}</div>` : ''}
                <div class="message-time">${formatTime(message.timestamp)}</div>
            </div>
        `;
    } else {
        contentHtml = `
            <div class="message-bubble">
                <div class="message-sender">${escapeHtml(message.username)}${isOwn ? ' (You)' : ''}${isUserAdmin ? '<span class="admin-badge"><i class="fas fa-crown"></i> Admin</span>' : ''}</div>
                <div class="message-text">${escapeHtml(message.text).replace(/\n/g, '<br>')}</div>
                <div class="message-time">${formatTime(message.timestamp)}</div>
            </div>
        `;
    }
    
    messageDiv.innerHTML = `<div class="message-avatar"><i class="fas fa-user"></i></div><div class="message-content">${contentHtml}</div>`;
    messagesContainer.appendChild(messageDiv);
}

function previewImage(url) {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `<img src="${url}" alt="Preview">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

function toggleOnlinePanel() {
    if (onlinePanel) onlinePanel.classList.toggle('expanded');
}

// ========== NAVIGATION ==========
function navigateTo(page) {
    if (window.GlobalMusic && window.GlobalMusic.saveState) window.GlobalMusic.saveState();
    if (onlineRef && currentUserId) onlineRef.child(currentUserId).remove();
    if (typingRef && currentUserId) typingRef.child(currentUserId).remove();
    if (currentUserId && database) database.ref(`chat/usernames/${currentUserId}`).remove();
    document.body.style.opacity = '0';
    setTimeout(() => { window.location.href = page; }, 200);
}

function goBackToTools() {
    if (window.GlobalMusic && window.GlobalMusic.saveState) window.GlobalMusic.saveState();
    document.body.style.opacity = '0';
    setTimeout(() => { window.location.href = 'tools.html'; }, 200);
}

// ========== INIT ==========
if (loginBtn) loginBtn.addEventListener('click', login);
if (usernameInput) usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });
if (logoutBtn) logoutBtn.addEventListener('click', logout);

async function checkSavedUser() {
    const savedUser = localStorage.getItem('chat_username');
    const savedUserId = localStorage.getItem('chat_userId');
    if (savedUser && savedUserId && database) {
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

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    if (database) {
        checkSavedUser();
    } else {
        const checkInterval = setInterval(() => {
            if (database) {
                clearInterval(checkInterval);
                checkSavedUser();
            }
        }, 500);
    }
});

// Export ke global
window.previewImage = previewImage;
window.toggleOnlinePanel = toggleOnlinePanel;
window.goBackToTools = goBackToTools;
window.navigateTo = navigateTo;
window.openKickModal = openKickModal;
window.closeKickModal = closeKickModal;
window.confirmKick = confirmKick;
window.handleSendMessage = handleSendMessage;

console.log('💬 Chat System Ready - Fixed!');