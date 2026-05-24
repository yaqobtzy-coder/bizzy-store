// ========================================
// GLOBAL VARIABLES
// ========================================
let categories = [];
let productTypes = [];
let activeGateways = JSON.parse(localStorage.getItem('activeGateways')) || { zakki: true, ramashop: false };
let currentEditProduct = null;
let currentEditType = null;

// ========================================
// LOAD PRODUCT TYPES FROM FIREBASE
// ========================================
function loadProductTypes() {
    database.ref('productTypes').on('value', (snapshot) => {
        if (snapshot.exists()) {
            productTypes = [];
            snapshot.forEach(child => {
                productTypes.push({ id: child.key, value: child.val().value, label: child.val().label });
            });
        } else {
            productTypes = [
                { id: 'default1', value: 'sewa', label: 'Sewa Bot' },
                { id: 'default2', value: 'script', label: 'Script Bot' },
                { id: 'default3', value: 'digital', label: 'Produk Digital' },
                { id: 'default4', value: 'fisik', label: 'Produk Fisik' },
                { id: 'default5', value: 'jasa', label: 'Jasa' }
            ];
        }
        renderProductTypeSelect();
        renderProductTypesList();
    });
}

function renderProductTypeSelect() {
    const select = document.getElementById('productType');
    if (!select) return;
    
    select.innerHTML = '';
    productTypes.forEach(type => {
        select.innerHTML += `<option value="${type.value}">${type.label}</option>`;
    });
    select.innerHTML += `<option value="__NEW__">+ Tambah Tipe Baru</option>`;
}

function renderProductTypesList() {
    const container = document.getElementById('productTypesList');
    if (!container) return;
    
    if (productTypes.length === 0) {
        container.innerHTML = '<p style="color: #888;">Belum ada tipe produk</p>';
        return;
    }
    
    container.innerHTML = productTypes.map(type => `
        <span class="type-item">
            ${escapeHtml(type.label)} (${type.value})
            <button class="delete-type" onclick="deleteProductType('${type.id}')">✕</button>
        </span>
    `).join('');
}

function addNewProductTypeManually() {
    const newTypeValue = document.getElementById('newProductTypeValue').value.trim();
    if (!newTypeValue) {
        alert('Masukkan nama tipe produk!');
        return;
    }
    
    const newTypeLabel = newTypeValue.charAt(0).toUpperCase() + newTypeValue.slice(1);
    const newTypeId = 'type_' + Date.now();
    
    const newType = { id: newTypeId, value: newTypeValue.toLowerCase().replace(/\s/g, '_'), label: newTypeLabel };
    
    database.ref('productTypes/' + newTypeId).set(newType);
    document.getElementById('newProductTypeValue').value = '';
    showNotification(`Tipe "${newTypeLabel}" berhasil ditambahkan!`, 'success');
}

function deleteProductType(id) {
    if (confirm('Hapus tipe produk ini?')) {
        database.ref('productTypes/' + id).remove();
        showNotification('Tipe produk dihapus', 'success');
    }
}

