// ========================================
// GLOBAL VARIABLES
// ========================================
let products = [];
let sewaProducts = [];
let scriptProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || { name: '' };
let swiperInstance = null;
let isCheckingName = false;

// ========================================
// CEK NAMA USER DI AWAL (SEBELUM APAPUN)
// ========================================
function checkUserIdentity() {
    const userName = localStorage.getItem('userName');
    const hasVisited = sessionStorage.getItem('hasVisited');
    
    // Jika sudah pernah cek di session ini, lewati
    if (hasVisited === 'true') {
        return true;
    }
    
    // Jika belum ada nama atau nama masih default
    if (!userName || userName === '' || userName === 'Customer' || userName === 'null') {
        sessionStorage.setItem('redirectToProfile', 'true');
        window.location.href = 'profile.html';
        return false;
    }
    
    sessionStorage.setItem('hasVisited', 'true');
    return true;
}

// ========================================
// SPLASH SCREEN
// ========================================
setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('hide');
        setTimeout(() => {
            const mainContent = document.getElementById('mainContent');
            if (mainContent) mainContent.classList.add('visible');
        }, 300);
    }
}, 2000);

// ========================================
// LOAD SLIDER FROM FIREBASE
// ========================================
function loadSlider() {
    database.ref('slider').on('value', (snapshot) => {
        const sliderSection = document.getElementById('sliderSection');
        const swiperWrapper = document.getElementById('swiperWrapper');
        
        if (!snapshot.exists() || snapshot.numChildren() === 0) {
            sliderSection.style.display = 'none';
            return;
        }
        
        sliderSection.style.display = 'block';
        swiperWrapper.innerHTML = '';
        
        snapshot.forEach((child) => {
            const slide = child.val();
            const isVideo = slide.type === 'video' || (slide.url && (slide.url.includes('.mp4') || slide.url.includes('.webm')));
            
            if (isVideo) {
                swiperWrapper.innerHTML += `
                    <div class="swiper-slide">
                        <video autoplay muted loop playsinline>
                            <source src="${slide.url}" type="video/mp4">
                        </video>
                    </div>
                `;
            } else {
                swiperWrapper.innerHTML += `
                    <div class="swiper-slide">
                        <img src="${slide.url}" alt="${slide.title || 'Slider'}" loading="lazy">
                    </div>
                `;
            }
        });
        
        if (swiperInstance) swiperInstance.destroy();
        swiperInstance = new Swiper('.mySwiper', {
            loop: true,
            autoplay: { delay: 4000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            effect: 'slide',
        });
    });
}

// ========================================
// LOAD POPUP SETTINGS
// ========================================
function loadPopupSettings() {
    database.ref('popupSettings').on('value', (snapshot) => {
        const data = snapshot.val();
        const popupModal = document.getElementById('popupModal');
        
        if (!data || data.enabled === false) {
            popupModal.style.display = 'none';
            return;
        }
        
        const popupMedia = document.getElementById('popupMedia');
        const mediaType = data.mediaType || 'icon';
        const mediaValue = data.mediaValue || 'fab fa-whatsapp';
        
        if (mediaType === 'icon') {
            popupMedia.innerHTML = `<i class="${mediaValue}" style="font-size:64px;color:white;"></i>`;
        } else {
            popupMedia.innerHTML = `<img src="${mediaValue}" style="width:100%;height:100%;object-fit:cover;">`;
        }
        
        document.getElementById('popupTitle').innerText = data.title || 'JOIN CHANNEL';
        document.getElementById('popupMessage').innerText = data.message || 'Dapatkan info update produk terbaru dan promo menarik!';
        
        const button = document.getElementById('popupButton');
        button.innerHTML = `<i class="${mediaType === 'icon' ? mediaValue : 'fab fa-whatsapp'}"></i> ${data.buttonText || 'Gabung Sekarang'}`;
        button.href = data.buttonLink || 'https://wa.me/6285794545996';
    });
}

function showPopup() {
    const popup = document.getElementById('popupModal');
    if (popup && popup.style.display !== 'flex') popup.style.display = 'flex';
}

function closePopup() {
    const popup = document.getElementById('popupModal');
    if (popup) popup.style.display = 'none';
    sessionStorage.setItem('popupShown', 'true');
}

function shouldShowPopup() {
    if (sessionStorage.getItem('popupShown') === 'true') return false;
    return true;
}

function initPopup() {
    loadPopupSettings();
    setTimeout(() => { if (shouldShowPopup()) showPopup(); }, 2500);
}

document.getElementById('closePopupBtn').onclick = closePopup;
const popupModal = document.getElementById('popupModal');
if (popupModal) popupModal.onclick = (e) => { if (e.target === popupModal) closePopup(); };

// ========================================
// LOAD PRODUCTS
// ========================================
function loadProducts() {
    database.ref('products/sewa').on('value', (snapshot) => {
        sewaProducts = [];
        snapshot.forEach((child) => {
            const product = child.val();
            product.id = child.key;
            product.type = 'sewa';
            sewaProducts.push(product);
        });
        renderSewaProducts();
    });

    database.ref('products/script').on('value', (snapshot) => {
        scriptProducts = [];
        snapshot.forEach((child) => {
            const product = child.val();
            product.id = child.key;
            product.type = 'script';
            scriptProducts.push(product);
        });
        renderScriptProducts();
    });
    updateCartCount();
}

function renderRatingStars(rating, reviewCount) {
    const numRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const halfStar = (numRating % 1) >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
    if (halfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star empty"></i>';
    return `<div class="product-rating"><div class="stars">${starsHtml}</div><span class="rating-count">(${reviewCount || 0})</span></div>`;
}

function renderSewaProducts() {
    const container = document.getElementById('sewaProductsGrid');
    if (!container) return;
    if (sewaProducts.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Belum ada produk sewa</p></div>';
        return;
    }
    container.innerHTML = sewaProducts.map(product => `
        <div class="product-card">
            ${product.stock > 0 ? '<div class="product-badge">SEWA</div>' : '<div class="product-badge" style="background:#888">HABIS</div>'}
            <img class="product-thumbnail" src="${product.thumbnail || 'https://placehold.co/300x200/1a1d24/4facfe?text=Sewa+Bot'}" onerror="this.src='https://placehold.co/300x200/1a1d24/4facfe?text=Sewa+Bot'">
            <div class="product-info">
                <div class="product-title">${escapeHtml(product.name)}</div>
                <div class="product-category"><i class="fas fa-calendar-alt"></i> Sewa ${product.duration || '7 Hari'}</div>
                <div class="product-price">Rp ${formatNumber(product.price || 0)}</div>
                ${renderRatingStars(product.rating, product.reviewCount)}
                <div class="product-stock">${getStockBadge(product.stock || 0)}</div>
                <button class="add-to-cart" ${(product.stock || 0) <= 0 ? 'disabled' : ''} onclick="addToCart('${product.id}', 'sewa')">
                    <i class="fas ${(product.stock || 0) <= 0 ? 'fa-ban' : 'fa-cart-plus'}"></i>
                    ${(product.stock || 0) <= 0 ? 'Stok Habis' : 'Sewa Sekarang'}
                </button>
            </div>
        </div>
    `).join('');
}

function renderScriptProducts() {
    const container = document.getElementById('scriptProductsGrid');
    if (!container) return;
    if (scriptProducts.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Belum ada produk script</p></div>';
        return;
    }
    container.innerHTML = scriptProducts.map(product => `
        <div class="product-card">
            ${product.stock > 0 ? '<div class="product-badge">SCRIPT</div>' : '<div class="product-badge" style="background:#888">HABIS</div>'}
            <img class="product-thumbnail" src="${product.thumbnail || 'https://placehold.co/300x200/1a1d24/4facfe?text=Script'}" onerror="this.src='https://placehold.co/300x200/1a1d24/4facfe?text=Script'">
            <div class="product-info">
                <div class="product-title">${escapeHtml(product.name)}</div>
                <div class="product-category"><i class="fas fa-code"></i> ${product.category || 'Script'}</div>
                <div class="product-price">Rp ${formatNumber(product.price || 0)}</div>
                ${renderRatingStars(product.rating, product.reviewCount)}
                <div class="product-stock">${getStockBadge(product.stock || 0)}</div>
                <button class="add-to-cart" ${(product.stock || 0) <= 0 ? 'disabled' : ''} onclick="addToCart('${product.id}', 'script')">
                    <i class="fas ${(product.stock || 0) <= 0 ? 'fa-ban' : 'fa-cart-plus'}"></i>
                    ${(product.stock || 0) <= 0 ? 'Stok Habis' : 'Beli Sekarang'}
                </button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getStockBadge(stock) {
    if (stock <= 0) return '<span class="stock-badge stock-out"><i class="fas fa-times-circle"></i> Stok Habis</span>';
    if (stock < 5) return '<span class="stock-badge stock-low"><i class="fas fa-exclamation-triangle"></i> Sisa ' + stock + '</span>';
    return '<span class="stock-badge stock-available"><i class="fas fa-check-circle"></i> Tersedia</span>';
}

function showNotification(msg, type) {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

// ========================================
// CART FUNCTIONS - TANPA NOTIFIKASI WHATSAPP
// ========================================
function addToCart(productId, productType) {
    let product = productType === 'sewa' ? sewaProducts.find(p => p.id === productId) : scriptProducts.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    const existing = cart.find(item => item.id === productId);
    
    if (existing) {
        if (existing.quantity < product.stock) {
            existing.quantity++;
            showNotification('Produk ditambahkan', 'success');
            // HANYA KIRIM KE TELEGRAM, TIDAK KE WHATSAPP
            if (typeof notifyAddToCartTelegram !== 'undefined') {
                const userName = localStorage.getItem('userName') || 'Guest';
                notifyAddToCartTelegram(product.name, product.price, existing.quantity, userName);
            }
        } else {
            showNotification('Stok tidak mencukupi!', 'error');
            return;
        }
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, thumbnail: product.thumbnail, quantity: 1, type: productType, duration: product.duration || null });
        showNotification('Produk ditambahkan ke keranjang', 'success');
        // HANYA KIRIM KE TELEGRAM, TIDAK KE WHATSAPP
        if (typeof notifyAddToCartTelegram !== 'undefined') {
            const userName = localStorage.getItem('userName') || 'Guest';
            notifyAddToCartTelegram(product.name, product.price, 1, userName);
        }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = total;
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>Keranjang belanja kosong</p><small>Yuk, belanja produk menarik di Rayy Store!</small></div>`;
        const cartTotal = document.getElementById('cartTotal');
        if (cartTotal) cartTotal.innerHTML = 'Rp 0';
        return;
    }
    let total = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <img class="cart-item-img" src="${item.thumbnail || 'https://placehold.co/65x65/1a1d24/4facfe?text=No'}" onerror="this.src='https://placehold.co/65x65/1a1d24/4facfe?text=No'">
                <div class="cart-item-info">
                    <div class="cart-item-title">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">Rp ${formatNumber(item.price)}</div>
                    <div class="cart-item-qty">
                        <button onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)">+</button>
                        <button onclick="removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="cart-item-subtotal">Rp ${formatNumber(itemTotal)}</div>
            </div>
        `;
    }).join('');
    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) cartTotal.innerHTML = `Rp ${formatNumber(total)}`;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        const newQty = item.quantity + (change || -1);
        if (newQty <= 0) cart = cart.filter(i => i.id !== id);
        else item.quantity = newQty;
        renderCartItems();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    renderCartItems();
    showNotification('Item dihapus', 'success');
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
    if (sidebar && sidebar.classList.contains('open')) renderCartItems();
}

function checkout() {
    if (cart.length === 0) {
        showNotification('Keranjang kosong!', 'error');
        return;
    }
    const firstItem = cart[0];
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', total);
    window.location.href = firstItem.type === 'sewa' ? 'data-sewa.html' : 'data-script.html';
}

function loadUserProfile() {
    const savedName = localStorage.getItem('userName');
    if (savedName && savedName !== 'Customer' && savedName !== 'null') {
        currentUser.name = savedName;
    }
}

// ========================================
// MUSIC PLAYER
// ========================================
let musicPlayer = { audio: null, currentTrack: null, isPlaying: false, volume: 70, playHistory: [], updateInterval: null };

function loadMusicHistory() {
    const saved = localStorage.getItem('rayy_music_history');
    if (saved) {
        try {
            musicPlayer.playHistory = JSON.parse(saved);
            if (musicPlayer.playHistory.length > 0) {
                renderMusicHistory();
                document.getElementById('musicHistorySection').style.display = 'block';
            }
        } catch(e) {}
    }
}

function saveMusicHistory() { localStorage.setItem('rayy_music_history', JSON.stringify(musicPlayer.playHistory)); }

function addToMusicHistory(track) {
    if (!track || !track.title) return;
    musicPlayer.playHistory = musicPlayer.playHistory.filter(t => t.url !== track.url);
    musicPlayer.playHistory.unshift({ title: track.title, url: track.url, thumbnail: track.thumbnail, artist: track.artist, timestamp: new Date().toISOString() });
    if (musicPlayer.playHistory.length > 20) musicPlayer.playHistory = musicPlayer.playHistory.slice(0, 20);
    saveMusicHistory();
    renderMusicHistory();
    document.getElementById('musicHistorySection').style.display = 'block';
}

function renderMusicHistory() {
    const historyList = document.getElementById('musicHistoryList');
    if (!historyList) return;
    if (musicPlayer.playHistory.length === 0) {
        document.getElementById('musicHistorySection').style.display = 'none';
        return;
    }
    historyList.innerHTML = musicPlayer.playHistory.map((track, index) => `
        <div class="history-item" onclick="window.playFromHistory(${index})">
            <img src="${track.thumbnail || 'https://via.placeholder.com/35x35?text=🎵'}" onerror="this.src='https://via.placeholder.com/35x35?text=🎵'">
            <div class="history-item-info">
                <div class="history-item-title">${escapeHtml(track.title.substring(0, 40))}${track.title.length > 40 ? '...' : ''}</div>
                <div class="history-item-artist">${escapeHtml(track.artist || 'Unknown Artist')}</div>
            </div>
            <i class="fas fa-play-circle" style="color:#4facfe;opacity:0.6;"></i>
        </div>
    `).join('');
}

window.playFromHistory = function(index) {
    const track = musicPlayer.playHistory[index];
    if (track && track.url) playMusic(track.title, track.url, track.thumbnail, track.artist);
};

function clearMusicHistory() {
    if (confirm('Hapus semua riwayat putar?')) {
        musicPlayer.playHistory = [];
        saveMusicHistory();
        renderMusicHistory();
        document.getElementById('musicHistorySection').style.display = 'none';
        showNotification('Riwayat musik dihapus', 'success');
    }
}

async function searchMusic(query) {
    const resultsList = document.getElementById('musicResultsList');
    if (!query.trim()) {
        resultsList.innerHTML = '<div class="empty-message"><i class="fas fa-exclamation-triangle"></i> Masukkan judul lagu</div>';
        return;
    }
    resultsList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-pulse"></i> Mencari lagu...</div>';
    try {
        const response = await fetch(`https://api-faa.my.id/faa/ytplay?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        if (data.status && data.result) {
            const r = data.result;
            resultsList.innerHTML = `<div class="result-item" data-title="${escapeHtml(r.title)}" data-url="${r.mp3}" data-thumb="${r.thumbnail}" data-artist="${escapeHtml(r.author)}">
                <img src="${r.thumbnail}" onerror="this.src='https://via.placeholder.com/45x45?text=🎵'">
                <div class="result-info">
                    <div class="result-title">${escapeHtml(r.title)}</div>
                    <div class="result-artist">${escapeHtml(r.author)}</div>
                    <div class="result-duration">⏱️ ${r.duration_timestamp || '0:00'}</div>
                </div>
            </div>`;
            document.querySelector('#musicResultsList .result-item').addEventListener('click', function() {
                playMusic(this.dataset.title, this.dataset.url, this.dataset.thumb, this.dataset.artist);
            });
        } else {
            resultsList.innerHTML = '<div class="empty-message"><i class="fas fa-music-slash"></i> Lagu tidak ditemukan</div>';
        }
    } catch (error) {
        resultsList.innerHTML = '<div class="empty-message"><i class="fas fa-wifi"></i> Error koneksi, coba lagi</div>';
    }
}

