// ========================================
// RAYY STORE - MAIN JAVASCRIPT (FIXED VOUCHER & CLEAR CART ON REFRESH)
// ========================================

let sewaProducts = [];
let scriptProducts = [];
let cart = []; // 🔥 KOSONGKAN SAAT START
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

// ========================================
// CEK NAMA USER (WAJIB ISI NAMA DULU)
// ========================================
function requireName() {
    const userName = localStorage.getItem('userName');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !userName || userName === '' || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan login terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return false;
    }
    return true;
}

function checkUserIdentity() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    
    if (!isLoggedIn || !userName || userName === '' || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        window.location.href = 'profile.html';
        return false;
    }
    return true;
}

// ========================================
// CLEAR CART ON REFRESH
// ========================================
function clearCartOnRefresh() {
    localStorage.removeItem('cart');
    cart = [];
    updateCartCount();
    if (typeof renderCartItems === 'function') renderCartItems();
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
function addToCart(productId, productType) {
    if (!requireName()) return;
    
    let product = productType === 'sewa' ? sewaProducts.find(p => p.id === productId) : scriptProducts.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    // 🔥 CEK: Jika produk TIDAK SUPPORT VOUCHER, hapus voucher yang aktif
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
    
    // 🔥 JIKA ADA PRODUK NON-VOUCHER, PASTIKAN VOUCHER DIHAPUS
    if (hasNonVoucherProductInCart() && activeVoucher) {
        clearActiveVoucher();
        showNotification('⚠️ Voucher dihapus karena ada produk yang tidak support voucher!', 'error');
    }
    
    let finalTotal = subtotal;
    let discountAmount = 0;
    
    // 🔥 HANYA APPLY VOUCHER JIKA TIDAK ADA PRODUK NON-VOUCHER
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

// ========================================
// VOUCHER FUNCTIONS - FULLY FIXED
// ========================================

function applyVoucherFromCart() {
    const code = document.getElementById('voucherCodeCart').value.trim().toUpperCase();
    if (!code) {
        showVoucherMessageCart('Masukkan kode voucher!', 'error');
        return;
    }
    
    // 🔥 CEK PRODUK YANG TIDAK BISA VOUCHER - WAJIB!!!
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
                
                // 🔥 DOUBLE CEK lagi sebelum apply
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
            // 🔥 JANGAN LOAD VOUCHER JIKA ADA PRODUK NON-VOUCHER
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
    if (!requireName()) return;
    
    if (cart.length === 0) {
        showNotification('Keranjang kosong!', 'error');
        return;
    }
    
    // 🔥 CEK: Jika ada voucher aktif tapi ada produk NON-VOUCHER
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
                });
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
// MUSIC PLAYER (SEDERHANA)
// ========================================
function loadMusicHistory(){const s=localStorage.getItem('rayy_music_history');if(s){try{musicPlayer.playHistory=JSON.parse(s);if(musicPlayer.playHistory.length>0){renderMusicHistory();const hs=document.getElementById('musicHistorySection');if(hs)hs.style.display='block';}}catch(e){}}}
function saveMusicHistory(){localStorage.setItem('rayy_music_history',JSON.stringify(musicPlayer.playHistory));}
function renderMusicHistory(){const hl=document.getElementById('musicHistoryList');if(!hl)return;if(musicPlayer.playHistory.length===0){const hs=document.getElementById('musicHistorySection');if(hs)hs.style.display='none';return;}
    hl.innerHTML=musicPlayer.playHistory.map((t,i)=>`<div class="history-item" onclick="playFromHistory(${i})"><img src="${t.thumbnail||'https://via.placeholder.com/35x35?text=🎵'}" onerror="this.src='https://via.placeholder.com/35x35?text=🎵'"><div class="history-item-info"><div class="history-item-title">${escapeHtml(t.title.substring(0,40))}${t.title.length>40?'...':''}</div><div class="history-item-artist">${escapeHtml(t.artist||'Unknown Artist')}</div></div><i class="fas fa-play-circle" style="color:#4facfe;opacity:0.6"></i></div>`).join('');
}
function playFromHistory(i){const t=musicPlayer.playHistory[i];if(t&&t.url)playMusic(t.title,t.url,t.thumbnail,t.artist);}
function clearMusicHistory(){if(confirm('Hapus semua riwayat putar?')){musicPlayer.playHistory=[];saveMusicHistory();renderMusicHistory();const hs=document.getElementById('musicHistorySection');if(hs)hs.style.display='none';showNotification('Riwayat musik dihapus','success');}}
async function searchMusic(q){const rl=document.getElementById('musicResultsList');if(!q.trim()){rl.innerHTML='<div class="empty-message">Masukkan judul lagu</div>';return;}
    rl.innerHTML='<div class="loading-indicator"><i class="fas fa-spinner fa-pulse"></i> Mencari...</div>';
    try{const res=await fetch(`https://api-faa.my.id/faa/ytplay?query=${encodeURIComponent(q)}`);if(!res.ok)throw new Error();const d=await res.json();
        if(d.status&&d.result){const r=d.result;rl.innerHTML=`<div class="result-item" data-title="${escapeHtml(r.title)}" data-url="${r.mp3}" data-thumb="${r.thumbnail}" data-artist="${escapeHtml(r.author)}"><img src="${r.thumbnail}" onerror="this.src='https://via.placeholder.com/45x45?text=🎵'"><div class="result-info"><div class="result-title">${escapeHtml(r.title)}</div><div class="result-artist">${escapeHtml(r.author)}</div><div class="result-duration">${r.duration_timestamp||'0:00'}</div></div></div>`;
            document.querySelector('#musicResultsList .result-item')?.addEventListener('click',function(){playMusic(this.dataset.title,this.dataset.url,this.dataset.thumb,this.dataset.artist);});
        }else{rl.innerHTML='<div class="empty-message">Lagu tidak ditemukan</div>';}
    }catch(e){rl.innerHTML='<div class="empty-message">Error koneksi</div>';}
}
function playMusic(title,url,thumbnail,artist){if(!url||url==='undefined'){showNotification('URL tidak valid','error');return;}
    const a=document.getElementById('globalAudio');if(!a)return;if(musicPlayer.updateInterval)clearInterval(musicPlayer.updateInterval);
    musicPlayer.currentTrack={title,url,thumbnail,artist};musicPlayer.audio=a;a.src=url;a.load();a.play().catch(e=>console.log(e));musicPlayer.isPlaying=true;
    const np=document.getElementById('musicNowPlaying'),mt=document.getElementById('musicThumb'),mti=document.getElementById('musicTitle'),ma=document.getElementById('musicArtist'),ppb=document.getElementById('musicPlayPauseBtn');
    if(np)np.style.display='flex';if(mt)mt.src=thumbnail||'https://via.placeholder.com/60x60?text=🎵';if(mti)mti.innerText=title||'Unknown';if(ma)ma.innerText=artist||'Unknown';if(ppb)ppb.innerHTML='<i class="fas fa-pause"></i>';
    updateFloatingPlayer({title,thumbnail,artist});addToMusicHistory({title,url,thumbnail,artist});showToast(`🎵 Memutar: ${title}`,'success');startProgressUpdate();
}
function addToMusicHistory(t){if(!t||!t.title)return;musicPlayer.playHistory=musicPlayer.playHistory.filter(h=>h.url!==t.url);musicPlayer.playHistory.unshift({title:t.title,url:t.url,thumbnail:t.thumbnail,artist:t.artist,timestamp:new Date().toISOString()});if(musicPlayer.playHistory.length>20)musicPlayer.playHistory=musicPlayer.playHistory.slice(0,20);saveMusicHistory();renderMusicHistory();const hs=document.getElementById('musicHistorySection');if(hs)hs.style.display='block';}
function stopMusic(){if(musicPlayer.audio){musicPlayer.audio.pause();musicPlayer.audio.currentTime=0;musicPlayer.isPlaying=false;musicPlayer.currentTrack=null;
    const np=document.getElementById('musicNowPlaying'),ppb=document.getElementById('musicPlayPauseBtn'),pf=document.getElementById('musicProgressFilled'),ct=document.getElementById('musicCurrentTime');
    if(np)np.style.display='none';if(ppb)ppb.innerHTML='<i class="fas fa-play"></i>';if(pf)pf.style.width='0%';if(ct)ct.innerText='0:00';updateFloatingPlayer(null);if(musicPlayer.updateInterval)clearInterval(musicPlayer.updateInterval);showToast('⏹️ Musik dihentikan','success');}}
function togglePlayPause(){if(!musicPlayer.audio||!musicPlayer.currentTrack){showToast('Pilih lagu dulu','error');return;}
    if(musicPlayer.isPlaying){musicPlayer.audio.pause();musicPlayer.isPlaying=false;const ppb=document.getElementById('musicPlayPauseBtn'),fpp=document.getElementById('floatingPlayPause');if(ppb)ppb.innerHTML='<i class="fas fa-play"></i>';if(fpp)fpp.innerHTML='<i class="fas fa-play"></i>';}else{musicPlayer.audio.play().catch(e=>console.log(e));musicPlayer.isPlaying=true;const ppb=document.getElementById('musicPlayPauseBtn'),fpp=document.getElementById('floatingPlayPause');if(ppb)ppb.innerHTML='<i class="fas fa-pause"></i>';if(fpp)fpp.innerHTML='<i class="fas fa-pause"></i>';startProgressUpdate();}}
function startProgressUpdate(){if(musicPlayer.updateInterval)clearInterval(musicPlayer.updateInterval);musicPlayer.updateInterval=setInterval(()=>{if(musicPlayer.audio&&musicPlayer.audio.duration&&musicPlayer.isPlaying){const c=musicPlayer.audio.currentTime,d=musicPlayer.audio.duration,p=(c/d)*100;const pf=document.getElementById('musicProgressFilled'),ct=document.getElementById('musicCurrentTime'),de=document.getElementById('musicDuration');if(pf)pf.style.width=p+'%';if(ct)ct.innerText=formatMusicTime(c);if(de)de.innerText=formatMusicTime(d);}},500);}
function formatMusicTime(s){if(!s||isNaN(s))return '0:00';const m=Math.floor(s/60),sc=Math.floor(s%60);return `${m}:${sc.toString().padStart(2,'0')}`;}
function setMusicVolume(v){musicPlayer.volume=v;if(musicPlayer.audio)musicPlayer.audio.volume=v/100;const vs=document.getElementById('musicVolumeSlider');if(vs)vs.value=v;localStorage.setItem('rayy_music_volume',v);}
function openMusicModal(){const m=document.getElementById('musicModal');if(m)m.style.display='flex';loadMusicHistory();}
function closeMusicModal(){const m=document.getElementById('musicModal');if(m)m.style.display='none';}
let isDragging=false,dragStartX,dragStartY;
function initFloatingPlayer(){const fp=document.getElementById('floatingPlayer'),dh=document.getElementById('floatingDrag');if(!dh)return;
    dh.addEventListener('mousedown',startDrag);dh.addEventListener('touchstart',startDrag,{passive:false});document.addEventListener('mousemove',onDrag);document.addEventListener('mouseup',stopDrag);document.addEventListener('touchmove',onDrag,{passive:false});document.addEventListener('touchend',stopDrag);
    document.getElementById('floatingPlayPause').onclick=togglePlayPause;document.getElementById('floatingStop').onclick=stopMusic;document.getElementById('floatingClose').onclick=()=>{stopMusic();if(fp)fp.style.display='none';};
}
function startDrag(e){isDragging=true;const fp=document.getElementById('floatingPlayer');if(!fp)return;const rect=fp.getBoundingClientRect();
    if(e.type==='mousedown'){dragStartX=e.clientX-rect.left;dragStartY=e.clientY-rect.top;}else{dragStartX=e.touches[0].clientX-rect.left;dragStartY=e.touches[0].clientY-rect.top;}
    fp.style.transition='none';e.preventDefault();}
function onDrag(e){if(!isDragging)return;let cx,cy;if(e.type==='mousemove'){cx=e.clientX;cy=e.clientY;}else{cx=e.touches[0].clientX;cy=e.touches[0].clientY;}
    const fp=document.getElementById('floatingPlayer');if(!fp)return;let nx=cx-dragStartX,ny=cy-dragStartY;const mx=window.innerWidth-fp.offsetWidth-10,my=window.innerHeight-fp.offsetHeight-10;
    nx=Math.min(Math.max(nx,10),mx);ny=Math.min(Math.max(ny,10),my);fp.style.left=nx+'px';fp.style.top=ny+'px';fp.style.right='auto';fp.style.bottom='auto';e.preventDefault();}
function stopDrag(){isDragging=false;const fp=document.getElementById('floatingPlayer');if(fp)fp.style.transition='';}
function updateFloatingPlayer(t){const fp=document.getElementById('floatingPlayer');if(!fp)return;if(!t){fp.style.display='none';return;}
    fp.style.display='block';const ft=document.getElementById('floatingThumb'),fti=document.getElementById('floatingTitle'),fa=document.getElementById('floatingArtist'),fpp=document.getElementById('floatingPlayPause');
    if(ft)ft.src=t.thumbnail||'https://via.placeholder.com/40x40?text=🎵';if(fti)fti.innerText=t.title||'Unknown';if(fa)fa.innerText=t.artist||'Unknown';if(fpp)fpp.innerHTML=musicPlayer.isPlaying?'<i class="fas fa-pause"></i>':'<i class="fas fa-play"></i>';
}
function initMusicEventListeners(){
    document.getElementById('sidebarMusicBtn').onclick=(e)=>{e.preventDefault();openMusicModal();};
    document.getElementById('closeMusicModal').onclick=closeMusicModal;
    document.getElementById('musicPlayPauseBtn').onclick=togglePlayPause;
    document.getElementById('musicStopBtn').onclick=stopMusic;
    document.getElementById('musicSearchBtn').onclick=()=>searchMusic(document.getElementById('musicSearchInput').value);
    document.getElementById('musicSearchInput').onkeypress=(e)=>{if(e.key==='Enter')searchMusic(e.target.value);};
    document.getElementById('musicVolumeSlider').oninput=(e)=>setMusicVolume(parseInt(e.target.value));
    document.getElementById('musicVolDown').onclick=()=>setMusicVolume(Math.max(0,musicPlayer.volume-10));
    document.getElementById('musicVolUp').onclick=()=>setMusicVolume(Math.min(100,musicPlayer.volume+10));
    document.getElementById('musicProgressBar').onclick=(e)=>{if(musicPlayer.audio&&musicPlayer.audio.duration){const rect=e.currentTarget.getBoundingClientRect();const percent=(e.clientX-rect.left)/rect.width;musicPlayer.audio.currentTime=percent*musicPlayer.audio.duration;}};
    document.getElementById('clearMusicHistory').onclick=clearMusicHistory;
    document.getElementById('musicModal').onclick=(e)=>{if(e.target===document.getElementById('musicModal'))closeMusicModal();};
    const sv=localStorage.getItem('rayy_music_volume');if(sv)setMusicVolume(parseInt(sv));else setMusicVolume(70);
}

// ========================================
// INITIALIZE
// ========================================
document.getElementById('menuToggle').onclick = toggleSidebar;
document.getElementById('sidebarClose').onclick = closeSidebar;

// 🔥 HAPUS KERANJANG SETIAP REFRESH HALAMAN
clearCartOnRefresh();

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