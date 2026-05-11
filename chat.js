// ========== GLOBAL CHAT SYSTEM - FULL ULTIMATE UPGRADE ==========
// Fitur: Reply, Pin Message, Mute/Unmute User, Tambah/Unadmin, Role Owner, 
// Voice Note, Typing Bubble, Group Profile, Group Status, 
// Jadwal Sholat Otomatis, Notifikasi Lengkap

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUHSGJ2Yaet7ue1x8WLcHn6LI627SINqg",
    authDomain: "rayy-digital-store.firebaseapp.com",
    databaseURL: "https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rayy-digital-store",
    storageBucket: "rayy-digital-store.firebasestorage.app",
    messagingSecretId: "537690791174",
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

// Owner username
const OWNER_USERNAME = "Rayy";

// Global Variables
let currentUser = null;
let currentUserId = null;
let currentDeviceId = null;
let onlineRef = null;
let messagesRef = null;
let typingRef = null;
let mutedRef = null;
let pinnedMessageRef = null;
let messageLimit = 50;
let isOwner = false;
let isAdmin = false;
let pendingImageFile = null;
let scrollObserver = null;
let currentReplyTo = null;
let currentContextMessage = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStartTime = null;
let recordingTimer = null;
let prayerCheckInterval = null;
let notificationPermission = false;
let lastNotifiedPrayers = [];

// Group Profile State
let groupProfile = {
    name: 'Global Chat+',
    photo: null,
    status: null,
    statusType: null,
    statusExpiry: null
};

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
const muteModal = document.getElementById('muteModal');
const muteUserNameSpan = document.getElementById('muteUserName');
const unmuteModal = document.getElementById('unmuteModal');
const unmuteUserNameSpan = document.getElementById('unmuteUserName');
const pinMessageBar = document.getElementById('pinMessageBar');
const pinMessageText = document.getElementById('pinMessageText');
const replyIndicator = document.getElementById('replyIndicator');
const replyMessagePreview = document.getElementById('replyMessagePreview');
const voiceModal = document.getElementById('voiceModal');
const voiceTimer = document.getElementById('voiceTimer');
const voiceWave = document.getElementById('voiceWave');
const groupNameHeader = document.getElementById('groupNameHeader');
const groupAvatarHeader = document.getElementById('groupAvatarHeader');
const prayerScheduleContainer = document.getElementById('prayerScheduleContainer');
const groupStatusContainer = document.getElementById('groupStatusContainer');

let userToKick = null;
let userToMute = null;
let userToUnmute = null;
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

// ========== CHECK MUTED ==========
async function isUserMuted(userId) {
    if (!database) return false;
    try {
        const snapshot = await database.ref(`chat/muted/${userId}`).once('value');
        const mutedData = snapshot.val();
        if (!mutedData) return false;
        if (mutedData.permanent) return true;
        if (mutedData.until && mutedData.until > Date.now()) return true;
        if (mutedData.until && mutedData.until <= Date.now()) {
            await database.ref(`chat/muted/${userId}`).remove();
            return false;
        }
        return false;
    } catch (error) {
        return false;
    }
}

// ========== UPLOAD FUNCTIONS ==========
async function uploadToImgBB(file, isVideo = false) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error(data?.error?.message || 'Upload gagal');
    return data.data.url;
}

async function uploadImageToImgbb(file) {
    return uploadToImgBB(file);
}

async function uploadVoiceToImgbb(blob) {
    const formData = new FormData();
    formData.append('image', blob, 'voice.wav');
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error('Upload voice gagal');
    return data.data.url;
}

// ========== GROUP PROFILE FUNCTIONS ==========
async function updateGroupProfile(type, value) {
    if (!isAdmin && !isOwner) {
        showToast('Hanya Admin/Owner yang bisa mengubah profil grup!', 'error');
        return false;
    }
    
    try {
        if (type === 'photo') {
            const file = value;
            if (!file.type.startsWith('image/')) {
                showToast('Harus file gambar!', 'error');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast('Maksimal 5MB!', 'error');
                return false;
            }
            
            showToast('Mengunggah foto grup...', 'info');
            const photoUrl = await uploadToImgBB(file);
            await database.ref('chat/groupProfile/photo').set(photoUrl);
            groupProfile.photo = photoUrl;
            showToast('Foto grup berhasil diubah!', 'success');
            updateGroupProfileUI();
            return true;
            
        } else if (type === 'name') {
            if (value.length < 3 || value.length > 30) {
                showToast('Nama grup 3-30 karakter!', 'error');
                return false;
            }
            await database.ref('chat/groupProfile/name').set(value);
            groupProfile.name = value;
            updateGroupProfileUI();
            showToast('Nama grup berhasil diubah!', 'success');
            return true;
        }
    } catch (error) {
        showToast('Gagal update profil grup: ' + error.message, 'error');
        return false;
    }
}

