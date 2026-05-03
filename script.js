import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase, ref, get, set, update, push, onValue } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

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

const BOT_USERNAME = "BizzyImpactBot";
const BOT_LINK = "https://t.me/BizzyImpactBot";

// ========== LOADING SCREEN 2 TAHAP (VIDEO + LEBAH) ==========
let loadingComplete = false;

async function loadLoadingVideoUrl() {
    const videoLoadingRef = ref(db, 'bizzy_settings/loading_video_url');
    const snapshot = await get(videoLoadingRef);
    const videoUrl = snapshot.val();
    if (videoUrl) {
        const loadingVideo = document.getElementById('loadingVideo');
        const sourceElement = loadingVideo.querySelector('source');
        if (sourceElement) {
            sourceElement.src = videoUrl;
            loadingVideo.load();
        }
    }
}

// Skip button functionality
document.getElementById('skipBtn')?.addEventListener('click', () => {
    if (!loadingComplete) {
        loadingComplete = true;
        startBeeAnimation();
    }
});

function startBeeAnimation() {
    // Sembunyikan loading screen 1
    const loadingScreen1 = document.getElementById('loadingScreen1');
    if (loadingScreen1) {
        loadingScreen1.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen1.style.display = 'none';
        }, 800);
    }
    
    // Tampilkan loading screen 2 (lebah)
    const loadingScreen2 = document.getElementById('loadingScreen2');
    if (loadingScreen2) {
        loadingScreen2.style.display = 'flex';
        loadingScreen2.classList.remove('fade-out');
        
        const bee = document.getElementById('bee');
        if (bee) {
            setTimeout(() => bee.classList.add('ready'), 1000);
        }
        
        // Tunggu animasi lebah selesai (13 detik)
        setTimeout(() => {
            if (loadingScreen2) {
                loadingScreen2.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen2.style.display = 'none';
                    document.getElementById('mainContainer').style.display = 'block';
                    checkWebStatus();
                }, 800);
            }
        }, 13000);
    }
}

// Video loading otomatis setelah selesai
function setupAutoVideoTransition() {
    const loadingVideo = document.getElementById('loadingVideo');
    if (loadingVideo) {
        loadingVideo.addEventListener('ended', () => {
            if (!loadingComplete) {
                loadingComplete = true;
                startBeeAnimation();
            }
        });
        // Fallback jika video terlalu panjang (60 detik)
        setTimeout(() => {
            if (!loadingComplete) {
                loadingComplete = true;
                startBeeAnimation();
            }
        }, 60000);
    }
}

// Load video loading URL dari database
loadLoadingVideoUrl();
setupAutoVideoTransition();

function copyCommand(command) {
    navigator.clipboard.writeText(command);
    showToast(`✅ Command ${command} disalin! Gunakan di @${BOT_USERNAME}`);
}

function openBot() {
    window.open(BOT_LINK, '_blank');
}

function openBotCommands() {
    window.open(BOT_LINK, '_blank');
    showToast(`📱 Buka @${BOT_USERNAME} di Telegram`);
}

function showBotNotification(message) {
    const existing = document.querySelector('.bot-notification');
    if (existing) existing.remove();
    const notif = document.createElement('div');
    notif.className = 'bot-notification';
    notif.innerHTML = `<i class="fab fa-telegram"></i> ${message}`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
}

function checkBotStatus() {
    const botStatusRef = ref(db, 'bizzy_settings/bot_status');
    onValue(botStatusRef, (snapshot) => {
        const status = snapshot.val();
        const dot = document.getElementById('botStatusDot');
        const text = document.getElementById('botStatusText');
        if (status && status.online) {
            dot.className = 'status-dot online';
            text.innerHTML = '<i class="fab fa-telegram"></i> Bot Online';
        } else {
            dot.className = 'status-dot offline';
            text.innerHTML = '<i class="fab fa-telegram"></i> Bot Offline';
        }
    });
}

