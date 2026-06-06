// ========================================
// RAYY STORE - MAIN JAVASCRIPT (FULL UPDATE)
// ========================================

let sewaProducts = [];
let scriptProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let swiperInstance = null;
let activeVoucher = null;
let voucherDiscount = 0;
let voucherUsed = false;
let usedVoucherIds = JSON.parse(localStorage.getItem('usedVouchers')) || [];

// Music Player
let musicPlayer = { 
    audio: null, 
    currentTrack: null, 
    isPlaying: false, 
    volume: 70, 
    playHistory: [], 
    updateInterval: null 
};

// ============ NOTIFIKASI KE TELEGRAM VIA FIREBASE ============
async function sendAddToCartNotification(productName, price, quantity, userName, userPhone) {
    try {
        await database.ref('cart_notifications').push({
            type: 'add_to_cart',
            data: {
                userName: userName,
                userPhone: userPhone,
                productName: productName,
                price: price,
                quantity: quantity,
                timestamp: Date.now()
            },
            timestamp: Date.now()
        });
        
        // Kirim notifikasi langsung ke Telegram
        if (typeof sendTelegramNotification !== 'undefined') {
            const messageTelegram = `🛒 *TAMBAH KE KERANJANG*\n\n` +
                `👤 *User:* ${userName || 'Guest'}\n` +
                `📱 *No WA:* ${userPhone || '-'}\n` +
                `📦 *Produk:* ${productName}\n` +
                `🔢 *Jumlah:* ${quantity}\n` +
                `💰 *Harga:* Rp ${formatNumber(price)}\n` +
                `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}`;
            await sendTelegramNotification(messageTelegram);
        }
        
        console.log('✅ Notifikasi tambah ke keranjang terkirim');
    } catch (error) {
        console.error('❌ Gagal kirim notifikasi:', error);
    }
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
    const sidebarName = document.getElementById('sidebarName');
    const sidebarEmail = document.getElementById('sidebarEmail');
    if (sidebarName) sidebarName.innerText = userName;
    if (sidebarEmail) sidebarEmail.innerText = userEmail;
}