async function updateGroupStatus(type, content) {
    if (!isAdmin && !isOwner) {
        showToast('Hanya Admin/Owner yang bisa membuat status grup!', 'error');
        return false;
    }
    
    try {
        let statusData = {
            type: type,
            content: content,
            postedBy: currentUser,
            postedAt: Date.now(),
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        };
        
        if (type === 'image' && content instanceof File) {
            showToast('Mengunggah status gambar...', 'info');
            const imageUrl = await uploadToImgBB(content);
            statusData.content = imageUrl;
        } else if (type === 'video' && content) {
            if (!content.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
                showToast('URL video tidak valid!', 'error');
                return false;
            }
            statusData.content = content;
        } else if (type === 'text') {
            if (content.length > 500) {
                showToast('Status teks maksimal 500 karakter!', 'error');
                return false;
            }
            statusData.content = content;
        }
        
        await database.ref('chat/groupStatus').set(statusData);
        groupProfile.status = statusData;
        groupProfile.statusType = type;
        groupProfile.statusExpiry = statusData.expiry;
        
        await database.ref('chat/notifications').push({
            type: 'group_status',
            message: `📢 Status grup baru dari ${currentUser}!`,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        showToast('Status grup berhasil diposting!', 'success');
        updateGroupStatusUI();
        return true;
        
    } catch (error) {
        showToast('Gagal posting status: ' + error.message, 'error');
        return false;
    }
}

function updateGroupProfileUI() {
    if (groupNameHeader) groupNameHeader.textContent = groupProfile.name;
    if (groupAvatarHeader) {
        if (groupProfile.photo) {
            groupAvatarHeader.src = groupProfile.photo;
            groupAvatarHeader.style.display = 'inline-block';
        } else {
            groupAvatarHeader.style.display = 'none';
        }
    }
}

function updateGroupStatusUI() {
    if (!groupStatusContainer) return;
    
    if (groupProfile.status && groupProfile.statusExpiry > Date.now()) {
        let statusHtml = '';
        if (groupProfile.statusType === 'text') {
            statusHtml = `<div class="group-status-text">📢 ${escapeHtml(groupProfile.status.content)}</div>`;
        } else if (groupProfile.statusType === 'image') {
            statusHtml = `<div class="group-status-image"><img src="${groupProfile.status.content}" onclick="previewImage('${groupProfile.status.content}')"></div>`;
        } else if (groupProfile.statusType === 'video') {
            statusHtml = `<div class="group-status-video"><video src="${groupProfile.status.content}" controls></video></div>`;
        }
        groupStatusContainer.innerHTML = statusHtml + `<div class="group-status-by">Diposting oleh ${escapeHtml(groupProfile.status.postedBy)}</div>`;
        groupStatusContainer.style.display = 'block';
    } else {
        groupStatusContainer.style.display = 'none';
    }
}

async function loadGroupProfile() {
    if (!database) return;
    
    const groupProfileRef = database.ref('chat/groupProfile');
    groupProfileRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (data.name) groupProfile.name = data.name;
            if (data.photo) groupProfile.photo = data.photo;
            updateGroupProfileUI();
        }
    });
    
    const groupStatusRef = database.ref('chat/groupStatus');
    groupStatusRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.expiry > Date.now()) {
            groupProfile.status = data;
            groupProfile.statusType = data.type;
            groupProfile.statusExpiry = data.expiry;
            updateGroupStatusUI();
        } else {
            groupProfile.status = null;
            updateGroupStatusUI();
        }
    });
}

// ========== PRAYER SCHEDULE & NOTIFICATION FUNCTIONS ==========
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationPermission = permission === 'granted';
        if (notificationPermission) {
            console.log('✅ Notifikasi diizinkan');
        }
    }
}

function sendNotification(title, body, options = {}) {
    if (notificationPermission && 'Notification' in window) {
        const notification = new Notification(title, {
            body: body,
            icon: options.icon || 'https://cdn-icons-png.flaticon.com/512/3034/3034126.png',
            vibrate: options.vibrate || [200, 100, 200],
            silent: options.silent || false,
            tag: options.tag || 'prayer-notification',
            requireInteraction: options.permanent || false
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        setTimeout(() => notification.close(), options.timeout || 10000);
    }
    
    showFloatingNotification(title, body);
    
    if (!options.silent) {
        try {
            const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio error:', e));
        } catch(e) {}
    }
    
    if (options.vibrate && navigator.vibrate) {
        navigator.vibrate(options.vibrate);
    }
    
    saveNotificationToHistory(title, body, Date.now());
}

function showFloatingNotification(title, message) {
    const existingNotif = document.querySelector('.floating-notification');
    if (existingNotif) existingNotif.remove();
    
    const notifDiv = document.createElement('div');
    notifDiv.className = 'floating-notification';
    notifDiv.innerHTML = `
        <div class="floating-notif-content">
            <div class="floating-notif-icon"><i class="fas fa-mosque"></i></div>
            <div class="floating-notif-text">
                <strong>${escapeHtml(title)}</strong>
                <p>${escapeHtml(message)}</p>
            </div>
            <button class="floating-notif-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    document.body.appendChild(notifDiv);
    setTimeout(() => notifDiv.classList.add('show'), 10);
    
    notifDiv.querySelector('.floating-notif-close').addEventListener('click', () => {
        notifDiv.classList.remove('show');
        setTimeout(() => notifDiv.remove(), 300);
    });
    
    setTimeout(() => {
        if (notifDiv.parentNode) {
            notifDiv.classList.remove('show');
            setTimeout(() => notifDiv.remove(), 300);
        }
    }, 8000);
}

async function saveNotificationToHistory(title, body, timestamp) {
    if (!database) return;
    try {
        await database.ref('chat/notificationHistory').push({
            title: title,
            body: body,
            timestamp: timestamp,
            read: false
        });
        updateNotificationBadge();
    } catch (error) {
        console.error('Error saving notification:', error);
    }
}

async function updateNotificationBadge() {
    if (!database) return;
    const snapshot = await database.ref('chat/notificationHistory').orderByChild('read').equalTo(false).once('value');
    const unreadCount = snapshot.numChildren();
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
    const title = unreadCount > 0 ? `(${unreadCount}) Global Chat+` : 'Global Chat+';
    document.title = title;
}

async function fetchPrayerSchedule() {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/3204/${year}/${month}/${day}`);
        const data = await response.json();
        
        if (data.status && data.data) {
            const jadwal = data.data.jadwal;
            const prayerSchedule = {
                imsak: jadwal.imsak,
                subuh: jadwal.subuh,
                terbit: jadwal.terbit,
                dhuha: jadwal.dhuha,
                dzuhur: jadwal.dzuhur,
                ashar: jadwal.ashar,
                maghrib: jadwal.maghrib,
                isya: jadwal.isya,
                tanggal: data.data.tanggal,
                kota: 'Bandung'
            };
            updatePrayerDisplay(prayerSchedule);
            return prayerSchedule;
        }
    } catch (error) {
        console.error('Error fetching prayer:', error);
    }
    return null;
}

function updatePrayerDisplay(prayerSchedule) {
    if (!prayerScheduleContainer || !prayerSchedule) return;
    
    prayerScheduleContainer.innerHTML = `
        <div class="prayer-header">
            <i class="fas fa-mosque"></i>
            <span>Jadwal Sholat ${prayerSchedule.kota}</span>
            <span class="prayer-date">${prayerSchedule.tanggal}</span>
        </div>
        <div class="prayer-times">
            <div class="prayer-item"><span>Imsak</span><strong>${prayerSchedule.imsak}</strong></div>
            <div class="prayer-item"><span>Subuh</span><strong>${prayerSchedule.subuh}</strong></div>
            <div class="prayer-item"><span>Dzuhur</span><strong>${prayerSchedule.dzuhur}</strong></div>
            <div class="prayer-item"><span>Ashar</span><strong>${prayerSchedule.ashar}</strong></div>
            <div class="prayer-item"><span>Maghrib</span><strong>${prayerSchedule.maghrib}</strong></div>
            <div class="prayer-item"><span>Isya</span><strong>${prayerSchedule.isya}</strong></div>
        </div>
    `;
}

