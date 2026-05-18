// ========================================
// GLOBAL VARIABLES
// ========================================
let categories = [];
let activeGateways = JSON.parse(localStorage.getItem('activeGateways')) || { zakki: true, ramashop: false };

// ========================================
// TAB SWITCHING
// ========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        
        if (btn.dataset.tab === 'balance') checkAllBalance();
        if (btn.dataset.tab === 'orders') loadOrders();
        if (btn.dataset.tab === 'payments') loadPayments();
        if (btn.dataset.tab === 'canvas') loadCanvas();
        if (btn.dataset.tab === 'transfer') loadTransferHistory();
        if (btn.dataset.tab === 'gateway') updateGatewayUI();
        if (btn.dataset.tab === 'popup') loadPopupSettingsToForm();
    });
});

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

function showNotification(msg, type) {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 40px;
        color: white;
        font-weight: 500;
        z-index: 1002;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
    `;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

// ========================================
// CATEGORIES
// ========================================
function loadCategories() {
    database.ref('categories').on('value', (snapshot) => {
        categories = [];
        snapshot.forEach(child => {
            categories.push({ id: child.key, name: child.val().name });
        });
        updateCategorySelect();
        renderCategories();
    });
}

function updateCategorySelect() {
    const select = document.getElementById('productCategory');
    if (select) {
        select.innerHTML = '<option value="">Pilih Kategori</option>';
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
        });
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = '<p style="color: #888;">Belum ada kategori</p>';
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <span class="category-item">
            ${escapeHtml(cat.name)}
            <button class="delete-cat" onclick="deleteCategory('${cat.id}')">✕</button>
        </span>
    `).join('');
}

function addCategory() {
    const name = document.getElementById('newCategory').value.trim();
    if (!name) {
        alert('Masukkan nama kategori');
        return;
    }
    database.ref('categories').push({ name: name });
    document.getElementById('newCategory').value = '';
    showNotification('Kategori berhasil ditambahkan', 'success');
}

function deleteCategory(id) {
    if (confirm('Hapus kategori ini?')) {
        database.ref('categories/' + id).remove();
        showNotification('Kategori dihapus', 'success');
    }
}

