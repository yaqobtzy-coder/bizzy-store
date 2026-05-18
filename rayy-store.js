// ========================================
// GLOBAL VARIABLES
// ========================================
let products = [];
let sewaProducts = [];
let scriptProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || { name: '' };

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
// LOAD PRODUCTS FROM FIREBASE
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
    if (stock <= 0) {
        return '<span class="stock-badge stock-out"><i class="fas fa-times-circle"></i> Stok Habis</span>';
    } else if (stock < 5) {
        return '<span class="stock-badge stock-low"><i class="fas fa-exclamation-triangle"></i> Sisa ' + stock + '</span>';
    } else {
        return '<span class="stock-badge stock-available"><i class="fas fa-check-circle"></i> Tersedia</span>';
    }
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
// CART FUNCTIONS
// ========================================
function addToCart(productId, productType) {
    let product;
    if (productType === 'sewa') {
        product = sewaProducts.find(p => p.id === productId);
    } else {
        product = scriptProducts.find(p => p.id === productId);
    }
    if (!product || product.stock <= 0) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        if (existing.quantity < product.stock) {
            existing.quantity++;
            showNotification('Produk ditambahkan', 'success');
        } else {
            showNotification('Stok tidak mencukupi!', 'error');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity: 1,
            type: productType,
            duration: product.duration || null
        });
        showNotification('Produk ditambahkan ke keranjang', 'success');
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
        container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>Keranjang kosong</p></div>';
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
                <img class="cart-item-img" src="${item.thumbnail || 'https://placehold.co/60x60/1a1d24/4facfe?text=No'}" onerror="this.src='https://placehold.co/60x60/1a1d24/4facfe?text=No'">
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
                <div style="color:#00f2fe;font-weight:700">Rp ${formatNumber(itemTotal)}</div>
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
        if (newQty <= 0) {
            cart = cart.filter(i => i.id !== id);
        } else {
            item.quantity = newQty;
        }
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
    if (sidebar && sidebar.classList.contains('open')) {
        renderCartItems();
    }
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
    if (firstItem.type === 'sewa') {
        window.location.href = 'data-sewa.html';
    } else {
        window.location.href = 'data-script.html';
    }
}

function loadUserProfile() {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        currentUser.name = savedName;
    }
}

// ========================================
// MUSIC PLAYER FEATURE
// ========================================
let musicPlayer = {
    audio: null,
    currentTrack: null,
    isPlaying: false,
    volume: 70,
    playHistory: [],
    updateInterval: null
};

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

function saveMusicHistory() {
    localStorage.setItem('rayy_music_history', JSON.stringify(musicPlayer.playHistory));
}