async function checkPrayerTimes() {
    const prayerSchedule = await fetchPrayerSchedule();
    if (!prayerSchedule) return;
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const prayers = [
        { name: 'Imsak', time: prayerSchedule.imsak, message: 'Waktu Imsak, bersiap untuk puasa (jika puasa)' },
        { name: 'Subuh', time: prayerSchedule.subuh, message: 'Waktu Sholat Subuh, segera tunaikan sholat subuh!' },
        { name: 'Dzuhur', time: prayerSchedule.dzuhur, message: 'Waktu Sholat Dzuhur, jangan lupa sholat dzuhur!' },
        { name: 'Ashar', time: prayerSchedule.ashar, message: 'Waktu Sholat Ashar, segera sholat ashar!' },
        { name: 'Maghrib', time: prayerSchedule.maghrib, message: 'Waktu Sholat Maghrib, berbuka puasa & sholat maghrib!' },
        { name: 'Isya', time: prayerSchedule.isya, message: 'Waktu Sholat Isya, sempurnakan ibadahmu dengan sholat isya!' }
    ];
    
    for (const prayer of prayers) {
        const [hour, minute] = prayer.time.split(':');
        const prayerTime = new Date();
        prayerTime.setHours(parseInt(hour), parseInt(minute), 0);
        
        const timeDiff = prayerTime - now;
        const minutesDiff = Math.floor(timeDiff / 60000);
        
        if ((minutesDiff === 5 || minutesDiff === 0) && !lastNotifiedPrayers.includes(prayer.name)) {
            lastNotifiedPrayers.push(prayer.name);
            
            if (messagesRef) {
                await messagesRef.push({
                    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    userId: 'system',
                    username: '🕌 Bot Sholat',
                    text: `🔔 ${prayer.message}\n⏰ ${prayer.time} WIB\n📍 Bandung`,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    type: 'system'
                });
            }
            
            sendNotification(
                `🕌 Waktu ${prayer.name}`,
                prayer.message,
                {
                    vibrate: [200, 100, 200],
                    permanent: prayer.name === 'Subuh' || prayer.name === 'Maghrib',
                    tag: `prayer-${prayer.name}`
                }
            );
        }
    }
    
    const today = new Date().toDateString();
    if (window.lastCheckDate !== today) {
        lastNotifiedPrayers = [];
        window.lastCheckDate = today;
    }
}

function startPrayerChecker() {
    if (prayerCheckInterval) clearInterval(prayerCheckInterval);
    checkPrayerTimes();
    prayerCheckInterval = setInterval(() => {
        checkPrayerTimes();
    }, 60000);
}

// ========== NOTIFICATION UI ==========
async function loadRecentNotifications() {
    if (!database) return;
    const snapshot = await database.ref('chat/notificationHistory').orderByChild('timestamp').limitToLast(5).once('value');
    const notifications = snapshot.val();
    const listContainer = document.getElementById('recentNotificationsList');
    
    if (listContainer) {
        if (notifications) {
            const notifList = Object.values(notifications).reverse();
            listContainer.innerHTML = notifList.map(notif => `
                <div class="notification-item ${notif.read ? '' : 'unread'}">
                    <div class="notif-icon"><i class="fas fa-bell"></i></div>
                    <div class="notif-info">
                        <strong>${escapeHtml(notif.title)}</strong>
                        <span>${escapeHtml(notif.body.substring(0, 50))}${notif.body.length > 50 ? '...' : ''}</span>
                    </div>
                </div>
            `).join('');
        } else {
            listContainer.innerHTML = '<div class="loading-users">Tidak ada notifikasi</div>';
        }
    }
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'flex';
        dropdown.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) loadRecentNotifications();
    }
}

async function showNotificationHistory() {
    if (!database) return;
    const snapshot = await database.ref('chat/notificationHistory').orderByChild('timestamp').limitToLast(20).once('value');
    const notifications = snapshot.val();
    
    const modalHtml = `
        <div id="notificationHistoryModal" class="notification-history-modal">
            <div class="notification-history-content">
                <div class="notification-history-header">
                    <i class="fas fa-bell"></i>
                    <h3>Riwayat Notifikasi</h3>
                    <button onclick="closeNotificationHistory()" class="close-modal-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="notification-history-list">
                    ${notifications ? Object.values(notifications).reverse().map(notif => `
                        <div class="notification-history-item ${notif.read ? '' : 'unread'}">
                            <div class="notif-icon"><i class="fas fa-bell"></i></div>
                            <div class="notif-details">
                                <strong>${escapeHtml(notif.title)}</strong>
                                <p>${escapeHtml(notif.body)}</p>
                                <small>${new Date(notif.timestamp).toLocaleString()}</small>
                            </div>
                        </div>
                    `).join('') : '<div class="loading-users">Tidak ada notifikasi</div>'}
                </div>
                <div class="notification-history-footer">
                    <button onclick="markAllNotificationsRead()" class="btn-secondary">Tandai Dibaca</button>
                    <button onclick="clearAllNotifications()" class="btn-danger">Hapus Semua</button>
                </div>
            </div>
        </div>
    `;
    
    const oldModal = document.getElementById('notificationHistoryModal');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    if (notifications) {
        for (const [id, notif] of Object.entries(notifications)) {
            if (!notif.read) {
                await database.ref(`chat/notificationHistory/${id}`).update({ read: true });
            }
        }
        updateNotificationBadge();
    }
}

function closeNotificationHistory() {
    const modal = document.getElementById('notificationHistoryModal');
    if (modal) modal.remove();
}

async function markAllNotificationsRead() {
    if (!database) return;
    const snapshot = await database.ref('chat/notificationHistory').orderByChild('read').equalTo(false).once('value');
    const updates = {};
    snapshot.forEach(child => { updates[child.key] = { read: true }; });
    if (Object.keys(updates).length > 0) {
        await database.ref('chat/notificationHistory').update(updates);
        updateNotificationBadge();
        showToast('Semua notifikasi ditandai dibaca', 'success');
    }
}