// MUSIC PLAYER
const audioElement = document.getElementById('backgroundAudio');
let currentTrack = null;
let isPlaying = false;

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function searchMusic(query) {
    const resultsDiv = document.getElementById('resultsList');
    const loadingDiv = document.querySelector('.search-loading');
    if (!query.trim()) { resultsDiv.innerHTML = '<div style="text-align:center; padding:20px;">Masukkan judul lagu</div>'; return; }
    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    try {
        const response = await fetch(`https://api-faa.my.id/faa/soundcloud-play?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        loadingDiv.style.display = 'none';
        if (data.status && data.result) {
            const r = data.result;
            resultsDiv.innerHTML = `<div class="result-item" data-title="${escapeHtml(r.title)}" data-url="${r.download_url}" data-thumb="${r.thumbnail}" data-user="${r.user}" data-duration="${r.duration}">
                <img src="${r.thumbnail}" class="result-thumb" onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
                <div class="result-info"><div class="result-title">${escapeHtml(r.title)}</div><div class="result-user">${escapeHtml(r.user)}</div><div class="result-duration">⏱️ ${formatDuration(r.duration)}</div></div>
            </div>`;
            document.querySelector('.result-item')?.addEventListener('click', function() {
                const title = this.getAttribute('data-title');
                const url = this.getAttribute('data-url');
                const thumb = this.getAttribute('data-thumb');
                const user = this.getAttribute('data-user');
                playMusic(title, url, thumb, user);
            });
        } else {
            resultsDiv.innerHTML = '<div style="text-align:center; padding:20px;">Lagu tidak ditemukan</div>';
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        resultsDiv.innerHTML = '<div style="text-align:center; padding:20px;">Error mencari lagu</div>';
    }
}

function playMusic(title, url, thumbnail, user) {
    currentTrack = { title, url, thumbnail, user };
    audioElement.src = url;
    audioElement.load();
    audioElement.play().catch(e => console.log);
    isPlaying = true;
    document.getElementById('nowPlayingSection').style.display = 'flex';
    document.getElementById('musicControls').style.display = 'flex';
    document.getElementById('volumeSliderDiv').style.display = 'block';
    document.getElementById('nowPlayingThumb').src = thumbnail || 'https://via.placeholder.com/50x50?text=Music';
    document.getElementById('nowPlayingTitle').innerHTML = escapeHtml(title);
    document.getElementById('nowPlayingUser').innerHTML = escapeHtml(user || 'Unknown');
    document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
    localStorage.setItem('bizzy_music_track', JSON.stringify({ title, url, thumbnail, user, currentTime: audioElement.currentTime, isPlaying: true }));
}

function togglePlayPause() {
    if (!currentTrack) return;
    if (isPlaying) { audioElement.pause(); document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i>'; isPlaying = false; }
    else { audioElement.play(); document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-pause"></i>'; isPlaying = true; }
}

function stopMusic() {
    audioElement.pause();
    audioElement.src = '';
    currentTrack = null;
    isPlaying = false;
    document.getElementById('nowPlayingSection').style.display = 'none';
    document.getElementById('musicControls').style.display = 'none';
    document.getElementById('volumeSliderDiv').style.display = 'none';
    localStorage.removeItem('bizzy_music_track');
}

function setVolume(value) { const vol = Math.min(1, Math.max(0, value / 100)); audioElement.volume = vol; document.getElementById('volumeSlider').value = value; }
function volumeUp() { let newVol = Math.min(100, (audioElement.volume * 100) + 10); setVolume(newVol); }
function volumeDown() { let newVol = Math.max(0, (audioElement.volume * 100) - 10); setVolume(newVol); }

function loadSavedMusic() {
    const savedTrack = localStorage.getItem('bizzy_music_track');
    const savedVolume = localStorage.getItem('bizzy_music_volume');
    if (savedVolume) { audioElement.volume = parseFloat(savedVolume); document.getElementById('volumeSlider').value = savedVolume * 100; }
    if (savedTrack) {
        try {
            const track = JSON.parse(savedTrack);
            if (track.url) {
                currentTrack = track;
                audioElement.src = track.url;
                audioElement.currentTime = track.currentTime || 0;
                if (track.isPlaying) audioElement.play().catch(e => console.log);
                document.getElementById('nowPlayingThumb').src = track.thumbnail;
                document.getElementById('nowPlayingTitle').innerHTML = escapeHtml(track.title);
                document.getElementById('nowPlayingUser').innerHTML = escapeHtml(track.user || 'Unknown');
                document.getElementById('nowPlayingSection').style.display = 'flex';
                document.getElementById('musicControls').style.display = 'flex';
                document.getElementById('volumeSliderDiv').style.display = 'block';
            }
        } catch(e) {}
    }
}

// THEME MODES
let currentMode = localStorage.getItem('bizzy_theme_mode') || 'light';

function applyTheme(mode) {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(mode);
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.getAttribute('data-mode') === mode) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    localStorage.setItem('bizzy_theme_mode', mode);
}

// REVIEW & RATING
let selectedRating = 0;

function initStarRating() {
    document.querySelectorAll('.star-input').forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            selectedRating = rating;
            document.querySelectorAll('.star-input').forEach(s => {
                if (parseInt(s.getAttribute('data-rating')) <= rating) s.classList.add('active');
                else s.classList.remove('active');
            });
        });
    });
}

function loadReviews() {
    onValue(ref(db, 'bizzy_reviews'), (snapshot) => {
        const reviews = snapshot.val();
        const container = document.getElementById('reviewList');
        let totalRating = 0, reviewCount = 0;
        if (!reviews) {
            container.innerHTML = '<div class="review-loading"><i class="fas fa-comment"></i> Belum ada ulasan.</div>';
            document.getElementById('totalReviews').innerText = '0 ulasan';
            document.getElementById('avgRating').innerText = '0.0';
            document.getElementById('avgStarsDisplay').innerHTML = '☆☆☆☆☆';
            return;
        }
        const reviewsArray = Object.entries(reviews).sort((a,b) => new Date(b[1].createdAt) - new Date(a[1].createdAt));
        reviewCount = reviewsArray.length;
        let html = '';
        for (const [id, review] of reviewsArray) {
            totalRating += review.rating;
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const maskedUser = review.userName ? review.userName.substring(0, 3) + '****' + review.userName.substring(review.userName.length - 2) : 'User****';
            html += `<div class="review-item"><div class="review-header"><span class="review-user"><i class="fas fa-user-circle"></i> ${escapeHtml(maskedUser)}</span><span class="review-stars">${stars}</span></div><div class="review-text">${escapeHtml(review.text)}</div>${review.packageName ? `<div class="review-package"><i class="fas fa-tag"></i> ${escapeHtml(review.packageName)}</div>` : ''}<div class="review-date">${new Date(review.createdAt).toLocaleDateString()}</div></div>`;
        }
        const avgRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : '0.0';
        const avgStars = reviewCount > 0 ? '★'.repeat(Math.round(totalRating / reviewCount)) + '☆'.repeat(5 - Math.round(totalRating / reviewCount)) : '☆☆☆☆☆';
        container.innerHTML = html;
        document.getElementById('totalReviews').innerText = reviewCount + ' ulasan';
        document.getElementById('avgRating').innerText = avgRating;
        document.getElementById('avgStarsDisplay').innerHTML = avgStars;
    });
}

async function submitReview() {
    if (!currentUserId || !currentUsername) { showToast("Silakan login terlebih dahulu!"); return; }
    if (selectedRating === 0) { showToast("Pilih rating bintang terlebih dahulu!"); return; }
    const text = document.getElementById('reviewText').value.trim();
    if (!text) { showToast("Tulis ulasan Anda terlebih dahulu!"); return; }
    const packageName = document.getElementById('reviewPackage').value.trim();
    await push(ref(db, 'bizzy_reviews'), { userId: currentUserId, userName: currentUsername, rating: selectedRating, text: text, packageName: packageName || null, createdAt: new Date().toISOString() });
    showToast("✅ Ulasan berhasil dikirim!");
    document.getElementById('reviewText').value = '';
    document.getElementById('reviewPackage').value = '';
    selectedRating = 0;
    document.querySelectorAll('.star-input').forEach(s => s.classList.remove('active'));
    showBotNotification("⭐ Ulasan baru! Terima kasih!");
}

// MAIN VARIABLES
let currentUserId = null;
let currentUsername = null;
let selectedProduct = null;
let selectedPrice = 0;
let slides = [];
let currentSlide = 0;
let slideInterval;
let navGroupActive = 1;

function setupNavSwitch() {
    const switchBtn = document.getElementById('navSwitchBtn');
    const group1 = document.getElementById('navGroup1');
    const group2 = document.getElementById('navGroup2');
    const switchText = document.getElementById('switchText');
    
    if (!switchBtn) return;
    
    switchBtn.addEventListener('click', () => {
        if (navGroupActive === 1) {
            group1.style.display = 'none';
            group2.style.display = 'flex';
            navGroupActive = 2;
            switchText.innerHTML = '<<';
        } else {
            group1.style.display = 'flex';
            group2.style.display = 'none';
            navGroupActive = 1;
            switchText.innerHTML = '>>';
        }
    });
}

function loadVideoUrl() {
    const videoRef = ref(db, 'bizzy_settings/video_url');
    onValue(videoRef, (snapshot) => {
        const videoUrl = snapshot.val();
        if (videoUrl) {
            const videoElement = document.getElementById('promoVideo');
            const sourceElement = videoElement.querySelector('source');
            sourceElement.src = videoUrl;
            videoElement.load();
        }
    });
}

async function checkWebStatus() {
    const statusRef = ref(db, 'bizzy_settings/web_status');
    const snapshot = await get(statusRef);
    const status = snapshot.val();
    if (status) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const closeTotalMinutes = (status.closeHour || 23) * 60 + (status.closeMinute || 0);
        const openTotalMinutes = (status.openHour || 8) * 60 + (status.openMinute || 0);
        let shouldClose = false;
        if (status.manualClosed === true) {
            shouldClose = true;
        } else if (status.closeHour !== undefined && status.openHour !== undefined) {
            if (closeTotalMinutes > openTotalMinutes) {
                shouldClose = (currentTotalMinutes >= closeTotalMinutes || currentTotalMinutes < openTotalMinutes);
            } else {
                shouldClose = (currentTotalMinutes >= closeTotalMinutes && currentTotalMinutes < openTotalMinutes);
            }
        }
        if (shouldClose) {
            document.getElementById('webClosedOverlay').classList.add('active');
            const openHour = (status.openHour || 8).toString().padStart(2,'0');
            const openMinute = (status.openMinute || 0).toString().padStart(2,'0');
            document.getElementById('closedMessage').innerHTML = status.message || `Web akan buka kembali pukul ${openHour}:${openMinute} WIB`;
            return false;
        }
    }
    document.getElementById('webClosedOverlay').classList.remove('active');
    return true;
}

function updateClock() {
    const now = new Date();
    const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tanggal = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('liveClock').innerHTML = `<i class="fas fa-clock"></i> ${tanggal} | ${waktu}`;
}
setInterval(updateClock, 1000);
updateClock();

async function updateVisitorCount() {
    const visitorRef = ref(db, 'bizzy_visitors');
    const snapshot = await get(visitorRef);
    let count = snapshot.val() || 0;
    count++;
    await set(visitorRef, count);
    document.getElementById('visitorNumber').innerText = count;
}
updateVisitorCount();

function loadSliders() {
    const slidesRef = ref(db, 'bizzy_settings/slides');
    onValue(slidesRef, (snapshot) => {
        const data = snapshot.val();
        slides = data ? Object.values(data) : [];
        renderSlider();
        if (slides.length > 1) startAutoSlide();
    });
}

function renderSlider() {
    const slider = document.getElementById('slider');
    const dots = document.getElementById('sliderDots');
    if (!slider) return;
    if (slides.length === 0) {
        slider.innerHTML = `<div class="slide"><img src="https://via.placeholder.com/500x150?text=Bizzy+Impact" alt="Slide"></div>`;
        dots.innerHTML = '';
        return;
    }
    slider.innerHTML = slides.map(slide => `<div class="slide"><img src="${slide.imageUrl}" alt="Slide" onerror="this.src='https://via.placeholder.com/500x150?text=Error'"></div>`).join('');
    dots.innerHTML = slides.map((_, i) => `<div class="dot ${i === currentSlide ? 'active' : ''}" onclick="goToSlide(${i})"></div>`).join('');
}

function startAutoSlide() { if (slideInterval) clearInterval(slideInterval); slideInterval = setInterval(() => nextSlide(), 5000); }
function nextSlide() { if (!slides.length) return; currentSlide = (currentSlide + 1) % slides.length; updateSlidePosition(); }
function prevSlide() { if (!slides.length) return; currentSlide = (currentSlide - 1 + slides.length) % slides.length; updateSlidePosition(); }
function goToSlide(index) { currentSlide = index; updateSlidePosition(); }
function updateSlidePosition() {
    const slider = document.getElementById('slider');
    if (slider) slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.dot').forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}

window.prevSlide = prevSlide;
window.nextSlide = nextSlide;
window.goToSlide = goToSlide;

function loadTotalQueue() {
    const ordersRef = ref(db, 'bizzy_orders');
    onValue(ordersRef, (snapshot) => {
        const orders = snapshot.val();
        if (orders) {
            const pendingOrders = Object.values(orders).filter(o => o.status === 'pending' || o.status === 'processing');
            document.getElementById('queueTotal').innerText = pendingOrders.length;
        } else {
            document.getElementById('queueTotal').innerText = '0';
        }
    });
}

async function loadMyQueue() {
    if (!currentUserId) return;
    const ordersRef = ref(db, 'bizzy_orders');
    const snapshot = await get(ordersRef);
    const orders = snapshot.val();
    if (orders) {
        const myOrders = Object.entries(orders).filter(([id, order]) => order.userId === currentUserId);
        const pendingOrder = myOrders.find(([id, order]) => order.status === 'pending' || order.status === 'processing');
        if (pendingOrder) {
            const status = pendingOrder[1].status;
            const queueNumber = pendingOrder[1].queueNumber || '?';
            if (status === 'pending') {
                document.getElementById('myQueueBadge').innerHTML = `<i class="fas fa-hourglass-half"></i> Antrian: ${queueNumber}`;
            } else if (status === 'processing') {
                document.getElementById('myQueueBadge').innerHTML = `<i class="fas fa-spinner fa-pulse"></i> Sedang Diproses`;
            }
        } else {
            document.getElementById('myQueueBadge').innerHTML = `<i class="fas fa-check"></i> Tidak Ada Antrian`;
        }
    }
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    if (!username || username.length < 3) { showToast("Username minimal 3 karakter!"); return; }
    if (!password || password.length < 4) { showToast("Password minimal 4 karakter!"); return; }
    const usersRef = ref(db, 'bizzy_users');
    const snapshot = await get(usersRef);
    let exists = false;
    if (snapshot.exists()) {
        const users = snapshot.val();
        for (let key in users) {
            if (users[key].username === username) { exists = true; break; }
        }
    }
    if (exists) { showToast("Username sudah digunakan!"); return; }
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const hashedPassword = await hashPassword(password);
    const userData = { username: username, passwordHash: hashedPassword, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() };
    await set(ref(db, `bizzy_users/${userId}`), userData);
    localStorage.setItem('bizzy_userId', userId);
    localStorage.setItem('bizzy_username', username);
    showToast("✅ Pendaftaran berhasil!");
    showLogin();
    showBotNotification("🎉 Pendaftaran berhasil! Silakan login.");
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) { showToast("Isi username dan password!"); return; }
    const usersRef = ref(db, 'bizzy_users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) { showToast("Username tidak ditemukan!"); return; }
    const hashedInput = await hashPassword(password);
    let userId = null;
    const users = snapshot.val();
    for (let key in users) {
        if (users[key].username === username && users[key].passwordHash === hashedInput) {
            userId = key;
            break;
        }
    }
    if (!userId) { showToast("Password salah!"); return; }
    await update(ref(db, `bizzy_users/${userId}`), { lastLogin: new Date().toISOString() });
    localStorage.setItem('bizzy_userId', userId);
    localStorage.setItem('bizzy_username', username);
    currentUserId = userId;
    currentUsername = username;
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('bottomNav').style.display = 'flex';
    document.getElementById('welcomeUsername').innerText = username;
    loadMyQueue();
    showToast("✅ Login berhasil!");
    showBotNotification(`👋 Selamat datang ${username}!`);
}

async function handleLogout() {
    localStorage.removeItem('bizzy_userId');
    localStorage.removeItem('bizzy_username');
    currentUserId = null;
    currentUsername = null;
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('bottomNav').style.display = 'none';
    showToast("✅ Logout berhasil!");
}

function showRegister() { document.getElementById('authSection').style.display = 'none'; document.getElementById('registerSection').style.display = 'block'; }
function showLogin() { document.getElementById('authSection').style.display = 'block'; document.getElementById('registerSection').style.display = 'none'; }
function showToast(msg) { let toast = document.createElement('div'); toast.className = 'toast'; toast.innerHTML = msg; document.body.appendChild(toast); setTimeout(() => toast.remove(), 3000); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('open'); }
function openMyOrders() { window.location.href = 'my-orders.html'; }
function openCustomerService() { window.location.href = 'cs.html'; }
function openAdmin() { window.location.href = 'admin.html'; }
function showPrivacy() { alert("🔒 KEBIJAKAN PRIVASI\n\nData Anda aman dan tidak akan disalahgunakan."); }
function showReadme() { alert("📢 INFO\n\nBizzy Impact Official - Jasa Joki Genshin Impact\n\n✅ Explore Region 100%\n✅ Leveling Character/Weapon/Talent\n✅ Proses Cepat & Aman\n✅ Harga Terjangkau\n\n🤖 Bot Telegram: @BizzyImpactBot\nCommand: /start, /cek_antrian, /data_akun, /laporan\n\nTerima kasih! 🙏"); }

function initCategoryNav() {
    const btns = document.querySelectorAll('.category-btn');
    const pages = { 
        explore: document.getElementById('page-explore'), 
        character: document.getElementById('page-character'),
        weapon: document.getElementById('page-weapon'),
        talent: document.getElementById('page-talent'),
        quest: document.getElementById('page-quest'),
        reviews: document.getElementById('page-reviews'), 
        info: document.getElementById('page-info') 
    };
    
    function switchCategory(category) {
        Object.values(pages).forEach(p => p?.classList.remove('active'));
        btns.forEach(b => b.classList.remove('active'));
        if (category === 'explore') { pages.explore?.classList.add('active'); btns[0]?.classList.add('active'); }
        else if (category === 'character') { pages.character?.classList.add('active'); btns[1]?.classList.add('active'); }
        else if (category === 'weapon') { pages.weapon?.classList.add('active'); btns[2]?.classList.add('active'); }
        else if (category === 'talent') { pages.talent?.classList.add('active'); btns[3]?.classList.add('active'); }
        else if (category === 'quest') { pages.quest?.classList.add('active'); btns[4]?.classList.add('active'); }
        else if (category === 'reviews') { pages.reviews?.classList.add('active'); btns[5]?.classList.add('active'); }
        else if (category === 'info') { pages.info?.classList.add('active'); btns[6]?.classList.add('active'); }
    }
    
    btns.forEach((btn, idx) => { btn.addEventListener('click', () => { const cat = btn.getAttribute('data-cat'); switchCategory(cat); }); });
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => {
        nav.addEventListener('click', () => {
            const navTarget = nav.getAttribute('data-nav');
            if (navTarget === 'explore') switchCategory('explore');
            else if (navTarget === 'character') switchCategory('character');
            else if (navTarget === 'weapon') switchCategory('weapon');
            else if (navTarget === 'talent') switchCategory('talent');
            else if (navTarget === 'quest') switchCategory('quest');
            else if (navTarget === 'reviews') switchCategory('reviews');
            else if (navTarget === 'info') switchCategory('info');
            else if (navTarget === 'music') {
                document.getElementById('musicModal').classList.add('active');
                if (currentTrack) {
                    document.getElementById('nowPlayingSection').style.display = 'flex';
                    document.getElementById('musicControls').style.display = 'flex';
                    document.getElementById('volumeSliderDiv').style.display = 'block';
                    document.getElementById('playPauseBtn').innerHTML = !audioElement.paused ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
                }
            }
            navItems.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');
        });
    });
}

function initPriceCards() {
    document.querySelectorAll('.price-card').forEach(card => {
        card.addEventListener('click', () => {
            const name = card.getAttribute('data-name');
            const price = parseInt(card.getAttribute('data-price'));
            if (name && price && price > 0) { 
                selectedProduct = name; 
                selectedPrice = price; 
                showToast(`✅ ${name} - Rp ${price.toLocaleString()} dipilih`); 
            }
            else if (name && name.includes('PROGRESS')) {
                let percent = prompt('Masukkan persentase progress yang ingin dinaikkan (1-100):', '10');
                percent = parseInt(percent);
                if (percent && percent > 0 && percent <= 100) {
                    if (percent <= 90) { selectedPrice = percent * 1000; }
                    else { selectedPrice = (90 * 1000) + ((percent - 90) * 2000); }
                    selectedProduct = `${name} (${percent}%)`;
                    showToast(`✅ ${selectedProduct} - Rp ${selectedPrice.toLocaleString()} dipilih`);
                }
            }
        });
    });
}

document.getElementById('orderBtn')?.addEventListener('click', async () => {
    if (!selectedProduct || !selectedPrice) { showToast("Pilih paket terlebih dahulu!"); return; }
    if (!currentUserId) { showToast("Silakan login terlebih dahulu!"); return; }
    const ordersRef = ref(db, 'bizzy_orders');
    const snapshot = await get(ordersRef);
    const orders = snapshot.val();
    if (orders) { const myPending = Object.values(orders).some(o => o.userId === currentUserId && (o.status === 'pending' || o.status === 'processing')); if (myPending) { showToast("⚠️ Anda masih memiliki pesanan aktif! Selesaikan dulu."); return; } }
    localStorage.setItem('bizzy_order_product', selectedProduct);
    localStorage.setItem('bizzy_order_price', selectedPrice);
    localStorage.setItem('bizzy_order_user', currentUsername);
    localStorage.setItem('bizzy_order_userId', currentUserId);
    window.location.href = 'order.html';
});

async function checkSession() {
    const userId = localStorage.getItem('bizzy_userId');
    const username = localStorage.getItem('bizzy_username');
    if (userId && username) {
        const userRef = ref(db, `bizzy_users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            currentUserId = userId;
            currentUsername = username;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('registerSection').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('bottomNav').style.display = 'flex';
            document.getElementById('welcomeUsername').innerText = username;
            initCategoryNav();
            initPriceCards();
            setupNavSwitch();
            loadMyQueue();
            return;
        }
    }
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('bottomNav').style.display = 'none';
    initCategoryNav();
    initPriceCards();
    setupNavSwitch();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function setupMusicPlayer() {
    const musicModal = document.getElementById('musicModal');
    document.getElementById('closeMusicBtn')?.addEventListener('click', () => musicModal.classList.remove('active'));
    document.getElementById('searchSongBtn')?.addEventListener('click', () => searchMusic(document.getElementById('searchSongInput').value));
    document.getElementById('searchSongInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchMusic(e.target.value); });
    document.getElementById('playPauseBtn')?.addEventListener('click', togglePlayPause);
    document.getElementById('stopMusicBtn')?.addEventListener('click', stopMusic);
    document.getElementById('volumeUpBtn')?.addEventListener('click', volumeUp);
    document.getElementById('volumeDownBtn')?.addEventListener('click', volumeDown);
    document.getElementById('volumeSlider')?.addEventListener('input', (e) => setVolume(parseInt(e.target.value)));
}

// EXPOSE GLOBAL FUNCTIONS
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.openMyOrders = openMyOrders;
window.openCustomerService = openCustomerService;
window.openAdmin = openAdmin;
window.showPrivacy = showPrivacy;
window.showReadme = showReadme;
window.copyCommand = copyCommand;
window.openBotCommands = openBotCommands;
window.openBot = openBot;

// INITIALIZE
applyTheme(currentMode);
document.querySelectorAll('.mode-btn').forEach(btn => btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-mode'))));

initStarRating();
document.getElementById('submitReviewBtn')?.addEventListener('click', submitReview);
loadReviews();

setupMusicPlayer();
loadSavedMusic();

checkBotStatus();
loadVideoUrl();
loadSliders();
loadTotalQueue();
checkSession();