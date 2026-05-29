let panelProducts = [];
let selectedProduct = null;

async function loadPanelProducts() {
    const container = document.getElementById('productGrid');
    container.innerHTML = '<div class="loading-spinner" style="text-align:center; padding:40px; color:#888;"><i class="fas fa-spinner fa-spin"></i> Memuat produk...</div>';
    
    // CEK APAKAH USER SUDAH PUNYA NAMA
    const userName = localStorage.getItem('userName');
    if (!userName || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    
    try {
        const snapshot = await database.ref('products/panel').once('value');
        const products = snapshot.val();
        
        if (products) {
            panelProducts = Object.entries(products).map(([id, product]) => ({ id, ...product }));
            renderProductOptions();
        } else {
            container.innerHTML = '<div style="text-align:center; color:#888; padding:40px;">Belum ada produk panel tersedia</div>';
        }
    } catch (error) {
        console.error('Error loading panel products:', error);
        container.innerHTML = '<div style="text-align:center; color:#ff6b6b; padding:40px;">Gagal memuat produk. Silakan refresh halaman.</div>';
    }
}

function renderProductOptions() {
    const container = document.getElementById('productGrid');
    
    if (panelProducts.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888; padding:40px;">Belum ada produk panel tersedia</div>';
        return;
    }
    
    container.innerHTML = panelProducts.map(product => {
        const diskGB = product.disk ? Math.floor(product.disk / 1024) + ' GB' : '2 GB';
        const ramLabel = getRamLabel(product.ram);
        
        return `
            <div class="product-option" data-id="${product.id}" onclick="selectProduct('${product.id}')">
                <div class="product-header">
                    <div class="product-name">${escapeHtml(product.name)}</div>
                    <div class="product-price">Rp ${formatNumber(product.price)}</div>
                </div>
                <div class="product-spec">
                    <span class="spec-item"><i class="fas fa-microchip"></i> RAM: ${ramLabel}</span>
                    <span class="spec-item"><i class="fas fa-tachometer-alt"></i> CPU: ${product.cpu || '30'}%</span>
                    <span class="spec-item"><i class="fas fa-hdd"></i> Disk: ${diskGB}</span>
                </div>
                <div class="product-desc">Panel Pterodactyl - Support Bot WhatsApp, Website, & Aplikasi Lainnya</div>
            </div>
        `;
    }).join('');
}

function getRamLabel(ram) {
    const ramMap = {
        '1gb': '1 GB', '2gb': '2 GB', '3gb': '3 GB', '4gb': '4 GB',
        '5gb': '5 GB', '6gb': '6 GB', '7gb': '7 GB', '8gb': '8 GB',
        '9gb': '9 GB', '10gb': '10 GB', '11gb': '11 GB', '12gb': '12 GB',
        '13gb': '13 GB', '14gb': '14 GB', '15gb': '15 GB', '16gb': '16 GB',
        '17gb': '17 GB', '18gb': '18 GB', '19gb': '19 GB', '20gb': '20 GB',
        'unli': 'UNLIMITED'
    };
    return ramMap[ram] || (ram ? ram.toUpperCase() : '1 GB');
}

function selectProduct(productId) {
    selectedProduct = panelProducts.find(p => p.id === productId);
    document.querySelectorAll('.product-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.id === productId) opt.classList.add('selected');
    });
}

document.getElementById('submitBtn').addEventListener('click', async () => {
    // CEK NAMA
    const userName = localStorage.getItem('userName');
    if (!userName || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    
    if (!selectedProduct) {
        alert('Pilih produk panel terlebih dahulu!');
        return;
    }

    const panelUsername = document.getElementById('panelUsername').value.trim();
    const panelPassword = document.getElementById('panelPassword').value;
    const waNumber = document.getElementById('waNumber').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!panelUsername) {
        alert('Masukkan username panel!');
        return;
    }
    if (panelUsername.length < 3) {
        alert('Username minimal 3 karakter!');
        return;
    }
    if (!panelPassword) {
        alert('Masukkan password panel!');
        return;
    }

    document.getElementById('loadingOverlay').style.display = 'flex';

    const ramLabel = getRamLabel(selectedProduct.ram);
    
    const orderData = {
        type: 'panel',
        buyerName: userName,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productPrice: selectedProduct.price,
        panelUsername: panelUsername,
        panelPassword: panelPassword,
        waNumber: waNumber,
        notes: notes,
        spec: selectedProduct.ram || '1gb',
        specData: {
            ram: selectedProduct.ram || '1024',
            cpu: selectedProduct.cpu || '30',
            disk: selectedProduct.disk || '2048',
            spec: selectedProduct.ram || '1gb',
            ramLabel: ramLabel
        },
        timestamp: Date.now(),
        status: 'pending'
    };

    const cart = [{
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: 1,
        type: 'panel',
        thumbnail: selectedProduct.thumbnail || 'https://placehold.co/300x200/1a1d24/4facfe?text=Panel'
    }];

    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', selectedProduct.price);
    localStorage.setItem('orderData', JSON.stringify(orderData));
    localStorage.setItem('buyerName', userName);

    if (typeof notifyOrderProcessing !== 'undefined') {
        const processingData = {
            id: Date.now().toString(),
            type: 'panel',
            cart: cart,
            total: selectedProduct.price,
            customerData: orderData,
            status: 'data_filled',
            createdAt: new Date().toISOString()
        };
        await notifyOrderProcessing(processingData);
    }

    document.getElementById('loadingOverlay').style.display = 'none';
    window.location.href = 'pay.html';
});

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

loadPanelProducts();