async function clearAllNotifications() {
    if (!database) return;
    if (confirm('Hapus semua riwayat notifikasi?')) {
        await database.ref('chat/notificationHistory').remove();
        updateNotificationBadge();
        showToast('Riwayat notifikasi dihapus', 'success');
        closeNotificationHistory();
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
        isOwner = (username === OWNER_USERNAME);
        isAdmin = isOwner;

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
            setupContextMenu();
            setupVoiceRecorder();
            loadPinnedMessage();
            loadGroupProfile();
            requestNotificationPermission();
            startPrayerChecker();
            if (isOwner) {
                showToast(`👑 Selamat datang, Owner ${currentUser}!`, 'success');
            } else if (isAdmin) {
                showToast(`⭐ Selamat datang, Admin ${currentUser}!`, 'success');
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
    isOwner = false;
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
            text: `👑 ${currentUser} mengeluarkan ${username} dari chat!`,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'system'
        });
        if (onlineRef) await onlineRef.child(userId).remove();
        if (typingRef) await typingRef.child(userId).remove();
        if (database) {
            await database.ref(`chat/usernames/${userId}`).remove();
            await database.ref(`chat/muted/${userId}`).remove();
        }
        showToast(`${username} telah di-kick!`, 'success');
        closeKickModal();
    } catch(e) { showToast('Gagal kick user!', 'error'); }
}

// ========== MUTE/UNMUTE USER ==========
function openMuteModal(userId, username) {
    if (!isAdmin) return;
    userToMute = { userId, username };
    muteUserNameSpan.innerText = username;
    muteModal.style.display = 'flex';
}

function closeMuteModal() {
    muteModal.style.display = 'none';
    userToMute = null;
}

async function confirmMute() {
    if (!userToMute) return;
    const { userId, username } = userToMute;
    const duration = parseInt(document.getElementById('muteDuration').value);

    try {
        let muteData = {};
        if (duration === 0) {
            muteData = { permanent: true, mutedAt: Date.now() };
        } else {
            muteData = { until: Date.now() + (duration * 60 * 1000), duration: duration, mutedAt: Date.now() };
        }
        await database.ref(`chat/muted/${userId}`).set(muteData);

        await messagesRef.push({
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: 'system',
            username: 'System',
            text: `🔇 ${currentUser} mem-mute ${username}${duration === 0 ? ' (Permanen)' : ` selama ${duration} menit`}!`,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'system'
        });
        showToast(`${username} telah di-mute!`, 'success');
        closeMuteModal();
    } catch(e) { showToast('Gagal mute user!', 'error'); }
}

function openUnmuteModal(userId, username) {
    if (!isAdmin) return;
    userToUnmute = { userId, username };
    unmuteUserNameSpan.innerText = username;
    unmuteModal.style.display = 'flex';
}

function closeUnmuteModal() {
    unmuteModal.style.display = 'none';
    userToUnmute = null;
}

async function confirmUnmute() {
    if (!userToUnmute) return;
    const { userId, username } = userToUnmute;
    try {
        await database.ref(`chat/muted/${userId}`).remove();
        await messagesRef.push({
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: 'system',
            username: 'System',
            text: `🔊 ${currentUser} membuka mute ${username}!`,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'system'
        });
        showToast(`${username} telah di-unmute!`, 'success');
        closeUnmuteModal();
    } catch(e) { showToast('Gagal unmute user!', 'error'); }
}

// ========== ADMIN PROMOTE/DEMOTE ==========
async function promoteToAdmin(userId, username) {
    if (!isOwner) { showToast('Hanya Owner yang bisa menambah admin!', 'error'); return; }
    try {
        await database.ref(`chat/usernames/${userId}/isAdmin`).set(true);
        await messagesRef.push({
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: 'system',
            username: 'System',
            text: `👑 ${currentUser} menjadikan ${username} sebagai Admin!`,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'system'
        });
        showToast(`${username} sekarang adalah Admin!`, 'success');
    } catch(e) { showToast('Gagal promote user!', 'error'); }
}

async function demoteFromAdmin(userId, username) {
    if (!isOwner) { showToast('Hanya Owner yang bisa mencopot admin!', 'error'); return; }
    if (username === OWNER_USERNAME) { showToast('Tidak bisa mencopot Owner!', 'error'); return; }
    try {
        await database.ref(`chat/usernames/${userId}/isAdmin`).set(false);
        await messagesRef.push({
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: 'system',
            username: 'System',
            text: `📛 ${currentUser} mencopot jabatan Admin dari ${username}.`,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'system'
        });
        showToast(`${username} bukan lagi Admin!`, 'success');
    } catch(e) { showToast('Gagal demote user!', 'error'); }
}

// ========== PIN MESSAGE ==========
async function pinMessage(message) {
    if (!isAdmin) { showToast('Hanya Admin yang bisa menyematkan pesan!', 'error'); return; }
    try {
        const pinData = {
            messageId: message.id,
            text: message.text || (message.type === 'image' ? '📷 Gambar' : 'Pesan'),
            username: message.username,
            pinnedBy: currentUser,
            pinnedAt: Date.now()
        };
        await database.ref('chat/pinnedMessage').set(pinData);
        showToast('Pesan disematkan!', 'success');
    } catch(e) { showToast('Gagal menyematkan pesan!', 'error'); }
}

async function unpinMessage() {
    if (!isAdmin) { showToast('Hanya Admin yang bisa menghapus sematan!', 'error'); return; }
    try {
        await database.ref('chat/pinnedMessage').remove();
        pinMessageBar.style.display = 'none';
        showToast('Sematan pesan dihapus!', 'success');
    } catch(e) { showToast('Gagal menghapus sematan!', 'error'); }
}

async function loadPinnedMessage() {
    if (!database) return;
    const pinnedRef = database.ref('chat/pinnedMessage');
    pinnedRef.on('value', (snapshot) => {
        const pinned = snapshot.val();
        if (pinned && pinned.messageId) {
            pinMessageText.innerText = `${pinned.username}: ${pinned.text.substring(0, 50)}${pinned.text.length > 50 ? '...' : ''}`;
            pinMessageBar.style.display = 'flex';
        } else {
            pinMessageBar.style.display = 'none';
        }
    });
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

// ========== SEND MESSAGES ==========
async function sendMessageWithImage(file, caption = '', replyTo = null) {
    if (!file) return false;
    if (!file.type.startsWith('image/')) { showToast('Hanya file gambar!'); return false; }
    if (file.size > 10 * 1024 * 1024) { showToast('Maksimal 10MB!'); return false; }
    if (uploadProgress) uploadProgress.style.display = 'flex';
    try {
        const imageUrl = await uploadImageToImgbb(file);
        if (uploadProgress) uploadProgress.style.display = 'none';

        const messageData = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: currentUserId, username: currentUser, isAdmin: isAdmin, isOwner: isOwner,
            text: caption || '', imageUrl: imageUrl,
            timestamp: firebase.database.ServerValue.TIMESTAMP, type: 'image'
        };
        if (replyTo) messageData.replyTo = replyTo;

        await messagesRef.push(messageData);
        showToast('Gambar berhasil dikirim!', 'success');
        return true;
    } catch (error) {
        if (uploadProgress) uploadProgress.style.display = 'none';
        showToast('Gagal upload: ' + error.message, 'error');
        return false;
    }
}

