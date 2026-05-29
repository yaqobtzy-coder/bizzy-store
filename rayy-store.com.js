// ========================================
// RAYY STORE - MAIN JAVASCRIPT
// ========================================

let sewaProducts = [];
let scriptProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let swiperInstance = null;
let activeVoucher = null;
let voucherDiscount = 0;
let voucherUsed = false;

// Music Player
let musicPlayer = { 
    audio: null, 
    currentTrack: null, 
    isPlaying: false, 
    volume: 70, 
    playHistory: [], 
    updateInterval: null 
};

// ========================================
// CEK NAMA USER (WAJIB ISI NAMA DULU)
// ========================================
function requireName() {
    const userName = localStorage.getItem('userName');
    const hasSetName = localStorage.getItem('hasSetName') === 'true';
    
    if (!userName || userName === '' || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return false;
    }
    
    if (!hasSetName) {
        localStorage.setItem('isNameSet', 'true');
    }
    
    return true;
}

function checkUserIdentity() {
    const userName = localStorage.getItem('userName');
    if (!userName || userName === '' || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        window.location.href = 'profile.html';
        return false;
    }
    return true;
}

// ========================================
// SIDEBAR FUNCTIONS
// ========================================
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
}

// ========================================
// LOAD MARQUEE
// ========================================
function loadMarqueeText() {
    database.ref('settings/marquee').on('value', (snapshot) => {
        const data = snapshot.val();
        const marqueeSection = document.getElementById('marqueeSection');
        const marqueeText = document.getElementById('marqueeText');
        
        if (data && data.enabled && data.text) {
            marqueeSection.style.display = 'block';
            marqueeText.innerHTML = `<i class="fas fa-fire"></i> ${data.text}`;
        } else {
            marqueeSection.style.display = 'none';
        }
    });
}

// ========================================
// LOAD SLIDER
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
                swiperWrapper.innerHTML += `<div class="swiper-slide"><video autoplay muted loop playsinline><source src="${slide.url}" type="video/mp4"></video></div>`;
            } else {
                swiperWrapper.innerHTML += `<div class="swiper-slide"><img src="${slide.url}" alt="${slide.title || 'Slider'}" loading="lazy"></div>`;
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
// LOAD POPUP
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
            popupMedia.innerHTML = `<i class="${mediaValue}"></i>`;
        } else {
            popupMedia.innerHTML = `<img src="${mediaValue}">`;
        }
        
        document.getElementById('popupTitle').innerText = data.title || 'JOIN CHANNEL';
        document.getElementById('popupMessage').innerText = data.message || 'Dapatkan info update produk terbaru dan promo menarik!';
        
        const button = document.getElementById('popupButton');
        button.innerHTML = `<i class="${mediaType === 'icon' ? mediaValue : 'fab fa-whatsapp'}"></i> ${data.buttonText || 'Gabung Sekarang'}`;
        button.href = data.buttonLink || 'https://wa.me/6285794545996';
        
        loadVoucherForPopup();
    });
}

function loadVoucherForPopup() {
    database.ref('vouchers').orderByChild('showInPopup').equalTo(true).once('value', (snapshot) => {
        const voucherList = [];
        snapshot.forEach(child => {
            voucherList.push({ id: child.key, ...child.val() });
        });
        
        if (voucherList.length > 0) {
            const randomVoucher = voucherList[Math.floor(Math.random() * voucherList.length)];
            displayVoucherInPopup(randomVoucher);
        }
    });
}

function displayVoucherInPopup(voucher) {
    const voucherDiv = document.getElementById('popupVoucher');
    const voucherCodeDisplay = document.getElementById('voucherCodeDisplay');
    
    if (voucherDiv && voucherCodeDisplay) {
        let discountText = '';
        if (voucher.type === 'percentage') {
            discountText = `${voucher.value}% OFF`;
        } else {
            discountText = `Rp ${formatNumber(voucher.value)} OFF`;
        }
        
        voucherCodeDisplay.innerHTML = `${voucher.code}<br><small style="font-size:11px;color:#b45309;">${discountText}</small>`;
        voucherDiv.style.display = 'block';
        sessionStorage.setItem('popupVoucher', JSON.stringify(voucher));
    }
}

