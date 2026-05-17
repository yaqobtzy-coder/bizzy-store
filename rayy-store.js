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
    // Load produk sewa
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

    // Load produk script
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

// ========================================
// RENDER SEWA PRODUCTS
// ========================================
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
                <button class="add-to-cart" ${(product.stock || 0) <= 0 ? 'disabled' : ''} 
                        onclick="addToCart('${product.id}', 'sewa')">
                    <i class="fas ${(product.stock || 0) <= 0 ? 'fa-ban' : 'fa-cart-plus'}"></i>
                    ${(product.stock || 0) <= 0 ? 'Stok Habis' : 'Sewa Sekarang'}
                </button>
            </div>
        </div>
    `).join('');
}

// ========================================
// RENDER SCRIPT PRODUCTS
// ========================================
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
                <button class="add-to-cart" ${(product.stock || 0) <= 0 ? 'disabled' : ''} 
                        onclick="addToCart('${product.id}', 'script')">
                    <i class="fas ${(product.stock || 0) <= 0 ? 'fa-ban' : 'fa-cart-plus'}"></i>
                    ${(product.stock || 0) <= 0 ? 'Stok Habis' : 'Beli Sekarang'}
                </button>
            </div>
        </div>
    `).join('');
}

// ========================================
// HELPER FUNCTIONS
// ========================================
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
                        <button onclick="updateQuantity('${item.id}')">-</button>
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

// ========================================
// CHECKOUT - REDIRECT TO DATA FORM
// ========================================
function checkout() {
    if (cart.length === 0) {
        showNotification('Keranjang kosong!', 'error');
        return;
    }
    
    // Cek tipe produk pertama di cart
    const firstItem = cart[0];
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', total);
    
    // Redirect berdasarkan tipe produk
    if (firstItem.type === 'sewa') {
        window.location.href = 'data-sewa.html';
    } else {
        window.location.href = 'data-script.html';
    }
}

// ========================================
// LOAD USER PROFILE
// ========================================
function loadUserProfile() {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        currentUser.name = savedName;
    }
}

// ========================================
// INITIALIZE
// ========================================
loadUserProfile();
loadProducts();

// Expose functions to global scope
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;