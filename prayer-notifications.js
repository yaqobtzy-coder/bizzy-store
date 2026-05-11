// ========== PRAYER SCHEDULE & NOTIFICATIONS ==========
// Fitur: Jadwal sholat otomatis, notifikasi lengkap

// Konfigurasi
const PRAYER_API_URL = 'https://api.myquran.com/v2/sholat/jadwal/3204/2026/05/10'; // Bandung
const CHECK_INTERVAL = 60000; // Cek setiap 1 menit
const NOTIFICATION_SOUND = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3';

// State
let prayerSchedule = null;
let lastNotifiedPrayers = [];
let notificationPermission = false;
let prayerCheckInterval = null;

// ========== REQUEST NOTIFICATION PERMISSION ==========
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationPermission = permission === 'granted';
        if (notificationPermission) {
            console.log('✅ Notifikasi diizinkan');
            showToast('Notifikasi diaktifkan!', 'success');
        } else {
            console.log('❌ Notifikasi ditolak');
        }
    }
}

// ========== SEND PUSH NOTIFICATION ==========
function sendNotification(title, body, options = {}) {
    // Notifikasi browser
    if (notificationPermission && 'Notification' in window) {
        const notification = new Notification(title, {
            body: body,
            icon: options.icon || 'https://via.placeholder.com/192',
            badge: options.badge || 'https://via.placeholder.com/72',
            vibrate: options.vibrate || [200, 100, 200],
            silent: options.silent || false,
            tag: options.tag || 'prayer-notification',
            requireInteraction: options.permanent || false,
            actions: options.actions || [
                { action: 'close', title: 'Tutup' }
            ]
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        setTimeout(() => notification.close(), options.timeout || 10000);
    }
    
    // Notifikasi floating (toast style)
    showFloatingNotification(title, body);
    
    // Suara notifikasi
    if (!options.silent) {
        playNotificationSound();
    }
    
    // Getaran (jika support)
    if (options.vibrate && navigator.vibrate) {
        navigator.vibrate(options.vibrate);
    }
    
    // Simpan ke history notifikasi
    saveNotificationToHistory(title, body, Date.now());
}

function showFloatingNotification(title, message) {
    // Cek apakah sudah ada floating notif
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
    
    // Animasi masuk
    setTimeout(() => notifDiv.classList.add('show'), 10);
    
    // Tombol close
    notifDiv.querySelector('.floating-notif-close').addEventListener('click', () => {
        notifDiv.classList.remove('show');
        setTimeout(() => notifDiv.remove(), 300);
    });
    
    // Auto close setelah 10 detik
    setTimeout(() => {
        if (notifDiv.parentNode) {
            notifDiv.classList.remove('show');
            setTimeout(() => notifDiv.remove(), 300);
        }
    }, 10000);
}

function playNotificationSound() {
    try {
        const audio = new Audio(NOTIFICATION_SOUND);
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play error:', e));
    } catch (error) {
        console.log('Sound error:', error);
    }
}

// ========== SAVE NOTIFICATION HISTORY ==========
async function saveNotificationToHistory(title, body, timestamp) {
    if (!database) return;
    
    try {
        await database.ref('chat/notificationHistory').push({
            title: title,
            body: body,
            timestamp: timestamp,
            read: false
        });
        
        // Update badge count
        updateNotificationBadge();
    } catch (error) {
        console.error('Error saving notification:', error);
    }
}

async function updateNotificationBadge() {
    if (!database) return;
    
    const snapshot = await database.ref('chat/notificationHistory').orderByChild('read').equalTo(false).once('value');
    const unreadCount = snapshot.numChildren();
    
    // Update title badge
    const title = unreadCount > 0 ? `(${unreadCount}) Global Chat+` : 'Global Chat+';
    document.title = title;
    
    // Update lencana notifikasi (jika support)
    if ('setAppBadge' in navigator && unreadCount > 0) {
        navigator.setAppBadge(unreadCount).catch(e => console.log('Badge error:', e));
    } else if ('clearAppBadge' in navigator && unreadCount === 0) {
        navigator.clearAppBadge().catch(e => console.log('Clear badge error:', e));
    }
}

// ========== FETCH PRAYER SCHEDULE ==========
async function fetchPrayerSchedule() {
    try {
        // API untuk Kota Bandung
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        // Gunakan API MyQuran (Indonesia)
        const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/3204/${year}/${month}/${day}`);
        const data = await response.json();
        
        if (data.status && data.data) {
            const jadwal = data.data.jadwal;
            prayerSchedule = {
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
            
            console.log('✅ Jadwal sholat loaded:', prayerSchedule);
            updatePrayerDisplay();
            return prayerSchedule;
        }
    } catch (error) {
        console.error('Error fetching prayer schedule:', error);
        // Fallback ke data manual
        prayerSchedule = {
            imsak: "04:24",
            subuh: "04:34",
            terbit: "05:44",
            dhuha: "06:17",
            dzuhur: "11:50",
            ashar: "15:10",
            maghrib: "17:48",
            isya: "18:56",
            tanggal: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            kota: 'Bandung'
        };
        return prayerSchedule;
    }
}

// ========== CHECK PRAYER TIME ==========
async function checkPrayerTimes() {
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
        // Cek apakah waktu sholat sudah tiba (dalam 5 menit)
        const [hour, minute] = prayer.time.split(':');
        const prayerTime = new Date();
        prayerTime.setHours(parseInt(hour), parseInt(minute), 0);
        
        const timeDiff = prayerTime - now;
        const minutesDiff = Math.floor(timeDiff / 60000);
        
        // Kirim notifikasi 5 menit sebelum dan tepat waktu
        if ((minutesDiff === 5 || minutesDiff === 0) && !lastNotifiedPrayers.includes(prayer.name)) {
            lastNotifiedPrayers.push(prayer.name);
            
            // Kirim notifikasi ke semua user melalui chat
            if (messagesRef) {
                await messagesRef.push({
                    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    userId: 'system',
                    username: '🕌 Bot Sholat',
                    text: `🔔 ${prayer.message}\n⏰ ${prayer.time} WIB\n📍 ${prayerSchedule.kota}`,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    type: 'system'
                });
            }
            
            // Kirim notifikasi ke semua device
            sendNotification(
                `🕌 Waktu ${prayer.name}`,
                prayer.message,
                {
                    vibrate: [200, 100, 200],
                    permanent: prayer.name === 'Subuh' || prayer.name === 'Maghrib', // Notif permanen untuk Subuh & Maghrib
                    tag: `prayer-${prayer.name}`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/3034/3034126.png'
                }
            );
        }
    }
    
    // Reset lastNotified setiap hari
    const today = new Date().toDateString();
    if (window.lastCheckDate !== today) {
        lastNotifiedPrayers = [];
        window.lastCheckDate = today;
    }
}

// ========== UPDATE PRAYER DISPLAY ==========
function updatePrayerDisplay() {
    const prayerContainer = document.querySelector('.prayer-schedule-container');
    if (!prayerContainer) return;
    
    if (prayerSchedule) {
        prayerContainer.innerHTML = `
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
        
        // Highlight waktu sholat terdekat
        highlightNextPrayer();
    }
}

function highlightNextPrayer() {
    if (!prayerSchedule) return;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
        { name: 'imsak', time: timeToMinutes(prayerSchedule.imsak) },
        { name: 'subuh', time: timeToMinutes(prayerSchedule.subuh) },
        { name: 'dzuhur', time: timeToMinutes(prayerSchedule.dzuhur) },
        { name: 'ashar', time: timeToMinutes(prayerSchedule.ashar) },
        { name: 'maghrib', time: timeToMinutes(prayerSchedule.maghrib) },
        { name: 'isya', time: timeToMinutes(prayerSchedule.isya) }
    ];
    
    let nextPrayer = null;
    for (const prayer of prayers) {
        if (prayer.time > currentTime) {
            nextPrayer = prayer;
            break;
        }
    }
    
    if (nextPrayer) {
        const items = document.querySelectorAll('.prayer-item');
        items.forEach(item => {
            const strong = item.querySelector('strong');
            if (strong && strong.innerText === prayerSchedule[nextPrayer.name]) {
                item.classList.add('next-prayer');
            }
        });
    }
}

function timeToMinutes(timeStr) {
    const [hour, minute] = timeStr.split(':');
    return parseInt(hour) * 60 + parseInt(minute);
}

// ========== SHOW NOTIFICATION HISTORY ==========
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
                    `).join('') : '<div class="no-notifications">Tidak ada notifikasi</div>'}
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
    
    // Tandai sebagai dibaca
    if (notifications) {
        for (const [id, notif] of Object.entries(notifications)) {
            if (!notif.read) {
                await database.ref(`chat/notificationHistory/${id}`).update({ read: true });
            }
        }
        updateNotificationBadge();
    }
}

async function markAllNotificationsRead() {
    if (!database) return;
    
    const snapshot = await database.ref('chat/notificationHistory').orderByChild('read').equalTo(false).once('value');
    const updates = {};
    snapshot.forEach(child => {
        updates[child.key] = { read: true };
    });
    
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

function closeNotificationHistory() {
    const modal = document.getElementById('notificationHistoryModal');
    if (modal) modal.remove();
}

// ========== START PRAYER SCHEDULE CHECKER ==========
function startPrayerChecker() {
    if (prayerCheckInterval) clearInterval(prayerCheckInterval);
    
    // Fetch pertama
    fetchPrayerSchedule();
    checkPrayerTimes();
    
    // Cek setiap menit
    prayerCheckInterval = setInterval(() => {
        checkPrayerTimes();
    }, CHECK_INTERVAL);
    
    // Refresh jadwal setiap jam
    setInterval(() => {
        fetchPrayerSchedule();
    }, 3600000);
}

// ========== NOTIFICATION TOGGLE BUTTON ==========
function createNotificationPanel() {
    const panelHtml = `
        <div class="notification-panel" id="notificationPanel">
            <div class="notification-header" onclick="toggleNotificationDropdown()">
                <i class="fas fa-bell"></i>
                <span id="notificationBadge" class="notification-badge">0</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="notification-dropdown" id="notificationDropdown" style="display: none;">
                <div class="dropdown-header">
                    <span>Notifikasi</span>
                    <button onclick="showNotificationHistory()" class="view-all-btn">Lihat Semua</button>
                </div>
                <div class="notification-list" id="recentNotificationsList">
                    <div class="loading">Memuat...</div>
                </div>
            </div>
        </div>
    `;
    
    const existingPanel = document.querySelector('.notification-panel');
    if (existingPanel) existingPanel.remove();
    
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        chatHeader.insertAdjacentHTML('beforeend', panelHtml);
        loadRecentNotifications();
        
        // Subscribe ke notifikasi baru
        if (database) {
            database.ref('chat/notificationHistory').limitToLast(5).on('child_added', () => {
                loadRecentNotifications();
                updateNotificationBadge();
            });
        }
    }
}

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
            listContainer.innerHTML = '<div class="no-notifications">Tidak ada notifikasi</div>';
        }
    }
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'flex';
        dropdown.style.display = isVisible ? 'none' : 'flex';
    }
}

// ========== INITIALIZATION ==========
async function initPrayerSystem() {
    await requestNotificationPermission();
    await fetchPrayerSchedule();
    startPrayerChecker();
    createNotificationPanel();
    
    // Auto scroll ke notifikasi penting
    setInterval(() => {
        updateNotificationBadge();
    }, 30000);
}

// Export functions
window.requestNotificationPermission = requestNotificationPermission;
window.showNotificationHistory = showNotificationHistory;
window.closeNotificationHistory = closeNotificationHistory;
window.markAllNotificationsRead = markAllNotificationsRead;
window.clearAllNotifications = clearAllNotifications;
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.initPrayerSystem = initPrayerSystem;