async function sendVoiceMessage(blob, duration, replyTo = null) {
    if (!blob) return false;
    if (uploadProgress) uploadProgress.style.display = 'flex';
    try {
        const voiceUrl = await uploadVoiceToImgbb(blob);
        if (uploadProgress) uploadProgress.style.display = 'none';

        const messageData = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: currentUserId, username: currentUser, isAdmin: isAdmin, isOwner: isOwner,
            voiceUrl: voiceUrl, duration: duration,
            timestamp: firebase.database.ServerValue.TIMESTAMP, type: 'voice'
        };
        if (replyTo) messageData.replyTo = replyTo;

        await messagesRef.push(messageData);
        showToast('Pesan suara terkirim!', 'success');
        return true;
    } catch (error) {
        if (uploadProgress) uploadProgress.style.display = 'none';
        showToast('Gagal kirim voice: ' + error.message, 'error');
        return false;
    }
}

async function sendTextMessage(text, replyTo = null) {
    if (!text.trim() || !messagesRef) return false;

    const isMuted = await isUserMuted(currentUserId);
    if (isMuted) {
        showToast('Anda sedang di-mute! Tidak bisa kirim pesan.', 'error');
        return false;
    }

    const messageData = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        userId: currentUserId, username: currentUser, isAdmin: isAdmin, isOwner: isOwner,
        text: text, timestamp: firebase.database.ServerValue.TIMESTAMP, type: 'text'
    };
    if (replyTo) messageData.replyTo = replyTo;

    await messagesRef.push(messageData);
    return true;
}

// ========== REPLY HANDLER ==========
function setReplyTo(message) {
    currentReplyTo = message;
    replyMessagePreview.innerText = `${message.username}: ${message.text || (message.type === 'image' ? '📷 Gambar' : 'Pesan')}`;
    replyIndicator.style.display = 'flex';
    const drawerMessageInput = document.getElementById('drawerMessageInput');
    if (drawerMessageInput) drawerMessageInput.focus();
}

function cancelReply() {
    currentReplyTo = null;
    replyIndicator.style.display = 'none';
}

async function handleSendMessage() {
    const drawerMessageInput = document.getElementById('drawerMessageInput');
    const text = drawerMessageInput?.value.trim() || '';

    if (pendingImageFile) {
        await sendMessageWithImage(pendingImageFile, text, currentReplyTo);
        pendingImageFile = null;
        if (drawerMessageInput) drawerMessageInput.value = '';
        if (drawerMessageInput) drawerMessageInput.style.height = 'auto';
        cancelReply();
        return;
    }

    if (text) {
        await sendTextMessage(text, currentReplyTo);
        if (drawerMessageInput) drawerMessageInput.value = '';
        if (drawerMessageInput) drawerMessageInput.style.height = 'auto';
        cancelReply();
    }
}

// ========== TYPING INDICATOR ==========
function startTyping() {
    if (!typingRef || !currentUserId) return;
    typingRef.child(currentUserId).set({ username: currentUser, isTyping: true });
    if (window.typingTimeout) clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
        typingRef.child(currentUserId).remove();
    }, 2000);
}

function stopTyping() {
    if (!typingRef || !currentUserId) return;
    typingRef.child(currentUserId).remove();
    if (window.typingTimeout) clearTimeout(window.typingTimeout);
}

// ========== VOICE RECORDER ==========
function setupVoiceRecorder() {
    const drawerVoiceBtn = document.getElementById('drawerVoiceBtn');
    const closeVoiceModalBtn = document.getElementById('closeVoiceModalBtn');
    const stopVoiceBtn = document.getElementById('stopVoiceBtn');
    const cancelVoiceBtn = document.getElementById('cancelVoiceBtn');

    if (drawerVoiceBtn) drawerVoiceBtn.addEventListener('click', startVoiceRecording);
    if (closeVoiceModalBtn) closeVoiceModalBtn.addEventListener('click', stopVoiceRecording);
    if (stopVoiceBtn) stopVoiceBtn.addEventListener('click', finishVoiceRecording);
    if (cancelVoiceBtn) cancelVoiceBtn.addEventListener('click', cancelVoiceRecording);
}

async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => { audioChunks.push(event.data); };
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
            if (duration >= 1) {
                await sendVoiceMessage(audioBlob, duration, currentReplyTo);
                cancelReply();
            } else {
                showToast('Rekaman terlalu pendek!', 'error');
            }
            stream.getTracks().forEach(track => track.stop());
            voiceModal.style.display = 'none';
            const drawerVoiceBtn = document.getElementById('drawerVoiceBtn');
            if (drawerVoiceBtn) drawerVoiceBtn.classList.remove('recording');
        };

        mediaRecorder.start();
        isRecording = true;
        recordingStartTime = Date.now();

        voiceModal.style.display = 'flex';
        startVoiceTimer();
        startVoiceWaveAnimation();

        const drawerVoiceBtn = document.getElementById('drawerVoiceBtn');
        if (drawerVoiceBtn) drawerVoiceBtn.classList.add('recording');
    } catch (error) {
        showToast('Tidak bisa akses mikrofon: ' + error.message, 'error');
    }
}

function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        if (recordingTimer) clearInterval(recordingTimer);
    }
    voiceModal.style.display = 'none';
    const drawerVoiceBtn = document.getElementById('drawerVoiceBtn');
    if (drawerVoiceBtn) drawerVoiceBtn.classList.remove('recording');
}

function finishVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        if (recordingTimer) clearInterval(recordingTimer);
    }
}

function cancelVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.onstop = null;
        mediaRecorder.stop();
        isRecording = false;
        if (recordingTimer) clearInterval(recordingTimer);
    }
    voiceModal.style.display = 'none';
    const drawerVoiceBtn = document.getElementById('drawerVoiceBtn');
    if (drawerVoiceBtn) drawerVoiceBtn.classList.remove('recording');
}

function startVoiceTimer() {
    let seconds = 0;
    if (recordingTimer) clearInterval(recordingTimer);
    recordingTimer = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (voiceTimer) voiceTimer.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
        if (seconds >= 60) finishVoiceRecording();
    }, 1000);
}

function startVoiceWaveAnimation() {
    if (!voiceWave) return;
    const bars = voiceWave.querySelectorAll('.wave-bar');
    bars.forEach((bar, index) => {
        bar.style.animation = `waveAnim ${0.3 + index * 0.05}s ease infinite alternate`;
    });
}