function copyVoucherCode() {
    const voucherCode = document.getElementById('voucherCodeDisplay')?.innerText.split('\n')[0];
    if (voucherCode) {
        navigator.clipboard.writeText(voucherCode);
        showNotification('✅ Kode voucher disalin!', 'success');
    }
}

function showPopup() {
    const popup = document.getElementById('popupModal');
    if (popup && popup.style.display !== 'flex') {
        popup.style.display = 'flex';
    }
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
const popupModalElem = document.getElementById('popupModal');
if (popupModalElem) {
    popupModalElem.onclick = (e) => { if (e.target === popupModalElem) closePopup(); };
}

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
    loadSavedVoucher();
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
                ${product.allowVoucher !== false ? '<div class="voucher-badge"><i class="fas fa-ticket-alt"></i> Bisa Pakai Voucher</div>' : '<div class="voucher-badge disabled"><i class="fas fa-ban"></i> Tidak Bisa Voucher</div>'}
                <button class="add-to-cart" ${(product.stock || 0) <= 0 ? 'disabled' : ''} onclick="addToCart('${product.id}', 'sewa')">${(product.stock || 0) <= 0 ? 'Stok Habis' : 'Sewa Sekarang'}</button>
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
                ${product.allowVoucher !== false ? '<div class="voucher-badge"><i class="fas fa-ticket-alt"></i> Bisa Pakai Voucher</div>' : '<div class="voucher-badge disabled"><i class="fas fa-ban"></i> Tidak Bisa Voucher</div>'}
                <button class="add-to-cart" ${(product.stock || 0) <= 0 ? 'disabled' : ''} onclick="addToCart('${product.id}', 'script')">${(product.stock || 0) <= 0 ? 'Stok Habis' : 'Beli Sekarang'}</button>
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
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getStockBadge(stock) {
    if (stock <= 0) return '<span class="stock-badge stock-out">Stok Habis</span>';
    if (stock < 5) return '<span class="stock-badge stock-low">Sisa ' + stock + '</span>';
    return '<span class="stock-badge stock-available">Tersedia</span>';
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
// CART FUNCTIONS (dengan cek nama)
// ========================================
function addToCart(productId, productType) {
    if (!requireName()) return;
    
    let product = productType === 'sewa' ? sewaProducts.find(p => p.id === productId) : scriptProducts.find(p => p.id === productId);
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
            duration: product.duration || null,
            allowVoucher: product.allowVoucher !== false
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
    const topCartCount = document.getElementById('topCartCount');
    const sidebarCartCount = document.getElementById('sidebarCartCount');
    if (cartCount) cartCount.textContent = total;
    if (topCartCount) topCartCount.textContent = total;
    if (sidebarCartCount) sidebarCartCount.textContent = total;
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>Keranjang belanja kosong</p></div>`;
        document.getElementById('subtotalAmount').innerHTML = 'Rp 0';
        document.getElementById('cartTotal').innerHTML = 'Rp 0';
        return;
    }
    
    let subtotal = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
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
    
    let finalTotal = subtotal;
    let discountAmount = 0;
    
    if (activeVoucher && voucherDiscount > 0 && !voucherUsed) {
        discountAmount = Math.min(voucherDiscount, subtotal);
        finalTotal = subtotal - discountAmount;
        if (finalTotal <= 0) finalTotal = 0;
        
        document.getElementById('voucherInfo').style.display = 'block';
        document.getElementById('voucherAppliedCode').innerHTML = `${activeVoucher.code}`;
        document.getElementById('voucherAppliedDiscount').innerHTML = `- Rp ${formatNumber(discountAmount)}`;
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('discountAmount').innerHTML = `- Rp ${formatNumber(discountAmount)}`;
    } else {
        document.getElementById('voucherInfo').style.display = 'none';
        document.getElementById('discountRow').style.display = 'none';
    }
    
    document.getElementById('subtotalAmount').innerHTML = `Rp ${formatNumber(subtotal)}`;
    
    if (finalTotal <= 0) {
        document.getElementById('cartTotal').innerHTML = '<span style="color: #28a745; font-weight: 700;">🎉 GRATIS!</span>';
    } else {
        document.getElementById('cartTotal').innerHTML = `Rp ${formatNumber(finalTotal)}`;
    }
    
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
    if (!requireName()) return;
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) sidebar.classList.toggle('open');
    if (sidebar && sidebar.classList.contains('open')) renderCartItems();
}

document.getElementById('overlay')?.addEventListener('click', () => {
    closeSidebar();
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) cartSidebar.classList.remove('open');
});

function checkout() {
    if (!requireName()) return;
    
    if (cart.length === 0) {
        showNotification('Keranjang kosong!', 'error');
        return;
    }
    
    const firstItem = cart[0];
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let isGratis = false;
    
    if (activeVoucher && voucherDiscount > 0 && !voucherUsed) {
        total = total - Math.min(voucherDiscount, total);
        if (total <= 0) isGratis = true;
        voucherUsed = true;
    }
    
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', total);
    
    if (isGratis) showNotification('🎉 Selamat! Pesanan Anda GRATIS!', 'success');
    
    window.location.href = firstItem.type === 'sewa' ? 'data-sewa.html' : 'data-script.html';
}

// ========================================
// VOUCHER FUNCTIONS
// ========================================
function applyVoucherFromCart() {
    const code = document.getElementById('voucherCodeCart').value.trim().toUpperCase();
    if (!code) {
        showVoucherMessageCart('Masukkan kode voucher!', 'error');
        return;
    }
    
    database.ref('vouchers').orderByChild('code').equalTo(code).once('value', (snapshot) => {
        if (snapshot.exists()) {
            let voucher = null;
            snapshot.forEach(child => {
                voucher = { id: child.key, ...child.val() };
            });
            
            if (voucher) {
                const now = new Date();
                const expired = new Date(voucher.expiredAt);
                
                if (voucher.used >= voucher.usageLimit) {
                    showVoucherMessageCart('Voucher sudah mencapai batas penggunaan!', 'error');
                    return;
                }
                if (expired < now) {
                    showVoucherMessageCart('Voucher sudah kadaluarsa!', 'error');
                    return;
                }
                
                const hasNonVoucherProduct = cart.some(item => item.allowVoucher === false);
                if (hasNonVoucherProduct) {
                    showVoucherMessageCart('Ada produk yang tidak mendukung voucher!', 'error');
                    return;
                }
                
                activeVoucher = voucher;
                const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                if (voucher.type === 'percentage') {
                    voucherDiscount = (subtotal * voucher.value) / 100;
                } else {
                    voucherDiscount = Math.min(voucher.value, subtotal);
                }
                
                showVoucherMessageCart(`✅ Voucher ${voucher.code} berhasil dipakai!`, 'success');
                document.getElementById('voucherCodeCart').value = '';
                renderCartItems();
            }
        } else {
            showVoucherMessageCart('Kode voucher tidak valid!', 'error');
        }
    });
}

function removeVoucherFromCart() {
    activeVoucher = null;
    voucherDiscount = 0;
    localStorage.removeItem('activeVoucher');
    showVoucherMessageCart('Voucher dihapus', 'success');
    renderCartItems();
}

function showVoucherMessageCart(msg, type) {
    const msgDiv = document.getElementById('voucherMessageCart');
    msgDiv.textContent = msg;
    msgDiv.className = `voucher-message-cart ${type}`;
    setTimeout(() => {
        msgDiv.textContent = '';
        msgDiv.className = 'voucher-message-cart';
    }, 3000);
}

function loadSavedVoucher() {
    const saved = localStorage.getItem('activeVoucher');
    if (saved) {
        try {
            const voucher = JSON.parse(saved);
            activeVoucher = { code: voucher.code, id: voucher.id, type: voucher.type, value: voucher.value };
            voucherDiscount = voucher.discount;
        } catch(e) {}
    }
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
// MUSIC PLAYER
// ========================================
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
        <div class="history-item" onclick="playFromHistory(${index})">
            <img src="${track.thumbnail || 'https://via.placeholder.com/35x35?text=🎵'}" onerror="this.src='https://via.placeholder.com/35x35?text=🎵'">
            <div class="history-item-info">
                <div class="history-item-title">${escapeHtml(track.title.substring(0, 40))}${track.title.length > 40 ? '...' : ''}</div>
                <div class="history-item-artist">${escapeHtml(track.artist || 'Unknown Artist')}</div>
            </div>
            <i class="fas fa-play-circle" style="color:#4facfe;opacity:0.6;"></i>
        </div>
    `).join('');
}

function playFromHistory(index) {
    const track = musicPlayer.playHistory[index];
    if (track && track.url) playMusic(track.title, track.url, track.thumbnail, track.artist);
}

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
        resultsList.innerHTML = '<div class="empty-message">Masukkan judul lagu</div>';
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
                    <div class="result-duration">${r.duration_timestamp || '0:00'}</div>
                </div>
            </div>`;
            document.querySelector('#musicResultsList .result-item').addEventListener('click', function() {
                playMusic(this.dataset.title, this.dataset.url, this.dataset.thumb, this.dataset.artist);
            });
        } else {
            resultsList.innerHTML = '<div class="empty-message">Lagu tidak ditemukan</div>';
        }
    } catch (error) {
        resultsList.innerHTML = '<div class="empty-message">Error koneksi, coba lagi</div>';
    }
}

function playMusic(title, url, thumbnail, artist) {
    if (!url || url === 'undefined') { 
        showNotification('❌ URL lagu tidak valid', 'error'); 
        return; 
    }
    
    const audio = document.getElementById('globalAudio');
    if (!audio) return;
    
    if (musicPlayer.updateInterval) clearInterval(musicPlayer.updateInterval);
    
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
    
    updateFloatingPlayer({ title, thumbnail, artist });
    
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
        
        updateFloatingPlayer(null);
        
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
        document.getElementById('floatingPlayPause').innerHTML = '<i class="fas fa-play"></i>';
    } else {
        musicPlayer.audio.play().catch(e => console.log('Resume error:', e));
        musicPlayer.isPlaying = true;
        document.getElementById('musicPlayPauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
        document.getElementById('floatingPlayPause').innerHTML = '<i class="fas fa-pause"></i>';
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

function closeMusicModal() {
    document.getElementById('musicModal').style.display = 'none';
}

function initMusicEventListeners() {
    const musicBtn = document.getElementById('musicBtn');
    const sidebarMusicBtn = document.getElementById('sidebarMusicBtn');
    
    if (musicBtn) {
        musicBtn.onclick = (e) => { 
            e.preventDefault(); 
            openMusicModal(); 
        };
    }
    if (sidebarMusicBtn) {
        sidebarMusicBtn.onclick = (e) => { 
            e.preventDefault(); 
            openMusicModal(); 
        };
    }
    
    document.getElementById('closeMusicModal').onclick = closeMusicModal;
    document.getElementById('musicPlayPauseBtn').onclick = togglePlayPause;
    document.getElementById('musicStopBtn').onclick = stopMusic;
    document.getElementById('musicSearchBtn').onclick = () => searchMusic(document.getElementById('musicSearchInput').value);
    document.getElementById('musicSearchInput').onkeypress = (e) => { 
        if (e.key === 'Enter') searchMusic(e.target.value); 
    };
    document.getElementById('musicVolumeSlider').oninput = (e) => setMusicVolume(parseInt(e.target.value));
    document.getElementById('musicVolDown').onclick = () => setMusicVolume(Math.max(0, musicPlayer.volume - 10));
    document.getElementById('musicVolUp').onclick = () => setMusicVolume(Math.min(100, musicPlayer.volume + 10));
    document.getElementById('musicProgressBar').onclick = seekMusic;
    document.getElementById('clearMusicHistory').onclick = clearMusicHistory;
    document.getElementById('musicModal').onclick = (e) => { 
        if (e.target === document.getElementById('musicModal')) closeMusicModal(); 
    };
    
    const savedVol = localStorage.getItem('rayy_music_volume');
    if (savedVol) setMusicVolume(parseInt(savedVol));
    else setMusicVolume(70);
}

// Floating Player
let isDragging = false;
let dragStartX, dragStartY;

function initFloatingPlayer() {
    const floatingPlayer = document.getElementById('floatingPlayer');
    const dragHandle = document.getElementById('floatingDrag');
    
    if (!dragHandle) return;
    
    dragHandle.addEventListener('mousedown', startDrag);
    dragHandle.addEventListener('touchstart', startDrag, { passive: false });
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
    
    document.getElementById('floatingPlayPause').onclick = () => togglePlayPause();
    document.getElementById('floatingStop').onclick = () => stopMusic();
    document.getElementById('floatingClose').onclick = () => {
        stopMusic();
        floatingPlayer.style.display = 'none';
    };
}

function startDrag(e) {
    isDragging = true;
    const floatingPlayer = document.getElementById('floatingPlayer');
    const rect = floatingPlayer.getBoundingClientRect();
    
    if (e.type === 'mousedown') {
        dragStartX = e.clientX - rect.left;
        dragStartY = e.clientY - rect.top;
    } else {
        dragStartX = e.touches[0].clientX - rect.left;
        dragStartY = e.touches[0].clientY - rect.top;
    }
    
    floatingPlayer.style.transition = 'none';
    e.preventDefault();
}

function onDrag(e) {
    if (!isDragging) return;
    
    let clientX, clientY;
    if (e.type === 'mousemove') {
        clientX = e.clientX;
        clientY = e.clientY;
    } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }
    
    const floatingPlayer = document.getElementById('floatingPlayer');
    let newX = clientX - dragStartX;
    let newY = clientY - dragStartY;
    const maxX = window.innerWidth - floatingPlayer.offsetWidth - 10;
    const maxY = window.innerHeight - floatingPlayer.offsetHeight - 10;
    
    newX = Math.min(Math.max(newX, 10), maxX);
    newY = Math.min(Math.max(newY, 10), maxY);
    
    floatingPlayer.style.left = newX + 'px';
    floatingPlayer.style.top = newY + 'px';
    floatingPlayer.style.right = 'auto';
    floatingPlayer.style.bottom = 'auto';
    
    e.preventDefault();
}

function stopDrag() {
    isDragging = false;
    const floatingPlayer = document.getElementById('floatingPlayer');
    floatingPlayer.style.transition = '';
}

function updateFloatingPlayer(track) {
    const floatingPlayer = document.getElementById('floatingPlayer');
    if (!track) {
        floatingPlayer.style.display = 'none';
        return;
    }
    
    floatingPlayer.style.display = 'block';
    document.getElementById('floatingThumb').src = track.thumbnail || 'https://via.placeholder.com/40x40?text=🎵';
    document.getElementById('floatingTitle').innerText = track.title || 'Unknown Title';
    document.getElementById('floatingArtist').innerText = track.artist || 'Unknown Artist';
    
    if (musicPlayer.isPlaying) {
        document.getElementById('floatingPlayPause').innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        document.getElementById('floatingPlayPause').innerHTML = '<i class="fas fa-play"></i>';
    }
}

// ========================================
// INITIALIZE
// ========================================
document.getElementById('menuToggle').onclick = toggleSidebar;
document.getElementById('sidebarClose').onclick = closeSidebar;

if (!checkUserIdentity()) {
    // Redirect to profile
} else {
    updateSidebarProfile();
    loadSlider();
    loadMarqueeText();
    loadProducts();
    initMusicEventListeners();
    initPopup();
    initFloatingPlayer();
}

// Global functions
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.playMusic = playMusic;
window.stopMusic = stopMusic;
window.togglePlayPause = togglePlayPause;
window.playFromHistory = playFromHistory;
window.applyVoucherFromCart = applyVoucherFromCart;
window.removeVoucherFromCart = removeVoucherFromCart;
window.copyVoucherCode = copyVoucherCode;
window.closeSidebar = closeSidebar;
window.openSidebar = openSidebar;