function addToMusicHistory(track) {
    if (!track || !track.title) return;
    musicPlayer.playHistory = musicPlayer.playHistory.filter(t => t.url !== track.url);
    musicPlayer.playHistory.unshift({
        title: track.title,
        url: track.url,
        thumbnail: track.thumbnail,
        artist: track.artist,
        timestamp: new Date().toISOString()
    });
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
            <i class="fas fa-play-circle" style="color: #4facfe; opacity: 0.6;"></i>
        </div>
    `).join('');
}

window.playFromHistory = function(index) {
    const track = musicPlayer.playHistory[index];
    if (track && track.url) {
        playMusic(track.title, track.url, track.thumbnail, track.artist);
    }
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
            const durationFormatted = r.duration_timestamp || '0:00';
            resultsList.innerHTML = `
                <div class="result-item" data-title="${escapeHtml(r.title)}" data-url="${r.mp3}" data-thumb="${r.thumbnail}" data-artist="${escapeHtml(r.author)}">
                    <img src="${r.thumbnail}" onerror="this.src='https://via.placeholder.com/45x45?text=🎵'">
                    <div class="result-info">
                        <div class="result-title">${escapeHtml(r.title)}</div>
                        <div class="result-artist">${escapeHtml(r.author)}</div>
                        <div class="result-duration">⏱️ ${durationFormatted}</div>
                    </div>
                </div>
            `;
            const resultItem = document.querySelector('#musicResultsList .result-item');
            if (resultItem) {
                resultItem.addEventListener('click', function() {
                    playMusic(this.getAttribute('data-title'), this.getAttribute('data-url'), this.getAttribute('data-thumb'), this.getAttribute('data-artist'));
                });
            }
        } else {
            resultsList.innerHTML = '<div class="empty-message"><i class="fas fa-music-slash"></i> Lagu tidak ditemukan</div>';
        }
    } catch (error) {
        resultsList.innerHTML = '<div class="empty-message"><i class="fas fa-wifi"></i> Error koneksi, coba lagi</div>';
    }
}

function playMusic(title, url, thumbnail, artist) {
    if (!url || url === 'undefined') {
        showNotification('❌ URL lagu tidak valid', 'error');
        return;
    }
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
    if (!musicPlayer.audio || !musicPlayer.currentTrack) {
        showNotification('Pilih lagu terlebih dahulu', 'error');
        return;
    }
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
            const percent = (current / duration) * 100;
            document.getElementById('musicProgressFilled').style.width = percent + '%';
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
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
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
    const modal = document.getElementById('musicModal');
    if (modal) modal.style.display = 'flex';
    loadMusicHistory();
}

function closeMusicModal() {
    const modal = document.getElementById('musicModal');
    if (modal) modal.style.display = 'none';
}

function initMusicEventListeners() {
    const musicBtn = document.getElementById('musicBtn');
    if (musicBtn) musicBtn.onclick = (e) => { e.preventDefault(); openMusicModal(); };
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
    const modal = document.getElementById('musicModal');
    if (modal) modal.onclick = (e) => { if (e.target === modal) closeMusicModal(); };
    const savedVol = localStorage.getItem('rayy_music_volume');
    if (savedVol) setMusicVolume(parseInt(savedVol));
    else setMusicVolume(70);
}

// ========================================
// POPUP MODAL FEATURE
// ========================================
function loadPopupSettings() {
    database.ref('popupSettings').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const iconElement = document.getElementById('popupIcon');
            const iconClass = data.iconClass || 'fab fa-whatsapp';
            iconElement.innerHTML = `<i class="${iconClass}"></i>`;
            document.getElementById('popupTitle').innerText = data.title || 'JOIN CHANNEL';
            document.getElementById('popupMessage').innerText = data.message || 'Dapatkan info update produk terbaru dan promo menarik!';
            const button = document.getElementById('popupButton');
            button.innerHTML = `<i class="${iconClass}"></i> ${data.buttonText || 'Gabung Sekarang'}`;
            button.href = data.buttonLink || 'https://wa.me/6285794545996';
        }
    });
}

function showPopup() {
    const popup = document.getElementById('popupModal');
    if (popup) popup.style.display = 'flex';
}

function closePopup() {
    const popup = document.getElementById('popupModal');
    if (popup) popup.style.display = 'none';
    sessionStorage.setItem('popupShown', 'true');
}

function shouldShowPopup() {
    if (sessionStorage.getItem('popupShown') === 'true') return false;
    const popupClosedPermanently = localStorage.getItem('popupClosedPermanently');
    if (popupClosedPermanently === 'true') return false;
    return true;
}

function initPopup() {
    loadPopupSettings();
    setTimeout(() => {
        if (shouldShowPopup()) showPopup();
    }, 2500);
}

document.getElementById('closePopupBtn').onclick = closePopup;
const popupModal = document.getElementById('popupModal');
if (popupModal) popupModal.onclick = (e) => { if (e.target === popupModal) closePopup(); };

// ========================================
// INITIALIZE
// ========================================
loadUserProfile();
loadProducts();
initMusicEventListeners();
initPopup();

window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.playMusic = playMusic;
window.stopMusic = stopMusic;
window.togglePlayPause = togglePlayPause;
window.playFromHistory = playFromHistory;