document.getElementById('productType')?.addEventListener('change', (e) => {
    if (e.target.value === '__NEW__') {
        const newType = prompt('Masukkan nama tipe produk baru (contoh: ebook, kursus, template):');
        if (newType) {
            const newTypeLabel = newType.charAt(0).toUpperCase() + newType.slice(1);
            const newTypeId = 'type_' + Date.now();
            const newTypeData = { id: newTypeId, value: newType.toLowerCase().replace(/\s/g, '_'), label: newTypeLabel };
            database.ref('productTypes/' + newTypeId).set(newTypeData);
            showNotification(`Tipe "${newTypeLabel}" berhasil ditambahkan!`, 'success');
        }
        renderProductTypeSelect();
    }
});

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
        if (btn.dataset.tab === 'slider') loadSliderList();
        if (btn.dataset.tab === 'voucher') loadVoucherList();
        if (btn.dataset.tab === 'marquee') loadMarqueeSettings();
        if (btn.dataset.tab === 'productTypes') renderProductTypesList();
        if (btn.dataset.tab === 'voucherInfo') loadVoucherInfoSettingsToForm();
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
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
    let type = document.getElementById('productType').value;
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const duration = document.getElementById('productDuration').value.trim();
    const price = parseInt(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const rating = parseFloat(document.getElementById('productRating').value) || 0;
    const reviewCount = parseInt(document.getElementById('productReviewCount').value) || 0;
    const thumbnail = document.getElementById('productThumbnail').value.trim();
    const reviewsText = document.getElementById('productReviews').value.trim();
    const allowVoucher = document.getElementById('productAllowVoucher').checked;
    
    let reviews = [];
    if (reviewsText) {
        reviews = reviewsText.split('|').map(r => r.trim()).filter(r => r);
    }

    if (!name || !category || isNaN(price) || isNaN(stock)) {
        alert('Isi semua field dengan benar');
        return;
    }

    const product = {
        name, category, price, stock, rating, reviewCount, reviews, allowVoucher,
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
    document.getElementById('productRating').value = '';
    document.getElementById('productReviewCount').value = '';
    document.getElementById('productThumbnail').value = '';
    document.getElementById('productDuration').value = '';
    document.getElementById('productReviews').value = '';
    document.getElementById('productAllowVoucher').checked = true;
    
    showNotification('Produk berhasil ditambahkan!', 'success');
}

function toggleAllowVoucher(type, productId, currentValue) {
    const newValue = !currentValue;
    database.ref(`products/${type}/${productId}`).update({ allowVoucher: newValue });
    showNotification(`Voucher ${newValue ? 'diaktifkan' : 'dinonaktifkan'} untuk produk ini`, 'success');
}

function editProduct(type, productId, product) {
    currentEditProduct = productId;
    currentEditType = type;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'editProductModal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeEditModal()">&times;</button>
            <h3>✏️ Edit Produk</h3>
            <div class="form-group">
                <label>Tipe Produk</label>
                <input type="text" id="editType" value="${escapeHtml(type)}" readonly style="background:#f1f5f9;">
            </div>
            <div class="form-group">
                <label>Nama Produk</label>
                <input type="text" id="editName" value="${escapeHtml(product.name)}">
            </div>
            <div class="form-group">
                <label>Kategori</label>
                <select id="editCategory">${categories.map(cat => `<option value="${cat.name}" ${cat.name === product.category ? 'selected' : ''}>${cat.name}</option>`).join('')}</select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Harga</label>
                    <input type="number" id="editPrice" value="${product.price}">
                </div>
                <div class="form-group">
                    <label>Stok</label>
                    <input type="number" id="editStock" value="${product.stock}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Rating (1-5)</label>
                    <input type="number" id="editRating" step="0.1" min="0" max="5" value="${product.rating || 0}">
                </div>
                <div class="form-group">
                    <label>Jumlah Ulasan</label>
                    <input type="number" id="editReviewCount" value="${product.reviewCount || 0}">
                </div>
            </div>
            <div class="form-group">
                <label>Thumbnail URL</label>
                <input type="text" id="editThumbnail" value="${product.thumbnail || ''}">
            </div>
            <div class="checkbox-group" style="margin: 15px 0;">
                <label class="checkbox-label">
                    <input type="checkbox" id="editAllowVoucher" ${product.allowVoucher !== false ? 'checked' : ''}>
                    <span>✅ Boleh Pakai Voucher</span>
                </label>
            </div>
            ${type === 'sewa' ? `<div class="form-group"><label>Durasi</label><input type="text" id="editDuration" value="${product.duration || ''}"></div>` : ''}
            <div class="form-row">
                <button class="btn" onclick="saveEditProduct()">💾 Simpan</button>
                <button class="btn btn-secondary" onclick="closeEditModal()">Batal</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveEditProduct() {
    const updates = {
        name: document.getElementById('editName').value,
        category: document.getElementById('editCategory').value,
        price: parseInt(document.getElementById('editPrice').value),
        stock: parseInt(document.getElementById('editStock').value),
        rating: parseFloat(document.getElementById('editRating').value) || 0,
        reviewCount: parseInt(document.getElementById('editReviewCount').value) || 0,
        thumbnail: document.getElementById('editThumbnail').value,
        allowVoucher: document.getElementById('editAllowVoucher').checked
    };
    
    if (currentEditType === 'sewa') {
        updates.duration = document.getElementById('editDuration').value;
    }
    
    database.ref(`products/${currentEditType}/${currentEditProduct}`).update(updates);
    closeEditModal();
    showNotification('Produk berhasil diupdate!', 'success');
}

function closeEditModal() {
    const modal = document.getElementById('editProductModal');
    if (modal) modal.remove();
    currentEditProduct = null;
    currentEditType = null;
}

function loadProducts() {
    database.ref('products').on('value', (snapshot) => {
        const sewaContainer = document.getElementById('sewaProductsList');
        const scriptContainer = document.getElementById('scriptProductsList');
        
        if (!sewaContainer && !scriptContainer) return;
        
        if (sewaContainer) sewaContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Memuat...</div>';
        if (scriptContainer) scriptContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Memuat...</div>';
        
        const allProducts = [];
        snapshot.forEach(typeSnapshot => {
            const type = typeSnapshot.key;
            typeSnapshot.forEach(productSnapshot => {
                const product = productSnapshot.val();
                product.id = productSnapshot.key;
                product.type = type;
                allProducts.push(product);
            });
        });
        
        const sewaProducts = allProducts.filter(p => p.type === 'sewa');
        const scriptProducts = allProducts.filter(p => p.type === 'script');
        
        if (sewaContainer) {
            if (sewaProducts.length === 0) {
                sewaContainer.innerHTML = '<p style="color: #888;">Belum ada produk sewa</p>';
            } else {
                let html = '<div class="table-wrapper"><table><thead><tr><th>Thumb</th><th>Nama</th><th>Kategori</th><th>Durasi</th><th>Harga</th><th>Stok</th><th>Rating</th><th>Voucher</th><th>Aksi</th></tr></thead><tbody>';
                sewaProducts.forEach(p => {
                    const voucherBadge = p.allowVoucher !== false 
                        ? '<span class="voucher-badge-active">✅ Bisa</span>' 
                        : '<span class="voucher-badge-inactive">❌ Tidak</span>';
                    html += `<tr>
                        <td><img class="product-thumb" src="${p.thumbnail}" onerror="this.src='https://placehold.co/40x40'"></td>
                        <td>${escapeHtml(p.name)}</td>
                        <td>${escapeHtml(p.category)}</td>
                        <td>${p.duration || '-'}</td>
                        <td>Rp ${formatNumber(p.price)}</td>
                        <td><input type="number" id="stock_${p.id}" value="${p.stock}" style="width:70px;"><button onclick="updateStock('${p.type}', '${p.id}')" class="btn-warning btn-sm">Update</button></td>
                        <td>⭐ ${p.rating || 0} (${p.reviewCount || 0})</td>
                        <td>
                            ${voucherBadge}
                            <button onclick="toggleAllowVoucher('${p.type}', '${p.id}', ${p.allowVoucher !== false})" class="btn-toggle-voucher btn-sm">Toggle</button>
                        </td>
                        <td>
                            <button onclick='editProduct("${p.type}", "${p.id}", ${JSON.stringify(p).replace(/'/g, "&#39;")})' class="btn-warning btn-sm">✏️ Edit</button>
                            <button onclick="deleteProduct('${p.type}', '${p.id}')" class="btn-danger btn-sm">🗑️ Hapus</button>
                        </td>
                    </tr>`;
                });
                html += '</tbody></table></div>';
                sewaContainer.innerHTML = html;
            }
        }
        
        if (scriptContainer) {
            if (scriptProducts.length === 0) {
                scriptContainer.innerHTML = '<p style="color: #888;">Belum ada produk script</p>';
            } else {
                let html = '<div class="table-wrapper"><table><thead><tr><th>Thumb</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Rating</th><th>Voucher</th><th>Aksi</th></tr></thead><tbody>';
                scriptProducts.forEach(p => {
                    const voucherBadge = p.allowVoucher !== false 
                        ? '<span class="voucher-badge-active">✅ Bisa</span>' 
                        : '<span class="voucher-badge-inactive">❌ Tidak</span>';
                    html += `<tr>
                        <td><img class="product-thumb" src="${p.thumbnail}" onerror="this.src='https://placehold.co/40x40'"></td>
                        <td>${escapeHtml(p.name)}</td>
                        <td>${escapeHtml(p.category)}</td>
                        <td>Rp ${formatNumber(p.price)}</td>
                        <td><input type="number" id="stock_${p.id}" value="${p.stock}" style="width:70px;"><button onclick="updateStock('${p.type}', '${p.id}')" class="btn-warning btn-sm">Update</button></td>
                        <td>⭐ ${p.rating || 0} (${p.reviewCount || 0})</td>
                        <td>
                            ${voucherBadge}
                            <button onclick="toggleAllowVoucher('${p.type}', '${p.id}', ${p.allowVoucher !== false})" class="btn-toggle-voucher btn-sm">Toggle</button>
                        </td>
                        <td>
                            <button onclick='editProduct("${p.type}", "${p.id}", ${JSON.stringify(p).replace(/'/g, "&#39;")})' class="btn-warning btn-sm">✏️ Edit</button>
                            <button onclick="deleteProduct('${p.type}', '${p.id}')" class="btn-danger btn-sm">🗑️ Hapus</button>
                        </td>
                    </tr>`;
                });
                html += '</tbody></table></div>';
                scriptContainer.innerHTML = html;
            }
        }
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
// SLIDER
// ========================================
function addSlide() {
    const type = document.getElementById('slideType').value;
    const url = document.getElementById('slideUrl').value.trim();
    const title = document.getElementById('slideTitle').value.trim();
    if (!url) {
        alert('Masukkan URL gambar/video!');
        return;
    }
    const slide = { type, url, title, createdAt: new Date().toISOString() };
    database.ref('slider').push(slide);
    document.getElementById('slideUrl').value = '';
    document.getElementById('slideTitle').value = '';
    showNotification('Slide berhasil ditambahkan!', 'success');
}

function loadSliderList() {
    database.ref('slider').on('value', (snapshot) => {
        const container = document.getElementById('sliderList');
        if (!container) return;
        if (!snapshot.exists()) {
            container.innerHTML = '<p style="color: #888;">Belum ada slide</p>';
            return;
        }
        let html = '';
        snapshot.forEach(child => {
            const slide = child.val();
            const isVideo = slide.type === 'video' || (slide.url && (slide.url.includes('.mp4') || slide.url.includes('.webm')));
            html += `
                <div class="slider-item">
                    ${isVideo ? `<video src="${slide.url}" style="width:80px;height:80px;object-fit:cover;border-radius:10px;"></video>` : `<img src="${slide.url}" onerror="this.src='https://placehold.co/80x80'">`}
                    <div class="slider-item-info">
                        <div class="slider-item-title">${escapeHtml(slide.title || 'Slide')}</div>
                        <div class="slider-item-url">${escapeHtml(slide.url.substring(0, 50))}${slide.url.length > 50 ? '...' : ''}</div>
                        <div class="slider-item-type">${slide.type === 'video' ? '🎬 Video' : '🖼️ Gambar'}</div>
                    </div>
                    <div class="slider-item-actions">
                        <button onclick="deleteSlide('${child.key}')" class="btn-danger btn-sm">🗑️ Hapus</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    });
}

function deleteSlide(slideId) {
    if (confirm('Hapus slide ini?')) {
        database.ref('slider/' + slideId).remove();
        showNotification('Slide dihapus', 'success');
    }
}

// ========================================
// VOUCHER MANAGEMENT
// ========================================
function addVoucher() {
    const code = document.getElementById('voucherCode').value.trim().toUpperCase();
    const type = document.getElementById('voucherType').value;
    const value = parseInt(document.getElementById('voucherValue').value);
    const usageLimit = parseInt(document.getElementById('voucherUsageLimit').value);
    const expiredAt = document.getElementById('voucherExpiredAt').value;
    const showInPopup = document.getElementById('voucherShowInPopup').value === 'true';
    
    if (!code) {
        alert('Masukkan kode voucher!');
        return;
    }
    if (!value || value <= 0) {
        alert('Masukkan nilai potongan yang valid!');
        return;
    }
    if (!usageLimit || usageLimit <= 0) {
        alert('Masukkan batas penggunaan yang valid!');
        return;
    }
    if (!expiredAt) {
        alert('Masukkan tanggal kadaluarsa!');
        return;
    }
    
    const voucher = {
        code: code,
        type: type,
        value: value,
        usageLimit: usageLimit,
        used: 0,
        expiredAt: expiredAt,
        showInPopup: showInPopup,
        createdAt: new Date().toISOString()
    };
    
    database.ref('vouchers').push(voucher);
    
    document.getElementById('voucherCode').value = '';
    document.getElementById('voucherValue').value = '';
    document.getElementById('voucherUsageLimit').value = '';
    document.getElementById('voucherExpiredAt').value = '';
    
    showNotification('Voucher berhasil ditambahkan!', 'success');
}

function loadVoucherList() {
    database.ref('vouchers').on('value', (snapshot) => {
        const container = document.getElementById('voucherList');
        if (!container) return;
        
        if (!snapshot.exists()) {
            container.innerHTML = '<p style="color: #888;">Belum ada voucher</p>';
            return;
        }
        
        const now = new Date();
        let html = '';
        
        snapshot.forEach(child => {
            const v = child.val();
            const expired = new Date(v.expiredAt);
            const isExpired = expired < now;
            const isFull = v.used >= v.usageLimit;
            let statusClass = 'active';
            let statusText = 'Aktif';
            
            if (isExpired) {
                statusClass = 'expired';
                statusText = 'Kadaluarsa';
            } else if (isFull) {
                statusClass = 'full';
                statusText = 'Penuh';
            }
            
            const discountText = v.type === 'percentage' ? `${v.value}%` : `Rp ${formatNumber(v.value)}`;
            
            html += `
                <div class="voucher-item">
                    <div class="voucher-info">
                        <div class="voucher-code">${escapeHtml(v.code)}</div>
                        <div class="voucher-detail">
                            <span><i class="fas fa-tag"></i> ${discountText}</span>
                            <span><i class="fas fa-users"></i> ${v.used}/${v.usageLimit}</span>
                            <span><i class="fas fa-calendar"></i> Kadaluarsa: ${new Date(v.expiredAt).toLocaleDateString('id-ID')}</span>
                            <span class="voucher-status ${statusClass}">${statusText}</span>
                            ${v.showInPopup ? '<span><i class="fas fa-star"></i> Tampil di Popup</span>' : ''}
                        </div>
                    </div>
                    <div class="voucher-actions">
                        <button onclick="deleteVoucher('${child.key}')" class="btn-danger btn-sm">🗑️ Hapus</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    });
}

function deleteVoucher(voucherId) {
    if (confirm('Hapus voucher ini?')) {
        database.ref('vouchers/' + voucherId).remove();
        showNotification('Voucher dihapus', 'success');
    }
}

// ========================================
// VOUCHER INFO SETTINGS (ADMIN)
// ========================================

// Load settings ke form di tab Voucher Info
function loadVoucherInfoSettingsToForm() {
    database.ref('settings/voucherInfo').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('voucherInfoEnabled').value = data.enabled ? 'true' : 'false';
            document.getElementById('voucherInfoText').value = data.text || '';
            document.getElementById('voucherInfoBadge').value = data.badgeText || '';
            document.getElementById('voucherInfoHero').value = data.heroMessage || '';
            updateVoucherInfoPreview();
        } else {
            document.getElementById('voucherInfoEnabled').value = 'false';
            document.getElementById('voucherInfoText').value = '';
            document.getElementById('voucherInfoBadge').value = '';
            document.getElementById('voucherInfoHero').value = '';
        }
    });
}

// Update preview di admin panel
function updateVoucherInfoPreview() {
    const badgeText = document.getElementById('voucherInfoBadge').value || 'UPDATE TERBARU';
    const marqueeText = document.getElementById('voucherInfoText').value || '';
    const heroMessage = document.getElementById('voucherInfoHero').value || 'Dapatkan potongan harga dengan menggunakan kode voucher di halaman keranjang.';
    
    const previewBadge = document.getElementById('previewBadge');
    const previewMarquee = document.getElementById('previewMarqueeText');
    const previewHero = document.getElementById('previewHeroMessage');
    
    if (previewBadge) previewBadge.textContent = badgeText;
    if (previewMarquee) previewMarquee.textContent = marqueeText || '🔥 PROMO SPESIAL! Dapatkan diskon hingga 50%!';
    if (previewHero) previewHero.textContent = heroMessage;
}

// Save voucher info settings ke Firebase
function saveVoucherInfoSettings() {
    const enabled = document.getElementById('voucherInfoEnabled').value === 'true';
    const text = document.getElementById('voucherInfoText').value;
    const badgeText = document.getElementById('voucherInfoBadge').value;
    const heroMessage = document.getElementById('voucherInfoHero').value;
    
    const settings = {
        enabled: enabled,
        text: text,
        badgeText: badgeText,
        heroMessage: heroMessage,
        updatedAt: new Date().toISOString()
    };
    
    database.ref('settings/voucherInfo').set(settings);
    showNotification('✅ Pengaturan Info Voucher berhasil disimpan!', 'success');
}

// ========================================
// MARQUEE MANAGEMENT
// ========================================
function loadMarqueeSettings() {
    database.ref('settings/marquee').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('marqueeEnabled').value = data.enabled ? 'true' : 'false';
            document.getElementById('marqueeText').value = data.text || '';
            updateMarqueePreview();
        }
    });
}

function updateMarqueePreview() {
    const text = document.getElementById('marqueeText').value;
    const preview = document.getElementById('previewMarquee');
    if (preview) {
        preview.innerHTML = text || '🔥 PROMO SPESIAL! Diskon hingga 50% untuk pembelian pertama! 🎉';
    }
}

function saveMarqueeSettings() {
    const enabled = document.getElementById('marqueeEnabled').value === 'true';
    const text = document.getElementById('marqueeText').value;
    
    const settings = {
        enabled: enabled,
        text: text,
        updatedAt: new Date().toISOString()
    };
    
    database.ref('settings/marquee').set(settings);
    showNotification('Pengaturan marquee disimpan!', 'success');
}

document.getElementById('marqueeText')?.addEventListener('input', updateMarqueePreview);

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
        let html = '<div class="table-wrapper"><table><thead><tr><th>Order ID</th><th>Pembeli</th><th>Produk</th><th>Total</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>';
        snapshot.forEach(child => {
            const order = child.val();
            let productsHtml = '';
            let buyerName = '-';
            if (order.cart) {
                order.cart.forEach(item => { productsHtml += `${item.name} x${item.quantity}<br>`; });
            }
            if (order.customerData) {
                if (order.customerData.buyerName) buyerName = order.customerData.buyerName;
                else if (order.customerData.wajib?.ownerName) buyerName = order.customerData.wajib.ownerName;
            }
            html += `<tr>
                <td>${order.id || '-'}</td>
                <td>${escapeHtml(buyerName)}</td>
                <td>${productsHtml || '-'}</td>
                <td>Rp ${formatNumber(order.total || 0)}</td>
                <td><span class="status-badge ${order.status === 'completed' ? 'status-active' : 'status-inactive'}">${order.status || 'pending'}</span></td>
                <td>${new Date(order.createdAt).toLocaleString()}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
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
        let html = '<div class="table-wrapper"><table><thead><tr><th>Bukti</th><th>Pembeli</th><th>Order ID</th><th>Upload</th></tr></thead><tbody>';
        snapshot.forEach(child => {
            const payment = child.val();
            html += `<tr>
                <td><a href="${payment.imageUrl}" target="_blank"><img src="${payment.imageUrl}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;"></a></td>
                <td>${escapeHtml(payment.buyerName || '-')}</td>
                <td>${payment.orderId || '-'}</td>
                <td>${new Date(payment.uploadedAt).toLocaleString()}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
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
        let html = '<div class="table-wrapper"><table><thead><tr><th>Pembeli</th><th>Produk</th><th>Total</th><th>Tanggal</th></tr></thead><tbody>';
        snapshot.forEach(child => {
            const c = child.val();
            html += `<tr>
                <td>${escapeHtml(c.buyerName || '-')}</td>
                <td>${escapeHtml(c.productName || '-')}</td>
                <td>Rp ${formatNumber(c.total || 0)}</td>
                <td>${c.tanggal || '-'}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    });
}

// ========================================
// BALANCE
// ========================================
async function checkZakkiBalance() {
    try {
        const response = await fetch('https://qris.zakki.store/status');
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
            let html = '<div class="table-wrapper"><table><thead><tr><th>ID Transfer</th><th>Amount</th><th>Tipe</th><th>Tanggal</th></tr></thead><tbody>';
            if (data.data.riwayat && data.data.riwayat.length > 0) {
                data.data.riwayat.forEach(transfer => {
                    html += `<tr>
                        <td>${transfer.id_transfer || '-'}</td>
                        <td>Rp ${formatNumber(transfer.amount || 0)}</td>
                        <td>${transfer.type === 'terima' ? '📥 Diterima' : '📤 Dikirim'}</td>
                        <td>${new Date(transfer.timestamp).toLocaleString()}</td>
                    </tr>`;
                });
            } else {
                html += '<tr><td colspan="4" style="text-align:center">Belum ada riwayat transfer</td>';
            }
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #888;">Belum ada riwayat transfer</p>';
        }
    } catch (err) {
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
    localStorage.setItem('activeGateways', JSON.stringify(activeGateways));
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
function toggleMediaType() {
    const mediaType = document.getElementById('popupMediaType').value;
    const iconGroup = document.getElementById('popupIconGroup');
    const imageGroup = document.getElementById('popupImageGroup');
    if (mediaType === 'icon') {
        iconGroup.style.display = 'block';
        imageGroup.style.display = 'none';
    } else {
        iconGroup.style.display = 'none';
        imageGroup.style.display = 'block';
    }
}

document.getElementById('popupMediaType')?.addEventListener('change', toggleMediaType);

function loadPopupSettingsToForm() {
    database.ref('popupSettings').once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('popupEnabled').value = data.enabled ? 'true' : 'false';
            document.getElementById('popupMediaType').value = data.mediaType || 'icon';
            document.getElementById('popupIconClass').value = data.mediaValue || 'fab fa-whatsapp';
            document.getElementById('popupImageUrl').value = data.mediaType === 'image' ? data.mediaValue : '';
            document.getElementById('popupTitle').value = data.title || 'JOIN CHANNEL';
            document.getElementById('popupMessage').value = data.message || 'Dapatkan info update produk terbaru dan promo menarik!';
            document.getElementById('popupButtonText').value = data.buttonText || 'Gabung Sekarang';
            document.getElementById('popupButtonLink').value = data.buttonLink || 'https://wa.me/6285794545996';
            toggleMediaType();
            updatePopupPreview();
        }
    });
}

function updatePopupPreview() {
    const mediaType = document.getElementById('popupMediaType').value;
    const iconClass = document.getElementById('popupIconClass').value;
    const imageUrl = document.getElementById('popupImageUrl').value;
    const title = document.getElementById('popupTitle').value;
    const message = document.getElementById('popupMessage').value;
    const buttonText = document.getElementById('popupButtonText').value;
    const preview = document.getElementById('popupPreview');
    if (preview) {
        if (mediaType === 'icon') {
            preview.innerHTML = `<div class="preview-icon"><i class="${iconClass}"></i></div>
                <div class="preview-title">${escapeHtml(title)}</div>
                <div class="preview-message">${escapeHtml(message)}</div>
                <div class="preview-button">${escapeHtml(buttonText)}</div>`;
        } else {
            preview.innerHTML = `<div class="preview-icon"><img src="${imageUrl}" onerror="this.src='https://placehold.co/70x70'"></div>
                <div class="preview-title">${escapeHtml(title)}</div>
                <div class="preview-message">${escapeHtml(message)}</div>
                <div class="preview-button">${escapeHtml(buttonText)}</div>`;
        }
    }
}

function savePopupSettings() {
    const enabled = document.getElementById('popupEnabled').value === 'true';
    const mediaType = document.getElementById('popupMediaType').value;
    const mediaValue = mediaType === 'icon' ? document.getElementById('popupIconClass').value : document.getElementById('popupImageUrl').value;
    const settings = {
        enabled: enabled,
        mediaType: mediaType,
        mediaValue: mediaValue,
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
    const enabled = document.getElementById('popupEnabled').value === 'true';
    const mediaType = document.getElementById('popupMediaType').value;
    const mediaValue = mediaType === 'icon' ? document.getElementById('popupIconClass').value : document.getElementById('popupImageUrl').value;
    const title = document.getElementById('popupTitle').value;
    const message = document.getElementById('popupMessage').value;
    const buttonText = document.getElementById('popupButtonText').value;
    const buttonLink = document.getElementById('popupButtonLink').value;
    const testPopupDiv = document.createElement('div');
    testPopupDiv.className = 'popup-modal';
    testPopupDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:9999;display:flex;justify-content:center;align-items:center;';
    testPopupDiv.innerHTML = `<div class="popup-content" style="background:linear-gradient(135deg,#0f1220,#1a1d2e);border-radius:28px;width:90%;max-width:380px;text-align:center;padding:30px 24px;border:1px solid rgba(79,172,254,0.3);position:relative;">
        <button class="popup-close" style="position:absolute;top:15px;right:20px;background:none;border:none;color:#888;font-size:28px;cursor:pointer;">&times;</button>
        <div class="popup-media" style="width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
            ${mediaType === 'icon' ? `<i class="${mediaValue}" style="font-size:48px;color:white;"></i>` : `<img src="${mediaValue}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;">`}
        </div>
        <h2 style="color:white;font-size:24px;font-weight:800;margin-bottom:12px;background:linear-gradient(135deg,#00f2fe,#4facfe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${escapeHtml(title)}</h2>
        <p style="color:#aaa;font-size:14px;margin-bottom:25px;">${escapeHtml(message)}</p>
        <a href="${buttonLink}" target="_blank" class="popup-btn" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#25D366,#128C7E);border:none;padding:12px 28px;border-radius:50px;color:white;font-weight:700;font-size:16px;text-decoration:none;width:100%;">${escapeHtml(buttonText)}</a>
    </div>`;
    document.body.appendChild(testPopupDiv);
    testPopupDiv.querySelector('.popup-close').onclick = () => testPopupDiv.remove();
    testPopupDiv.onclick = (e) => { if (e.target === testPopupDiv) testPopupDiv.remove(); };
}

document.getElementById('popupIconClass')?.addEventListener('input', updatePopupPreview);
document.getElementById('popupImageUrl')?.addEventListener('input', updatePopupPreview);
document.getElementById('popupTitle')?.addEventListener('input', updatePopupPreview);
document.getElementById('popupMessage')?.addEventListener('input', updatePopupPreview);
document.getElementById('popupButtonText')?.addEventListener('input', updatePopupPreview);

// Event listener untuk preview voucher info
if (document.getElementById('voucherInfoText')) {
    document.getElementById('voucherInfoText').addEventListener('input', updateVoucherInfoPreview);
    document.getElementById('voucherInfoBadge').addEventListener('input', updateVoucherInfoPreview);
    document.getElementById('voucherInfoHero').addEventListener('input', updateVoucherInfoPreview);
}

// ========================================
// INITIALIZE
// ========================================
loadProductTypes();
loadCategories();
loadProducts();
loadOrders();
loadPayments();
loadCanvas();
updateGatewayUI();