// ========== CONTEXT MENU ==========
function setupContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    const replyMenuItem = document.getElementById('replyMenuItem');
    const pinMenuItem = document.getElementById('pinMenuItem');
    const muteMenuItem = document.getElementById('muteMenuItem');
    const unmuteMenuItem = document.getElementById('unmuteMenuItem');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const unadminMenuItem = document.getElementById('unadminMenuItem');

    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.style.display = 'none';
    });

    if (replyMenuItem) replyMenuItem.addEventListener('click', () => {
        if (currentContextMessage) setReplyTo(currentContextMessage);
        contextMenu.style.display = 'none';
    });

    if (pinMenuItem) pinMenuItem.addEventListener('click', () => {
        if (currentContextMessage) pinMessage(currentContextMessage);
        contextMenu.style.display = 'none';
    });

    if (muteMenuItem) muteMenuItem.addEventListener('click', () => {
        if (currentContextMessage && currentContextMessage.userId !== currentUserId) {
            openMuteModal(currentContextMessage.userId, currentContextMessage.username);
        }
        contextMenu.style.display = 'none';
    });

    if (unmuteMenuItem) unmuteMenuItem.addEventListener('click', () => {
        if (currentContextMessage && currentContextMessage.userId !== currentUserId) {
            openUnmuteModal(currentContextMessage.userId, currentContextMessage.username);
        }
        contextMenu.style.display = 'none';
    });

    if (adminMenuItem) adminMenuItem.addEventListener('click', () => {
        if (currentContextMessage && isOwner && currentContextMessage.username !== OWNER_USERNAME) {
            promoteToAdmin(currentContextMessage.userId, currentContextMessage.username);
        }
        contextMenu.style.display = 'none';
    });

    if (unadminMenuItem) unadminMenuItem.addEventListener('click', () => {
        if (currentContextMessage && isOwner && currentContextMessage.isAdmin && currentContextMessage.username !== OWNER_USERNAME) {
            demoteFromAdmin(currentContextMessage.userId, currentContextMessage.username);
        }
        contextMenu.style.display = 'none';
    });
}

function showContextMenu(e, message) {
    e.preventDefault();
    e.stopPropagation();
    currentContextMessage = message;

    const contextMenu = document.getElementById('contextMenu');
    const muteMenuItem = document.getElementById('muteMenuItem');
    const unmuteMenuItem = document.getElementById('unmuteMenuItem');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const unadminMenuItem = document.getElementById('unadminMenuItem');
    const pinMenuItem = document.getElementById('pinMenuItem');

    if (contextMenu) {
        if (muteMenuItem) muteMenuItem.style.display = isAdmin && message.userId !== currentUserId ? 'flex' : 'none';
        if (unmuteMenuItem) unmuteMenuItem.style.display = isAdmin && message.userId !== currentUserId ? 'flex' : 'none';
        if (adminMenuItem) adminMenuItem.style.display = isOwner && message.username !== OWNER_USERNAME ? 'flex' : 'none';
        if (unadminMenuItem) unadminMenuItem.style.display = isOwner && message.isAdmin && message.username !== OWNER_USERNAME ? 'flex' : 'none';
        if (pinMenuItem) pinMenuItem.style.display = isAdmin ? 'flex' : 'none';

        contextMenu.style.left = `${Math.min(e.clientX, window.innerWidth - 200)}px`;
        contextMenu.style.top = `${Math.min(e.clientY, window.innerHeight - 150)}px`;
        contextMenu.style.display = 'block';

        setTimeout(() => {
            document.addEventListener('click', function hideMenu() {
                if (contextMenu) contextMenu.style.display = 'none';
                document.removeEventListener('click', hideMenu);
            }, { once: true });
        }, 10);
    }
}

// ========== PLAY VOICE ==========
let currentAudio = null;
function playVoice(voiceUrl) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    const audio = new Audio(voiceUrl);
    currentAudio = audio;
    audio.play();
    audio.onended = () => { currentAudio = null; };
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
    const imageInput = document.getElementById('drawerImageInput');

    if (floatingChatBtn) {
        floatingChatBtn.addEventListener('click', () => {
            if (chatDrawer) chatDrawer.classList.add('open');
            setTimeout(() => {
                if (drawerMessageInput) drawerMessageInput.focus();
            }, 150);
        });
    }

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', () => {
            if (chatDrawer) chatDrawer.classList.remove('open');
        });
    }

    if (drawerSendBtn) {
        drawerSendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleSendMessage();
        });
    }

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
            if (this.value.trim().length > 0) {
                startTyping();
            } else {
                stopTyping();
            }
        });

        drawerMessageInput.addEventListener('blur', () => stopTyping());
    }

    if (drawerEmojiBtn) {
        drawerEmojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFloatingEmojiPicker();
        });
    }

    if (drawerImageBtn && imageInput) {
        drawerImageBtn.addEventListener('click', () => imageInput.click());
    }

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                pendingImageFile = e.target.files[0];
                showToast(`📷 Gambar siap dikirim! Tekan kirim.`, 'success');
                if (drawerMessageInput) drawerMessageInput.focus();
            }
            imageInput.value = '';
        });
    }
}

// ========== FLOATING EMOJI PICKER ==========
function toggleFloatingEmojiPicker() {
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
                    startTyping();
                }
                if (floatingEmojiPicker) floatingEmojiPicker.style.display = 'none';
            });
        });
    }

    floatingEmojiPicker.style.display = 'block';
}

document.addEventListener('click', (e) => {
    const drawerEmojiBtn = document.getElementById('drawerEmojiBtn');
    if (floatingEmojiPicker && !floatingEmojiPicker.contains(e.target) && e.target !== drawerEmojiBtn) {
        floatingEmojiPicker.style.display = 'none';
    }
});