// ========================================
// PRODUCTS
// ========================================
function addProduct() {
    const type = document.getElementById('productType').value;
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const duration = document.getElementById('productDuration').value.trim();
    const price = parseInt(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const thumbnail = document.getElementById('productThumbnail').value.trim();

    if (!name || !category || isNaN(price) || isNaN(stock)) {
        alert('Isi semua field dengan benar');
        return;
    }

    const product = {
        name, category, price, stock,
        thumbnail: thumbnail || 'https://placehold.co/300x200/1a1d24/4facfe?text=Product',
        createdAt: new Date().toISOString()
    };
    
    if (type === 'sewa' && duration) {
        product.duration = duration;
    }

    database.ref(`products/${type}`).push(product);
    
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productThumbnail').value = '';
    document.getElementById('productDuration').value = '';
    
    showNotification('Produk berhasil ditambahkan!', 'success');
}

function loadProducts() {
    // Sewa products
    database.ref('products/sewa').on('value', (snapshot) => {
        const container = document.getElementById('sewaProductsList');
        if (!container) return;
        
        if (!snapshot.exists()) {
            container.innerHTML = '<p style="color: #888;">Belum ada produk sewa</p>';
            return;
        }

        let html = '<table><thead><tr><th>Thumb</th><th>Nama</th><th>Kategori</th><th>Durasi</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>';
        snapshot.forEach(child => {
            const p = child.val();
            html += `
                <tr>
                    <td><img class="product-thumb" src="${p.thumbnail}" onerror="this.src='https://placehold.co/40x40'"></td>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${escapeHtml(p.category)}</td>
                    <td>${p.duration || '-'}</td>
                    <td>Rp ${formatNumber(p.price)}</td>
                    <td>
                        <input type="number" id="stock_${child.key}" value="${p.stock}" style="width:80px;">
                        <button onclick="updateStock('sewa', '${child.key}')" class="btn-warning" style="padding:4px 10px;font-size:11px;">Update</button>
                    </td>
                    <td><button onclick="deleteProduct('sewa', '${child.key}')" class="btn-danger" style="padding:5px 10px;">Hapus</button></td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    });

    // Script products
    database.ref('products/script').on('value', (snapshot) => {
        const container = document.getElementById('scriptProductsList');
        if (!container) return;
        
        if (!snapshot.exists()) {
            container.innerHTML = '<p style="color: #888;">Belum ada produk script</p>';
            return;
        }

        let html = '<table><thead><tr><th>Thumb</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>';
        snapshot.forEach(child => {
            const p = child.val();
            html += `
                <tr>
                    <td><img class="product-thumb" src="${p.thumbnail}" onerror="this.src='https://placehold.co/40x40'"></td>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${escapeHtml(p.category)}</td>
                    <td>Rp ${formatNumber(p.price)}</td>
                    <td>
                        <input type="number" id="stock_${child.key}" value="${p.stock}" style="width:80px;">
                        <button onclick="updateStock('script', '${child.key}')" class="btn-warning" style="padding:4px 10px;font-size:11px;">Update</button>
                    </td>
                    <td><button onclick="deleteProduct('script', '${child.key}')" class="btn-danger" style="padding:5px 10px;">Hapus</button></td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    });
}

function updateStock(type, productId) {
    const newStock = parseInt(document.getElementById(`stock_${productId}`).value);
    if (isNaN(newStock)) return;
    database.ref(`products/${type}/${productId}`).update({ stock: newStock });
    showNotification('Stok diperbarui', 'success');
}

function deleteProduct(type, productId) {
    if (confirm('Hapus produk ini?')) {
        database.ref(`products/${type}/${productId}`).remove();
        showNotification('Produk dihapus', 'success');
    }
}

// ========================================
// ORDERS
// ========================================
function loadOrders() {
    database.ref('orders').on('value', (snapshot) => {
        const container = document.getElementById('ordersList');
        if (!container) return;
        
        if (!snapshot.exists()) {
            container.innerHTML = '<p style="color: #888;">Belum ada pesanan</p>';
            return;
        }

        let html = '<table><thead><tr><th>Order ID</th><th>Pembeli</th><th>Produk</th><th>Total</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>';
        snapshot.forEach(child => {
            const order = child.val();
            let productsHtml = '';
            let buyerName = '-';
            
            if (order.cart) {
                order.cart.forEach(item => {
                    productsHtml += `${item.name} x${item.quantity}<br>`;
                });
            }
            
            if (order.customerData) {
                if (order.customerData.buyerName) buyerName = order.customerData.buyerName;
                else if (order.customerData.wajib?.ownerName) buyerName = order.customerData.wajib.ownerName;
            }
            
            html += `
                <tr>
                    <td>${order.id || '-'}</td>
                    <td>${escapeHtml(buyerName)}</td>
                    <td>${productsHtml || '-'}</td>
                    <td>Rp ${formatNumber(order.total || 0)}</td>
                    <td><span class="status-badge ${order.status === 'completed' ? 'status-active' : 'status-inactive'}">${order.status || 'pending'}</span></td>
                    <td>${new Date(order.createdAt).toLocaleString()}</td>
                </tr>
            `;
        });
        html += '</tbody></tr>';
        container.innerHTML = html;
    });
}

// ========================================
// PAYMENTS
// ========================================
function loadPayments() {
    database.ref('payments').on('value', (snapshot) => {
        const container = document.getElementById('paymentsList');
        if (!container) return;
        
        if (!snapshot.exists()) {
            container.innerHTML = '<p style="color: #888;">Belum ada bukti pembayaran</p>';
            return;
        }

        let html = '<table><thead><tr><th>Bukti</th><th>Pembeli</th><th>Order ID</th><th>Upload</th></tr></thead><tbody>';
        snapshot.forEach(child => {
            const payment = child.val();
            html += `
                <tr>
                    <td><a href="${payment.imageUrl}" target="_blank"><img src="${payment.imageUrl}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;"></a></td>
                    <td>${escapeHtml(payment.buyerName || '-')}</td>
                    <td>${payment.orderId || '-'}</td>
                    <td>${new Date(payment.uploadedAt).toLocaleString()}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    });
}

// ========================================
// CANVAS
// ========================================
function loadCanvas() {
    database.ref('doneCanvas').on('value', (snapshot) => {
        const container = document.getElementById('canvasList');
        if (!container) return;
        
        if (!snapshot.exists()) {
            container.innerHTML = '<p style="color: #888;">Belum ada canvas yang digenerate</p>';
            return;
        }

        let html = '<table><thead><tr><th>Pembeli</th><th>Produk</th><th>Total</th><th>Tanggal</th></tr></thead><tbody>';
        snapshot.forEach(child => {
            const c = child.val();
            html += `
                <tr>
                    <td>${escapeHtml(c.buyerName || '-')}</td>
                    <td>${escapeHtml(c.productName || '-')}</td>
                    <td>Rp ${formatNumber(c.total || 0)}</td>
                    <td>${c.tanggal || '-'}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    });
}

// ========================================
// BALANCE
// ========================================
async function checkZakkiBalance() {
    try {
        const response = await fetch('https://qris.zakki.store/status', {
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        const balanceEl = document.getElementById('zakkiBalanceAmount');
        if (balanceEl) {
            if (data.code === 200 && data.data?.ringkasan_finansial) {
                balanceEl.innerHTML = `Rp ${formatNumber(data.data.ringkasan_finansial.total_saldo_beredar || 0)}`;
            } else {
                balanceEl.innerHTML = 'Gagal mengambil data';
            }
        }
    } catch (err) {
        console.error('Error Zakki balance:', err);
        const balanceEl = document.getElementById('zakkiBalanceAmount');
        if (balanceEl) balanceEl.innerHTML = 'Error';
    }
}

async function checkRamashopBalance() {
    try {
        const response = await fetch('https://ramashop.my.id/api/public/balance', {
            headers: { 'X-API-Key': PAYMENT_GATEWAYS.ramashop.token }
        });
        const data = await response.json();
        const balanceEl = document.getElementById('ramashopBalanceAmount');
        if (balanceEl) {
            if (data.success && data.data) {
                balanceEl.innerHTML = `Rp ${formatNumber(data.data.balance || 0)}`;
            } else {
                balanceEl.innerHTML = 'Gagal mengambil data';
            }
        }
    } catch (err) {
        console.error('Error Ramashop balance:', err);
        const balanceEl = document.getElementById('ramashopBalanceAmount');
        if (balanceEl) balanceEl.innerHTML = 'Error';
    }
}

function checkAllBalance() {
    checkZakkiBalance();
    checkRamashopBalance();
}

// ========================================
// TRANSFER HISTORY
// ========================================
async function loadTransferHistory() {
    const container = document.getElementById('transferList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Loading...</div>';
    
    try {
        const response = await fetch(`https://qris.zakki.store/mytransfer?token=${PAYMENT_GATEWAYS.zakki.token}&type=all`);
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
            let html = '<table><thead><tr><th>ID Transfer</th><th>Amount</th><th>Tipe</th><th>Tanggal</th></tr></thead><tbody>';
            if (data.data.riwayat && data.data.riwayat.length > 0) {
                data.data.riwayat.forEach(transfer => {
                    html += `
                        <tr>
                            <td>${transfer.id_transfer || '-'}</td>
                            <td>Rp ${formatNumber(transfer.amount || 0)}</td>
                            <td>${transfer.type === 'terima' ? '📥 Diterima' : '📤 Dikirim'}</td>
                            <td>${new Date(transfer.timestamp).toLocaleString()}</td>
                        </tr>
                    `;
                });
            } else {
                html += '<tr><td colspan="4" style="text-align:center">Belum ada riwayat transfer</td></tr>';
            }
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #888;">Belum ada riwayat transfer</p>';
        }
    } catch (err) {
        console.error('Error transfer history:', err);
        container.innerHTML = '<p style="color: #ff6b6b;">Gagal mengambil riwayat transfer</p>';
    }
}

// ========================================
// GATEWAY SETTINGS
// ========================================
function updateGatewayUI() {
    const zakkiStatus = document.getElementById('zakkiStatus');
    const ramashopStatus = document.getElementById('ramashopStatus');
    
    if (zakkiStatus) {
        zakkiStatus.textContent = activeGateways.zakki ? 'Active' : 'Inactive';
        zakkiStatus.className = `status-badge ${activeGateways.zakki ? 'status-active' : 'status-inactive'}`;
    }
    if (ramashopStatus) {
        ramashopStatus.textContent = activeGateways.ramashop ? 'Active' : 'Inactive';
        ramashopStatus.className = `status-badge ${activeGateways.ramashop ? 'status-active' : 'status-inactive'}`;
    }
}

function toggleGateway(gateway) {
    activeGateways[gateway] = !activeGateways[gateway];
    localStorage.setItem('activeGateways', JSON.stringify(activeGateways));
    updateGatewayUI();
    alert(`Gateway ${gateway} ${activeGateways[gateway] ? 'diaktifkan' : 'dinonaktifkan'}`);
}

// ========================================
// POPUP SETTINGS
// ========================================
function loadPopupSettingsToForm() {
    database.ref('popupSettings').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('popupIconClass').value = data.iconClass || 'fab fa-whatsapp';
            document.getElementById('popupTitle').value = data.title || 'JOIN CHANNEL';
            document.getElementById('popupMessage').value = data.message || 'Dapatkan info update produk terbaru dan promo menarik!';
            document.getElementById('popupButtonText').value = data.buttonText || 'Gabung Sekarang';
            document.getElementById('popupButtonLink').value = data.buttonLink || 'https://wa.me/6285794545996';
            updatePopupPreview();
        } else {
            // Default values
            document.getElementById('popupIconClass').value = 'fab fa-whatsapp';
            document.getElementById('popupTitle').value = 'JOIN CHANNEL';
            document.getElementById('popupMessage').value = 'Dapatkan info update produk terbaru dan promo menarik!';
            document.getElementById('popupButtonText').value = 'Gabung Sekarang';
            document.getElementById('popupButtonLink').value = 'https://wa.me/6285794545996';
            updatePopupPreview();
        }
    });
}

function updatePopupPreview() {
    const iconClass = document.getElementById('popupIconClass').value || 'fab fa-whatsapp';
    const title = document.getElementById('popupTitle').value || 'JOIN CHANNEL';
    const message = document.getElementById('popupMessage').value || 'Dapatkan info update produk terbaru dan promo menarik!';
    const buttonText = document.getElementById('popupButtonText').value || 'Gabung Sekarang';
    
    const preview = document.getElementById('popupPreview');
    if (preview) {
        preview.innerHTML = `
            <div class="preview-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="preview-title">${escapeHtml(title)}</div>
            <div class="preview-message">${escapeHtml(message)}</div>
            <div class="preview-button">${escapeHtml(buttonText)}</div>
        `;
    }
}

function savePopupSettings() {
    const settings = {
        iconClass: document.getElementById('popupIconClass').value,
        title: document.getElementById('popupTitle').value,
        message: document.getElementById('popupMessage').value,
        buttonText: document.getElementById('popupButtonText').value,
        buttonLink: document.getElementById('popupButtonLink').value,
        updatedAt: new Date().toISOString()
    };
    
    database.ref('popupSettings').set(settings);
    showNotification('Pengaturan popup disimpan!', 'success');
}

function testPopup() {
    const iconClass = document.getElementById('popupIconClass').value || 'fab fa-whatsapp';
    const title = document.getElementById('popupTitle').value || 'JOIN CHANNEL';
    const message = document.getElementById('popupMessage').value || 'Dapatkan info update produk terbaru dan promo menarik!';
    const buttonText = document.getElementById('popupButtonText').value || 'Gabung Sekarang';
    const buttonLink = document.getElementById('popupButtonLink').value || '#';
    
    // Create temporary popup
    const testPopupDiv = document.createElement('div');
    testPopupDiv.className = 'popup-modal';
    testPopupDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:9999;display:flex;justify-content:center;align-items:center;';
    testPopupDiv.innerHTML = `
        <div class="popup-content" style="background:linear-gradient(135deg,#0f1220,#1a1d2e);border-radius:28px;width:90%;max-width:380px;text-align:center;padding:30px 24px;border:1px solid rgba(79,172,254,0.3);position:relative;">
            <button class="popup-close" style="position:absolute;top:15px;right:20px;background:none;border:none;color:#888;font-size:28px;cursor:pointer;">&times;</button>
            <div class="popup-icon" style="width:80px;height:80px;background:linear-gradient(135deg,#25D366,#128C7E);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                <i class="${iconClass}" style="font-size:48px;color:white;"></i>
            </div>
            <h2 style="color:white;font-size:24px;font-weight:800;margin-bottom:12px;background:linear-gradient(135deg,#00f2fe,#4facfe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${escapeHtml(title)}</h2>
            <p style="color:#aaa;font-size:14px;margin-bottom:25px;">${escapeHtml(message)}</p>
            <a href="${buttonLink}" target="_blank" class="popup-btn" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#25D366,#128C7E);border:none;padding:12px 28px;border-radius:50px;color:white;font-weight:700;font-size:16px;text-decoration:none;width:100%;">${escapeHtml(buttonText)}</a>
        </div>
    `;
    document.body.appendChild(testPopupDiv);
    
    testPopupDiv.querySelector('.popup-close').onclick = () => testPopupDiv.remove();
    testPopupDiv.onclick = (e) => { if (e.target === testPopupDiv) testPopupDiv.remove(); };
}

// Attach event listeners for real-time preview
document.getElementById('popupIconClass')?.addEventListener('input', updatePopupPreview);
document.getElementById('popupTitle')?.addEventListener('input', updatePopupPreview);
document.getElementById('popupMessage')?.addEventListener('input', updatePopupPreview);
document.getElementById('popupButtonText')?.addEventListener('input', updatePopupPreview);

// ========================================
// INITIALIZE
// ========================================
loadCategories();
loadProducts();
loadOrders();
loadPayments();
loadCanvas();
updateGatewayUI();