function playMusic(title, url, thumbnail, artist) {
    if (!url || url === 'undefined') { showNotification('❌ URL lagu tidak valid', 'error'); return; }
    const audio = document.getElementById('globalAudio');
    if (!audio) return;
    musicPlayer.currentTrack = { title, url, thumbnail, artist };
    musicPlayer.audio = audio;
    audio.src = url;
    audio.load();
    audio.play().catch(e => console.log('Play error:', e));
    musicPlayer.isPlaying = true;
    document.getElementById('musicNowPlaying').style.display = 'flex';
    document.getElementById('musicThumb').src = thumbnail || 'https://via.placeholder.com/60x60?text=🎵';
    document.getElementById('musicTitle').innerText = title || 'Unknown Title';
    document.getElementById('musicArtist').innerText = artist || 'Unknown Artist';
    document.getElementById('musicPlayPauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
    addToMusicHistory({ title, url, thumbnail, artist });
    showNotification(`🎵 Memutar: ${title}`, 'success');
    startProgressUpdate();
}

function stopMusic() {
    if (musicPlayer.audio) {
        musicPlayer.audio.pause();
        musicPlayer.audio.currentTime = 0;
        musicPlayer.isPlaying = false;
        musicPlayer.currentTrack = null;
        document.getElementById('musicNowPlaying').style.display = 'none';
        document.getElementById('musicPlayPauseBtn').innerHTML = '<i class="fas fa-play"></i>';
        document.getElementById('musicProgressFilled').style.width = '0%';
        document.getElementById('musicCurrentTime').innerText = '0:00';
        if (musicPlayer.updateInterval) clearInterval(musicPlayer.updateInterval);
        showNotification('⏹️ Musik dihentikan', 'success');
    }
}

function togglePlayPause() {
    if (!musicPlayer.audio || !musicPlayer.currentTrack) { showNotification('Pilih lagu terlebih dahulu', 'error'); return; }
    if (musicPlayer.isPlaying) {
        musicPlayer.audio.pause();
        musicPlayer.isPlaying = false;
        document.getElementById('musicPlayPauseBtn').innerHTML = '<i class="fas fa-play"></i>';
    } else {
        musicPlayer.audio.play().catch(e => console.log('Resume error:', e));
        musicPlayer.isPlaying = true;
        document.getElementById('musicPlayPauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
        startProgressUpdate();
    }
}

function startProgressUpdate() {
    if (musicPlayer.updateInterval) clearInterval(musicPlayer.updateInterval);
    musicPlayer.updateInterval = setInterval(() => {
        if (musicPlayer.audio && musicPlayer.audio.duration && musicPlayer.isPlaying) {
            const current = musicPlayer.audio.currentTime;
            const duration = musicPlayer.audio.duration;
            document.getElementById('musicProgressFilled').style.width = (current / duration) * 100 + '%';
            document.getElementById('musicCurrentTime').innerText = formatMusicTime(current);
            document.getElementById('musicDuration').innerText = formatMusicTime(duration);
        }
    }, 500);
}

function formatMusicTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function seekMusic(e) {
    if (!musicPlayer.audio || !musicPlayer.audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    musicPlayer.audio.currentTime = percent * musicPlayer.audio.duration;
}

function setMusicVolume(value) {
    musicPlayer.volume = value;
    if (musicPlayer.audio) musicPlayer.audio.volume = value / 100;
    document.getElementById('musicVolumeSlider').value = value;
    localStorage.setItem('rayy_music_volume', value);
}

function openMusicModal() {
    document.getElementById('musicModal').style.display = 'flex';
    loadMusicHistory();
}
function closeMusicModal() { document.getElementById('musicModal').style.display = 'none'; }

function initMusicEventListeners() {
    document.getElementById('musicBtn').onclick = (e) => { e.preventDefault(); openMusicModal(); };
    document.getElementById('closeMusicModal').onclick = closeMusicModal;
    document.getElementById('musicPlayPauseBtn').onclick = togglePlayPause;
    document.getElementById('musicStopBtn').onclick = stopMusic;
    document.getElementById('musicSearchBtn').onclick = () => searchMusic(document.getElementById('musicSearchInput').value);
    document.getElementById('musicSearchInput').onkeypress = (e) => { if (e.key === 'Enter') searchMusic(e.target.value); };
    document.getElementById('musicVolumeSlider').oninput = (e) => setMusicVolume(parseInt(e.target.value));
    document.getElementById('musicVolDown').onclick = () => setMusicVolume(Math.max(0, musicPlayer.volume - 10));
    document.getElementById('musicVolUp').onclick = () => setMusicVolume(Math.min(100, musicPlayer.volume + 10));
    document.getElementById('musicProgressBar').onclick = seekMusic;
    document.getElementById('clearMusicHistory').onclick = clearMusicHistory;
    document.getElementById('musicModal').onclick = (e) => { if (e.target === document.getElementById('musicModal')) closeMusicModal(); };
    const savedVol = localStorage.getItem('rayy_music_volume');
    if (savedVol) setMusicVolume(parseInt(savedVol));
    else setMusicVolume(70);
}

// ========================================
// INITIALIZE - CEK NAMA DULU
// ========================================
// CEK APAKAH USER SUDAH PUNYA NAMA
const userHasName = localStorage.getItem('userName');
const isValidName = userHasName && userHasName !== '' && userHasName !== 'Customer' && userHasName !== 'null';

if (!isValidName) {
    // Redirect ke profile.html untuk isi nama
    window.location.href = 'profile.html';
} else {
    // Load semua konten
    loadUserProfile();
    loadSlider();
    loadProducts();
    initMusicEventListeners();
    initPopup();
}

window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.playMusic = playMusic;
window.stopMusic = stopMusic;
window.togglePlayPause = togglePlayPause;
window.playFromHistory = playFromHistory;