// ========== FIREBASE SETUP ==========
function setupFirebase() {
    if (!database) return;

    database.ref(`chat/usernames/${currentUserId}`).set({
        username: currentUser, deviceId: currentDeviceId, online: true,
        isAdmin: isAdmin, isOwner: isOwner, joinedAt: firebase.database.ServerValue.TIMESTAMP
    }).catch(e => console.error(e));

    onlineRef = database.ref('chat/online');
    const userOnlineRef = onlineRef.child(currentUserId);
    userOnlineRef.set({ username: currentUser, isAdmin: isAdmin, isOwner: isOwner, lastSeen: firebase.database.ServerValue.TIMESTAMP }).catch(e => console.error(e));
    userOnlineRef.onDisconnect().remove();

    onlineRef.on('value', (snapshot) => {
        const users = snapshot.val();
        let count = 0;
        let usersHtml = '';
        if (users) {
            const userList = [];
            for (let id in users) {
                if (users[id]) {
                    userList.push({ id, username: users[id].username, isAdmin: users[id].isAdmin || false, isOwner: users[id].isOwner || false });
                    count++;
                }
            }
            userList.sort((a, b) => a.username.localeCompare(b.username));
            for (let user of userList) {
                const isUserOwner = (user.username === OWNER_USERNAME);
                const isUserAdmin = (user.isAdmin || isUserOwner);
                usersHtml += `
                    <div class="online-user">
                        <i class="fas fa-circle"></i>
                        <span>${escapeHtml(user.username)}${isUserOwner ? '<span class="owner-badge"><i class="fas fa-crown"></i> Owner</span>' : (isUserAdmin ? '<span class="admin-badge"><i class="fas fa-shield-alt"></i> Admin</span>' : '')}${user.username === currentUser ? '<span style="margin-left: auto; font-size: 0.6rem; opacity: 0.5;">(You)</span>' : ''}</span>
                        <div class="online-user-actions">
                            ${isAdmin && user.id !== currentUserId ? `<button class="kick-btn" onclick="openKickModal('${user.id}', '${escapeHtml(user.username)}')"><i class="fas fa-gavel"></i></button>` : ''}
                            ${isAdmin && user.id !== currentUserId ? `<button class="mute-btn" onclick="openMuteModal('${user.id}', '${escapeHtml(user.username)}')"><i class="fas fa-volume-mute"></i></button>` : ''}
                            ${isOwner && !isUserOwner && user.id !== currentUserId ? `<button class="admin-action-btn" onclick="promoteToAdmin('${user.id}', '${escapeHtml(user.username)}')"><i class="fas fa-crown"></i></button>` : ''}
                            ${isOwner && isUserAdmin && !isUserOwner && user.id !== currentUserId ? `<button class="admin-action-btn" onclick="demoteFromAdmin('${user.id}', '${escapeHtml(user.username)}')" style="background:rgba(220,53,69,0.2);color:#dc3545;"><i class="fas fa-user-minus"></i></button>` : ''}
                        </div>
                    </div>
                `;
            }
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
        if (typing) {
            for (let id in typing) {
                if (id !== currentUserId && typing[id].isTyping && typing[id].username) {
                    const existingTyping = document.querySelector(`.message[data-typing-user="${typing[id].username}"]`);
                    if (!existingTyping && messagesContainer) {
                        const typingHtml = document.createElement('div');
                        typingHtml.className = `message other typing-individual`;
                        typingHtml.setAttribute('data-typing-user', typing[id].username);
                        typingHtml.innerHTML = `
                            <div class="message-avatar"><i class="fas fa-user"></i></div>
                            <div class="message-content"><div class="message-bubble typing-bubble"><div class="typing-dots"><span></span><span></span><span></span></div><div class="typing-text">${escapeHtml(typing[id].username)} sedang mengetik...</div></div></div>
                        `;
                        messagesContainer.appendChild(typingHtml);
                        scrollToBottom();
                    }
                } else {
                    const existingTyping = document.querySelector(`.message[data-typing-user="${typing[id]?.username}"]`);
                    if (existingTyping) existingTyping.remove();
                }
            }
        } else {
            document.querySelectorAll('.typing-individual').forEach(el => el.remove());
        }
    });
}

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
    messageDiv.setAttribute('data-user-id', message.userId);
    const isUserOwner = (message.username === OWNER_USERNAME);
    const isUserAdmin = (message.isAdmin || isUserOwner);

    let replyHtml = '';
    if (message.replyTo) {
        replyHtml = `
            <div class="reply-preview">
                <span class="reply-sender"><i class="fas fa-reply-all"></i> ${escapeHtml(message.replyTo.username)}</span>
                <div class="reply-text-preview">${escapeHtml(message.replyTo.text || (message.replyTo.type === 'image' ? '📷 Gambar' : 'Pesan')).substring(0, 50)}${(message.replyTo.text || '').length > 50 ? '...' : ''}</div>
            </div>
        `;
    }

    let contentHtml = '';
    if (message.type === 'image') {
        contentHtml = `
            <div class="message-bubble" oncontextmenu="showContextMenu(event, ${JSON.stringify(message).replace(/"/g, '&quot;')})">
                ${replyHtml}
                <div class="message-sender">${escapeHtml(message.username)}${isOwn ? ' (You)' : ''}${isUserOwner ? '<span class="owner-badge"><i class="fas fa-crown"></i> Owner</span>' : (isUserAdmin ? '<span class="admin-badge"><i class="fas fa-shield-alt"></i> Admin</span>' : '')}</div>
                <img src="${message.imageUrl}" class="message-image" onclick="previewImage('${message.imageUrl}')" loading="lazy">
                ${message.text ? `<div class="message-text" style="margin-top: 8px;">${escapeHtml(message.text)}</div>` : ''}
                <div class="message-time">${formatTime(message.timestamp)}</div>
            </div>
        `;
    } else if (message.type === 'voice') {
        contentHtml = `
            <div class="message-bubble" oncontextmenu="showContextMenu(event, ${JSON.stringify(message).replace(/"/g, '&quot;')})">
                ${replyHtml}
                <div class="message-sender">${escapeHtml(message.username)}${isOwn ? ' (You)' : ''}${isUserOwner ? '<span class="owner-badge"><i class="fas fa-crown"></i> Owner</span>' : (isUserAdmin ? '<span class="admin-badge"><i class="fas fa-shield-alt"></i> Admin</span>' : '')}</div>
                <div class="voice-message">
                    <button class="voice-play-btn" onclick="playVoice('${message.voiceUrl}')"><i class="fas fa-play"></i></button>
                    <div class="voice-waveform">
                        <div class="wave"></div><div class="wave"></div><div class="wave"></div>
                        <div class="wave"></div><div class="wave"></div><div class="wave"></div>
                    </div>
                    <span class="voice-duration">${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div class="message-time">${formatTime(message.timestamp)}</div>
            </div>
        `;
    } else {
        contentHtml = `
            <div class="message-bubble" oncontextmenu="showContextMenu(event, ${JSON.stringify(message).replace(/"/g, '&quot;')})">
                ${replyHtml}
                <div class="message-sender">${escapeHtml(message.username)}${isOwn ? ' (You)' : ''}${isUserOwner ? '<span class="owner-badge"><i class="fas fa-crown"></i> Owner</span>' : (isUserAdmin ? '<span class="admin-badge"><i class="fas fa-shield-alt"></i> Admin</span>' : '')}</div>
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

// ========== MODALS ==========
function showGroupProfileModal() {
    if (!isAdmin && !isOwner) {
        showToast('Hanya Admin/Owner yang bisa mengubah profil grup!', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="groupProfileModal" class="profile-modal">
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <i class="fas fa-users"></i>
                    <h3>Profil Grup</h3>
                    <button onclick="closeProfileModal()" class="close-modal-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="profile-modal-body">
                    <div class="profile-image-section">
                        <div class="current-profile-image">
                            ${groupProfile.photo ? `<img src="${groupProfile.photo}" id="groupPhotoPreview">` : '<i class="fas fa-users fa-3x"></i>'}
                        </div>
                        <button onclick="document.getElementById('groupPhotoInput').click()" class="btn-secondary">
                            <i class="fas fa-camera"></i> Ganti Foto Grup
                        </button>
                        <input type="file" id="groupPhotoInput" accept="image/*" style="display: none;">
                    </div>
                    <div class="profile-name-section">
                        <label>Nama Grup</label>
                        <input type="text" id="groupNameInput" value="${groupProfile.name}" maxlength="30">
                    </div>
                    <div class="profile-actions">
                        <button onclick="saveGroupProfile()" class="btn-primary"><i class="fas fa-save"></i> Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const oldModal = document.getElementById('groupProfileModal');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('groupPhotoInput').addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('groupPhotoPreview');
                if (preview) preview.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
            window.pendingGroupPhoto = e.target.files[0];
        }
    });
}

async function saveGroupProfile() {
    const newName = document.getElementById('groupNameInput')?.value.trim();
    if (newName && newName !== groupProfile.name) {
        await updateGroupProfile('name', newName);
    }
    if (window.pendingGroupPhoto) {
        await updateGroupProfile('photo', window.pendingGroupPhoto);
        window.pendingGroupPhoto = null;
    }
    closeProfileModal();
}

function closeProfileModal() {
    const modal = document.getElementById('groupProfileModal');
    if (modal) modal.remove();
}

function showGroupStatusModal() {
    if (!isAdmin && !isOwner) {
        showToast('Hanya Admin/Owner yang bisa membuat status grup!', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="groupStatusModal" class="status-modal">
            <div class="status-modal-content">
                <div class="status-modal-header">
                    <i class="fas fa-star"></i>
                    <h3>Buat Status Grup</h3>
                    <button onclick="closeStatusModal()" class="close-modal-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="status-modal-body">
                    <div class="status-type-selector">
                        <button onclick="selectStatusType('text')" id="statusTypeTextBtn" class="type-btn active">Teks</button>
                        <button onclick="selectStatusType('image')" id="statusTypeImageBtn" class="type-btn">Gambar</button>
                        <button onclick="selectStatusType('video')" id="statusTypeVideoBtn" class="type-btn">Video (URL)</button>
                    </div>
                    <div id="statusTextInput" class="status-input-area">
                        <textarea id="statusText" placeholder="Tulis status grup..." maxlength="500"></textarea>
                    </div>
                    <div id="statusImageInput" class="status-input-area" style="display: none;">
                        <input type="file" id="statusImage" accept="image/*">
                        <div id="imagePreview"></div>
                    </div>
                    <div id="statusVideoInput" class="status-input-area" style="display: none;">
                        <input type="text" id="statusVideoUrl" placeholder="Masukkan URL video (mp4, webm, dll)">
                    </div>
                    <div class="status-actions">
                        <button onclick="postGroupStatus()" class="btn-primary"><i class="fas fa-paper-plane"></i> Posting Status</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const oldModal = document.getElementById('groupStatusModal');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    window.selectedStatusType = 'text';
    
    document.getElementById('statusImage')?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('imagePreview');
                if (preview) preview.innerHTML = `<img src="${event.target.result}" style="max-width: 100%; max-height: 150px; border-radius: 8px;">`;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}

function selectStatusType(type) {
    window.selectedStatusType = type;
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`statusType${type.charAt(0).toUpperCase() + type.slice(1)}Btn`)?.classList.add('active');
    document.getElementById('statusTextInput').style.display = type === 'text' ? 'block' : 'none';
    document.getElementById('statusImageInput').style.display = type === 'image' ? 'block' : 'none';
    document.getElementById('statusVideoInput').style.display = type === 'video' ? 'block' : 'none';
}

async function postGroupStatus() {
    const type = window.selectedStatusType;
    if (type === 'text') {
        const text = document.getElementById('statusText')?.value.trim();
        if (!text) { showToast('Masukkan teks status!', 'error'); return; }
        await updateGroupStatus('text', text);
    } else if (type === 'image') {
        const file = document.getElementById('statusImage')?.files[0];
        if (!file) { showToast('Pilih gambar!', 'error'); return; }
        await updateGroupStatus('image', file);
    } else if (type === 'video') {
        const url = document.getElementById('statusVideoUrl')?.value.trim();
        if (!url) { showToast('Masukkan URL video!', 'error'); return; }
        await updateGroupStatus('video', url);
    }
    closeStatusModal();
}

function closeStatusModal() {
    const modal = document.getElementById('groupStatusModal');
    if (modal) modal.remove();
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
            isOwner = (savedUser === OWNER_USERNAME);
            isAdmin = isOwner;
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
window.openMuteModal = openMuteModal;
window.closeMuteModal = closeMuteModal;
window.confirmMute = confirmMute;
window.openUnmuteModal = openUnmuteModal;
window.closeUnmuteModal = closeUnmuteModal;
window.confirmUnmute = confirmUnmute;
window.promoteToAdmin = promoteToAdmin;
window.demoteFromAdmin = demoteFromAdmin;
window.unpinMessage = unpinMessage;
window.cancelReply = cancelReply;
window.playVoice = playVoice;
window.showContextMenu = showContextMenu;
window.handleSendMessage = handleSendMessage;
window.showGroupProfileModal = showGroupProfileModal;
window.showGroupStatusModal = showGroupStatusModal;
window.closeProfileModal = closeProfileModal;
window.closeStatusModal = closeStatusModal;
window.selectStatusType = selectStatusType;
window.postGroupStatus = postGroupStatus;
window.saveGroupProfile = saveGroupProfile;
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.showNotificationHistory = showNotificationHistory;
window.closeNotificationHistory = closeNotificationHistory;
window.markAllNotificationsRead = markAllNotificationsRead;
window.clearAllNotifications = clearAllNotifications;

console.log('💬 Chat System FULL ULTIMATE UPGRADE Ready!');