// ========================================
// CEK USER LOGIN (WAJIB NAMA + NO WA)
// ========================================
function checkUserIdentity() {
    const userName = localStorage.getItem('userName');
    const userPhone = localStorage.getItem('userPhone');
    
    if (!userName || userName === '' || userName === 'Customer' || userName === 'null') {
        window.location.href = 'profile.html';
        return false;
    }
    
    if (!userPhone || userPhone === 'null') {
        alert('⚠️ Silakan isi nomor WhatsApp terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return false;
    }
    
    updateSidebarProfile();
    return true;
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
                ${product.allowVoucher !== false ? '<div class="voucher-badge"><i class="fas fa-ticket-alt"></i> Bisa Pakai Voucher</div>' : '<div class="voucher-badge disabled" style="background:#fee2e2; color:#dc2626;"><i class="fas fa-ban"></i> Tidak Bisa Voucher</div>'}
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
                ${product.allowVoucher !== false ? '<div class="voucher-badge"><i class="fas fa-ticket-alt"></i> Bisa Pakai Voucher</div>' : '<div class="voucher-badge disabled" style="background:#fee2e2; color:#dc2626;"><i class="fas fa-ban"></i> Tidak Bisa Voucher</div>'}
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
// HELPER: CEK PRODUK NON-VOUCHER
// ========================================
function hasNonVoucherProductInCart() {
    return cart.some(item => item.allowVoucher === false);
}

function clearActiveVoucher() {
    activeVoucher = null;
    voucherDiscount = 0;
    voucherUsed = false;
    localStorage.removeItem('activeVoucher');
    
    const voucherInfo = document.getElementById('voucherInfo');
    const discountRow = document.getElementById('discountRow');
    if (voucherInfo) voucherInfo.style.display = 'none';
    if (discountRow) discountRow.style.display = 'none';
    
    const voucherMessage = document.getElementById('voucherMessageCart');
    if (voucherMessage) {
        voucherMessage.textContent = '';
        voucherMessage.className = 'voucher-message-cart';
    }
}

// ========================================
// CART FUNCTIONS
// ========================================
async function addToCart(productId, productType) {
    let product = productType === 'sewa' ? sewaProducts.find(p => p.id === productId) : scriptProducts.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    if (product.allowVoucher === false && activeVoucher) {
        clearActiveVoucher();
        showNotification('⚠️ Voucher dihapus karena produk yang ditambahkan tidak support voucher!', 'error');
    }
    
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
    
    // 🔥 KIRIM NOTIFIKASI TAMBAH KE KERANJANG DENGAN NO WA
    const currentUser = localStorage.getItem('userName') || 'Customer';
    const currentPhone = localStorage.getItem('userPhone') || '';
    await sendAddToCartNotification(product.name, product.price, 1, currentUser, currentPhone);
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
        if (activeVoucher) clearActiveVoucher();
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
    
    if (hasNonVoucherProductInCart() && activeVoucher) {
        clearActiveVoucher();
        showNotification('⚠️ Voucher otomatis dihapus karena ada produk yang tidak support voucher!', 'error');
    }
    
    let finalTotal = subtotal;
    let discountAmount = 0;
    
    if (activeVoucher && voucherDiscount > 0 && !voucherUsed && !hasNonVoucherProductInCart()) {
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
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
    if (sidebar && sidebar.classList.contains('open')) renderCartItems();
}

document.getElementById('overlay')?.addEventListener('click', () => {
    closeSidebar();
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) cartSidebar.classList.remove('open');
});

// ========================================
// VOUCHER FUNCTIONS
// ========================================
function applyVoucherFromCart() {
    const code = document.getElementById('voucherCodeCart').value.trim().toUpperCase();
    if (!code) {
        showVoucherMessageCart('Masukkan kode voucher!', 'error');
        return;
    }
    
    if (hasNonVoucherProductInCart()) {
        showVoucherMessageCart('❌ GAGAL! Ada produk yang TIDAK support voucher. Hapus produk tersebut terlebih dahulu.', 'error');
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
                
                if (usedVoucherIds.includes(voucher.id)) {
                    showVoucherMessageCart('❌ Voucher sudah pernah Anda gunakan! (1 user 1 voucher)', 'error');
                    return;
                }
                
                if (voucher.used >= voucher.usageLimit) {
                    showVoucherMessageCart('Voucher sudah mencapai batas penggunaan!', 'error');
                    return;
                }
                if (expired < now) {
                    showVoucherMessageCart('Voucher sudah kadaluarsa!', 'error');
                    return;
                }
                
                if (hasNonVoucherProductInCart()) {
                    showVoucherMessageCart('❌ GAGAL! Ada produk yang tidak support voucher!', 'error');
                    return;
                }
                
                activeVoucher = voucher;
                const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                if (voucher.type === 'percentage') {
                    voucherDiscount = (subtotal * voucher.value) / 100;
                } else {
                    voucherDiscount = Math.min(voucher.value, subtotal);
                }
                voucherUsed = false;
                
                localStorage.setItem('activeVoucher', JSON.stringify({
                    code: voucher.code,
                    id: voucher.id,
                    type: voucher.type,
                    value: voucher.value,
                    discount: voucherDiscount
                }));
                
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
    clearActiveVoucher();
    showVoucherMessageCart('Voucher dihapus', 'success');
    renderCartItems();
}

function showVoucherMessageCart(msg, type) {
    const msgDiv = document.getElementById('voucherMessageCart');
    if (!msgDiv) return;
    msgDiv.textContent = msg;
    msgDiv.className = `voucher-message-cart ${type}`;
    setTimeout(() => {
        if (msgDiv) {
            msgDiv.textContent = '';
            msgDiv.className = 'voucher-message-cart';
        }
    }, 3000);
}

function loadSavedVoucher() {
    const saved = localStorage.getItem('activeVoucher');
    if (saved) {
        try {
            const voucher = JSON.parse(saved);
            if (!hasNonVoucherProductInCart() && !usedVoucherIds.includes(voucher.id)) {
                activeVoucher = { code: voucher.code, id: voucher.id, type: voucher.type, value: voucher.value };
                voucherDiscount = voucher.discount;
                voucherUsed = false;
            } else {
                localStorage.removeItem('activeVoucher');
            }
        } catch(e) {
            localStorage.removeItem('activeVoucher');
        }
    }
}

// ========================================
// CHECKOUT FUNCTION
// ========================================
function checkout() {
    // CEK NAMA DAN NO WA
    const userName = localStorage.getItem('userName');
    const userPhone = localStorage.getItem('userPhone');
    
    if (!userName || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    
    if (!userPhone || userPhone === 'null') {
        alert('⚠️ Silakan isi nomor WhatsApp terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Keranjang kosong!', 'error');
        return;
    }
    
    if (activeVoucher && voucherDiscount > 0 && hasNonVoucherProductInCart()) {
        showNotification('❌ GAGAL CHECKOUT! Ada produk yang tidak support voucher. Hapus voucher atau hapus produk tersebut.', 'error');
        return;
    }
    
    const firstItem = cart[0];
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let isGratis = false;
    
    if (activeVoucher && voucherDiscount > 0 && !voucherUsed && !hasNonVoucherProductInCart()) {
        total = total - Math.min(voucherDiscount, total);
        if (total <= 0) isGratis = true;
        voucherUsed = true;
        
        if (activeVoucher && activeVoucher.id) {
            if (!usedVoucherIds.includes(activeVoucher.id)) {
                usedVoucherIds.push(activeVoucher.id);
                localStorage.setItem('usedVouchers', JSON.stringify(usedVoucherIds));
                
                const voucherRef = database.ref('vouchers/' + activeVoucher.id);
                voucherRef.transaction((currentData) => {
                    if (currentData) {
                        return { ...currentData, used: (currentData.used || 0) + 1 };
                    }
                    return currentData;
                }).catch(err => console.error('Error updating voucher usage:', err));
            }
        }
        
        clearActiveVoucher();
    }
    
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', total);
    
    if (isGratis) showNotification('🎉 Selamat! Pesanan Anda GRATIS!', 'success');
    
    window.location.href = firstItem.type === 'sewa' ? 'data-sewa.html' : 'data-script.html';
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
// MUSIC PLAYER (SAMA SEPERTI SEBELUMNYA)
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
        const data = await response.json();
        
        if (data.status === true && data.result) {
            const r = data.result;
            const title = r.title || 'Unknown Title';
            const url = r.mp3 || r.url;
            const thumbnail = r.thumbnail || 'https://via.placeholder.com/45x45?text=🎵';
            const artist = r.author || 'Unknown Artist';
            const duration = r.duration_timestamp || '0:00';
            
            resultsList.innerHTML = `
                <div class="result-item" data-title="${escapeHtml(title)}" data-url="${url}" data-thumb="${thumbnail}" data-artist="${escapeHtml(artist)}">
                    <img src="${thumbnail}" onerror="this.src='https://via.placeholder.com/45x45?text=🎵'">
                    <div class="result-info">
                        <div class="result-title">${escapeHtml(title)}</div>
                        <div class="result-artist">${escapeHtml(artist)}</div>
                        <div class="result-duration">${duration}</div>
                    </div>
                </div>
            `;
            
            const resultItem = document.querySelector('#musicResultsList .result-item');
            if (resultItem) {
                resultItem.addEventListener('click', function() {
                    playMusic(this.dataset.title, this.dataset.url, this.dataset.thumb, this.dataset.artist);
                });
            }
        } else {
            resultsList.innerHTML = '<div class="empty-message">Lagu tidak ditemukan. Coba kata kunci lain.</div>';
        }
    } catch (error) {
        console.error('Error searching music:', error);
        resultsList.innerHTML = '<div class="empty-message">Error koneksi ke server musik. Silakan coba lagi.</div>';
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
    
    const nowPlaying = document.getElementById('musicNowPlaying');
    const musicThumb = document.getElementById('musicThumb');
    const musicTitle = document.getElementById('musicTitle');
    const musicArtist = document.getElementById('musicArtist');
    const playPauseBtn = document.getElementById('musicPlayPauseBtn');
    
    if (nowPlaying) nowPlaying.style.display = 'flex';
    if (musicThumb) musicThumb.src = thumbnail || 'https://via.placeholder.com/60x60?text=🎵';
    if (musicTitle) musicTitle.innerText = title || 'Unknown Title';
    if (musicArtist) musicArtist.innerText = artist || 'Unknown Artist';
    if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    
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
        
        const nowPlaying = document.getElementById('musicNowPlaying');
        const playPauseBtn = document.getElementById('musicPlayPauseBtn');
        const progressFilled = document.getElementById('musicProgressFilled');
        const currentTime = document.getElementById('musicCurrentTime');
        
        if (nowPlaying) nowPlaying.style.display = 'none';
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (progressFilled) progressFilled.style.width = '0%';
        if (currentTime) currentTime.innerText = '0:00';
        
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
        const playPauseBtn = document.getElementById('musicPlayPauseBtn');
        const floatingPlayPause = document.getElementById('floatingPlayPause');
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (floatingPlayPause) floatingPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        musicPlayer.audio.play().catch(e => console.log('Resume error:', e));
        musicPlayer.isPlaying = true;
        const playPauseBtn = document.getElementById('musicPlayPauseBtn');
        const floatingPlayPause = document.getElementById('floatingPlayPause');
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (floatingPlayPause) floatingPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
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
            const progressFilled = document.getElementById('musicProgressFilled');
            const currentTime = document.getElementById('musicCurrentTime');
            const durationElem = document.getElementById('musicDuration');
            if (progressFilled) progressFilled.style.width = percent + '%';
            if (currentTime) currentTime.innerText = formatMusicTime(current);
            if (durationElem) durationElem.innerText = formatMusicTime(duration);
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
    const volumeSlider = document.getElementById('musicVolumeSlider');
    if (volumeSlider) volumeSlider.value = value;
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
    
    const closeModal = document.getElementById('closeMusicModal');
    if (closeModal) closeModal.onclick = closeMusicModal;
    
    const playPauseBtn = document.getElementById('musicPlayPauseBtn');
    if (playPauseBtn) playPauseBtn.onclick = togglePlayPause;
    
    const stopBtn = document.getElementById('musicStopBtn');
    if (stopBtn) stopBtn.onclick = stopMusic;
    
    const searchBtn = document.getElementById('musicSearchBtn');
    if (searchBtn) {
        searchBtn.onclick = function() {
            const input = document.getElementById('musicSearchInput');
            if (input) searchMusic(input.value);
        };
    }
    
    const searchInput = document.getElementById('musicSearchInput');
    if (searchInput) {
        searchInput.onkeypress = function(e) {
            if (e.key === 'Enter') searchMusic(e.target.value);
        };
    }
    
    const volumeSlider = document.getElementById('musicVolumeSlider');
    if (volumeSlider) {
        volumeSlider.oninput = function(e) {
            setMusicVolume(parseInt(e.target.value));
        };
    }
    
    const volDown = document.getElementById('musicVolDown');
    if (volDown) {
        volDown.onclick = function() {
            setMusicVolume(Math.max(0, musicPlayer.volume - 10));
        };
    }
    
    const volUp = document.getElementById('musicVolUp');
    if (volUp) {
        volUp.onclick = function() {
            setMusicVolume(Math.min(100, musicPlayer.volume + 10));
        };
    }
    
    const progressBar = document.getElementById('musicProgressBar');
    if (progressBar) progressBar.onclick = seekMusic;
    
    const clearHistory = document.getElementById('clearMusicHistory');
    if (clearHistory) clearHistory.onclick = clearMusicHistory;
    
    const musicModal = document.getElementById('musicModal');
    if (musicModal) {
        musicModal.onclick = function(e) {
            if (e.target === musicModal) closeMusicModal();
        };
    }
    
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
    
    const floatingPlayPause = document.getElementById('floatingPlayPause');
    const floatingStop = document.getElementById('floatingStop');
    const floatingClose = document.getElementById('floatingClose');
    
    if (floatingPlayPause) floatingPlayPause.onclick = togglePlayPause;
    if (floatingStop) floatingStop.onclick = stopMusic;
    if (floatingClose) {
        floatingClose.onclick = function() {
            stopMusic();
            if (floatingPlayer) floatingPlayer.style.display = 'none';
        };
    }
}

function startDrag(e) {
    isDragging = true;
    const floatingPlayer = document.getElementById('floatingPlayer');
    if (!floatingPlayer) return;
    
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
    if (!floatingPlayer) return;
    
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
    if (floatingPlayer) floatingPlayer.style.transition = '';
}

function updateFloatingPlayer(track) {
    const floatingPlayer = document.getElementById('floatingPlayer');
    if (!floatingPlayer) return;
    
    if (!track) {
        floatingPlayer.style.display = 'none';
        return;
    }
    
    floatingPlayer.style.display = 'block';
    const floatingThumb = document.getElementById('floatingThumb');
    const floatingTitle = document.getElementById('floatingTitle');
    const floatingArtist = document.getElementById('floatingArtist');
    const floatingPlayPause = document.getElementById('floatingPlayPause');
    
    if (floatingThumb) floatingThumb.src = track.thumbnail || 'https://via.placeholder.com/40x40?text=🎵';
    if (floatingTitle) floatingTitle.innerText = track.title || 'Unknown Title';
    if (floatingArtist) floatingArtist.innerText = track.artist || 'Unknown Artist';
    
    if (floatingPlayPause) {
        if (musicPlayer.isPlaying) {
            floatingPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            floatingPlayPause.innerHTML = '<i class="fas fa-play"></i>';
        }
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
window.toggleSidebar = toggleSidebar;