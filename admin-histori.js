// ========================================
// ADMIN HISTORI SCRIPT
// Mengambil database dari firebase-config.js
// ========================================

// Global Variables
let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
let itemsPerPage = 20;
let currentTab = 'all';

// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    toast.style.display = 'block';
    toast.style.borderLeftColor = type === 'success' ? '#28a745' : '#dc3545';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': 'pending',
        'pending_approval': 'pending_approval',
        'paid': 'paid',
        'done': 'done',
        'completed': 'done',
        'aktif': 'done',
        'cancelled': 'cancelled',
        'success': 'done'
    };
    
    const className = statusMap[status] || 'pending';
    let text = '';
    
    switch(status) {
        case 'pending': text = '⏳ Menunggu'; break;
        case 'pending_approval': text = '⏳ Menunggu ACC'; break;
        case 'paid': text = '💳 Dibayar'; break;
        case 'done': text = '✅ Selesai'; break;
        case 'completed': text = '✅ Selesai'; break;
        case 'aktif': text = '✅ Aktif'; break;
        case 'cancelled': text = '❌ Dibatalkan'; break;
        case 'success': text = '✅ Sukses'; break;
        default: text = status || 'Unknown';
    }
    
    return `<span class="status-badge status-${className}">${text}</span>`;
}

// ========================================
// LOAD DATA FROM FIREBASE
// Menggunakan database dari firebase-config.js
// ========================================
async function loadAllOrders() {
    // Cek apakah database sudah terinisialisasi dari firebase-config.js
    if (typeof database === 'undefined') {
        console.error('❌ Database tidak terdefinisi! Pastikan firebase-config.js sudah di-load.');
        showToast('Error: Firebase tidak terinisialisasi', 'error');
        return;
    }
    
    showLoading();
    allOrders = [];
    
    try {
        console.log('🚀 Mulai memuat data dari Firebase...');
        console.log('📁 Database URL:', database.app.options.databaseURL);
        
        // 1. LOAD SEWA ORDERS
        console.log('📥 Loading sewa_orders...');
        const sewaSnapshot = await database.ref('sewa_orders').once('value');
        if (sewaSnapshot.exists()) {
            sewaSnapshot.forEach(child => {
                const order = child.val();
                allOrders.push({
                    id: child.key,
                    type: 'sewa',
                    ...order,
                    orderId: child.key,
                    createdAt: order.createdAt || order.timestamp || new Date().toISOString()
                });
            });
            console.log(`✅ Loaded ${sewaSnapshot.numChildren()} sewa orders`);
        } else {
            console.log('⚠️ Tidak ada data di sewa_orders');
        }
        
        // 2. LOAD SCRIPT ORDERS
        console.log('📥 Loading script_orders...');
        const scriptSnapshot = await database.ref('script_orders').once('value');
        if (scriptSnapshot.exists()) {
            scriptSnapshot.forEach(child => {
                const order = child.val();
                allOrders.push({
                    id: child.key,
                    type: 'script',
                    ...order,
                    orderId: child.key,
                    createdAt: order.createdAt || order.timestamp || new Date().toISOString()
                });
            });
            console.log(`✅ Loaded ${scriptSnapshot.numChildren()} script orders`);
        }
        
        // 3. LOAD PANEL ORDERS
        console.log('📥 Loading panel_orders...');
        const panelSnapshot = await database.ref('panel_orders').once('value');
        if (panelSnapshot.exists()) {
            panelSnapshot.forEach(child => {
                const panel = child.val();
                allOrders.push({
                    id: child.key,
                    type: 'panel',
                    orderId: child.key,
                    buyerName: panel.buyerName || panel.username || panel.panelUsername,
                    buyerPhone: panel.buyerPhone || '-',
                    productName: panel.productName || 'Panel Hosting',
                    productPrice: panel.productPrice || 0,
                    total: panel.productPrice || 0,
                    status: panel.status || 'pending',
                    createdAt: panel.createdAt || panel.timestamp || new Date().toISOString(),
                    durasi: panel.durasi || panel.spec || '30 hari',
                    linkGroup: panel.linkGroup,
                    panelInfo: panel.panelInfo || null,
                    notes: panel.notes || ''
                });
            });
            console.log(`✅ Loaded ${panelSnapshot.numChildren()} panel orders`);
        }
        
        // 4. LOAD FROM ORDERS (backup)
        console.log('📥 Loading orders backup...');
        const ordersSnapshot = await database.ref('orders').once('value');
        if (ordersSnapshot.exists()) {
            ordersSnapshot.forEach(child => {
                const order = child.val();
                const exists = allOrders.some(o => o.id === child.key);
                if (!exists) {
                    allOrders.push({
                        id: child.key,
                        type: order.type || 'sewa',
                        ...order,
                        orderId: child.key,
                        createdAt: order.createdAt || new Date().toISOString()
                    });
                }
            });
            console.log(`✅ Loaded from orders backup`);
        }
        
        // 5. LOAD PAYMENTS
        console.log('📥 Loading payments...');
        const paymentsSnapshot = await database.ref('payments').once('value');
        if (paymentsSnapshot.exists()) {
            paymentsSnapshot.forEach(child => {
                const payment = child.val();
                allOrders.push({
                    id: child.key,
                    type: 'payment',
                    orderId: payment.orderId,
                    buyerName: payment.buyerName,
                    buyerPhone: payment.buyerPhone,
                    total: payment.amount || 0,
                    status: payment.status || 'pending',
                    createdAt: payment.uploadedAt || payment.createdAt || new Date().toISOString(),
                    paymentProof: payment.imageUrl
                });
            });
            console.log(`✅ Loaded ${paymentsSnapshot.numChildren()} payments`);
        }
        
        // Sort by date (newest first)
        allOrders.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
        
        filteredOrders = [...allOrders];
        updateStats();
        renderTable();
        hideLoading();
        
        console.log(`🎉 Total orders loaded: ${allOrders.length}`);
        showToast(`Berhasil memuat ${allOrders.length} pesanan`, 'success');
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        showToast('Gagal memuat data: ' + error.message, 'error');
        hideLoading();
    }
}

// ========================================
// UPDATE STATISTICS
// ========================================
function updateStats() {
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || order.productPrice || 0), 0);
    const uniqueUsers = new Set(allOrders.map(order => order.buyerName || order.username || 'Guest')).size;
    
    document.getElementById('totalOrders').textContent = formatNumber(totalOrders);
    document.getElementById('totalRevenue').innerHTML = `Rp ${formatNumber(totalRevenue)}`;
    document.getElementById('totalUsers').textContent = formatNumber(uniqueUsers);
}

// ========================================
// FILTER FUNCTIONS
// ========================================
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let filtered = [...allOrders];
    
    // Filter by tab
    if (currentTab !== 'all') {
        if (currentTab === 'pending') {
            filtered = filtered.filter(order => 
                order.status === 'pending' || 
                order.status === 'pending_approval' || 
                order.status === 'paid' ||
                order.status === 'menunggu'
            );
        } else if (currentTab === 'done') {
            filtered = filtered.filter(order => 
                order.status === 'done' || 
                order.status === 'completed' || 
                order.status === 'aktif' ||
                order.status === 'success'
            );
        } else {
            filtered = filtered.filter(order => order.type === currentTab);
        }
    }
    
    // Filter by search
    if (searchTerm) {
        filtered = filtered.filter(order => 
            (order.buyerName || order.username || '').toLowerCase().includes(searchTerm) ||
            (order.id || order.orderId || '').toLowerCase().includes(searchTerm) ||
            (order.productName || '').toLowerCase().includes(searchTerm) ||
            (order.buyerPhone || '').includes(searchTerm)
        );
    }
    
    // Filter by date
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.createdAt || 0);
            return orderDate >= fromDate;
        });
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.createdAt || 0);
            return orderDate <= toDate;
        });
    }
    
    // Sort
    switch(sortBy) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            break;
        case 'highest':
            filtered.sort((a, b) => (b.total || b.productPrice || 0) - (a.total || a.productPrice || 0));
            break;
        case 'lowest':
            filtered.sort((a, b) => (a.total || a.productPrice || 0) - (b.total || b.productPrice || 0));
            break;
    }
    
    filteredOrders = filtered;
    currentPage = 1;
    renderTable();
}

// ========================================
// RENDER TABLE
// ========================================
function renderTable() {
    const tbody = document.getElementById('ordersTableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageOrders = filteredOrders.slice(startIndex, endIndex);
    
    if (pageOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-message">
                    <i class="fas fa-inbox"></i>
                    <p>Tidak ada data pesanan</p>
                </td>
            </tr>
        `;
        document.getElementById('pageInfo').textContent = `Halaman 0 dari 0`;
        document.getElementById('prevPageBtn').disabled = true;
        document.getElementById('nextPageBtn').disabled = true;
        return;
    }
    
    let html = '';
    pageOrders.forEach((order, index) => {
        const rowNumber = startIndex + index + 1;
        const totalAmount = order.total || order.productPrice || 0;
        let durasiText = order.durasi || order.duration || '-';
        if (durasiText !== '-' && !isNaN(durasiText)) {
            durasiText = `${durasiText} hari`;
        }
        const typeIcon = order.type === 'sewa' ? '🤖' : (order.type === 'script' ? '📜' : (order.type === 'panel' ? '🖥️' : '💳'));
        const typeText = order.type === 'sewa' ? 'Sewa Bot' : (order.type === 'script' ? 'Script' : (order.type === 'panel' ? 'Panel' : 'Payment'));
        
        html += `
            <tr>
                <td>${rowNumber}</td>
                <td>${formatDate(order.createdAt)}</td>
                <td><code style="font-size: 11px;">${(order.id || order.orderId || '').substring(0, 12)}...</code></td>
                <td><strong>${escapeHtml(order.buyerName || order.username || 'Guest')}</strong></td>
                <td>${order.buyerPhone || '-'}</td>
                <td>${escapeHtml(order.productName || (order.cart && order.cart[0]?.name) || '-')}</td>
                <td>${durasiText}</td>
                <td><strong style="color: #4facfe;">Rp ${formatNumber(totalAmount)}</strong></td>
                <td>${getStatusBadge(order.status)}</td>
                <td><span style="background: rgba(79,172,254,0.2); padding: 4px 8px; border-radius: 8px;">${typeIcon} ${typeText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="detail-btn" onclick="showDetail('${order.id || order.orderId}')">
                            <i class="fas fa-eye"></i> Detail
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    document.getElementById('pageInfo').textContent = `Halaman ${currentPage} dari ${totalPages}`;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
}

// ========================================
// SHOW DETAIL MODAL
// ========================================
function showDetail(orderId) {
    const order = allOrders.find(o => (o.id || o.orderId) === orderId);
    if (!order) {
        showToast('Data tidak ditemukan', 'error');
        return;
    }
    
    const modalBody = document.getElementById('modalBody');
    const cartItems = order.cart || [];
    let cartHtml = '';
    
    if (cartItems.length > 0) {
        cartHtml = `
            <div class="detail-item">
                <div class="detail-label"><i class="fas fa-shopping-cart"></i> Detail Produk</div>
                ${cartItems.map(item => `
                    <div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        📦 ${escapeHtml(item.name)} x${item.quantity} = Rp ${formatNumber(item.price * item.quantity)}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Panel info for panel orders
    let panelInfoHtml = '';
    if (order.type === 'panel' && order.panelInfo) {
        panelInfoHtml = `
            <div class="detail-item">
                <div class="detail-label"><i class="fas fa-server"></i> Info Panel</div>
                <div>🔗 Link: <a href="${order.panelInfo.panelUrl}" target="_blank">${order.panelInfo.panelUrl}</a></div>
                <div>👤 Username: ${escapeHtml(order.panelInfo.username)}</div>
                <div>🔑 Password: ${order.panelInfo.password || '●●●●●●●●'}</div>
                <div>🆔 Server ID: ${order.panelInfo.serverId || '-'}</div>
            </div>
        `;
    }
    
    const totalAmount = order.total || order.productPrice || 0;
    
    modalBody.innerHTML = `
        <div class="detail-item">
            <div class="detail-label"><i class="fas fa-hashtag"></i> Order ID</div>
            <div class="detail-value">${order.id || order.orderId}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label"><i class="fas fa-user"></i> Pembeli</div>
            <div class="detail-value">${escapeHtml(order.buyerName || order.username || 'Guest')}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label"><i class="fab fa-whatsapp"></i> No WhatsApp</div>
            <div class="detail-value">${order.buyerPhone || '-'}</div>
        </div>
        ${order.linkGroup ? `
        <div class="detail-item">
            <div class="detail-label"><i class="fab fa-whatsapp"></i> Link Grup</div>
            <div class="detail-value"><a href="${order.linkGroup}" target="_blank">${order.linkGroup}</a></div>
        </div>
        ` : ''}
        <div class="detail-item">
            <div class="detail-label"><i class="fas fa-tag"></i> Produk</div>
            <div class="detail-value">${escapeHtml(order.productName || (order.cart && order.cart[0]?.name) || '-')}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label"><i class="fas fa-clock"></i> Durasi</div>
            <div class="detail-value">${order.durasi || order.duration || '-'} hari</div>
        </div>
        ${cartHtml}
        <div class="detail-item">
            <div class="detail-label"><i class="fas fa-money-bill"></i> Total Harga</div>
            <div class="detail-value" style="color: #4facfe; font-size: 20px; font-weight: 700;">Rp ${formatNumber(totalAmount)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label"><i class="fas fa-calendar"></i> Tanggal Order</div>
            <div class="detail-value">${formatDate(order.createdAt)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label"><i class="fas fa-info-circle"></i> Status</div>
            <div class="detail-value">${getStatusBadge(order.status)}</div>
        </div>
        ${order.notes ? `
        <div class="detail-item">
            <div class="detail-label"><i class="fas fa-sticky-note"></i> Catatan</div>
            <div class="detail-value">${escapeHtml(order.notes)}</div>
        </div>
        ` : ''}
        ${panelInfoHtml}
        ${order.paymentProof ? `
        <div class="detail-item">
            <div class="detail-label"><i class="fas fa-image"></i> Bukti Pembayaran</div>
            <div class="detail-value"><a href="${order.paymentProof}" target="_blank">Lihat Bukti</a></div>
        </div>
        ` : ''}
    `;
    
    document.getElementById('detailModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// ========================================
// EXPORT TO CSV
// ========================================
function exportToExcel() {
    if (filteredOrders.length === 0) {
        showToast('Tidak ada data untuk diexport', 'error');
        return;
    }
    
    const headers = ['No', 'Tanggal Order', 'Order ID', 'Pembeli', 'No WhatsApp', 'Produk', 'Durasi', 'Total', 'Status', 'Tipe'];
    const rows = filteredOrders.map((order, index) => [
        index + 1,
        formatDate(order.createdAt),
        order.id || order.orderId,
        order.buyerName || order.username || 'Guest',
        order.buyerPhone || '-',
        order.productName || (order.cart && order.cart[0]?.name) || '-',
        order.durasi ? `${order.durasi} hari` : (order.duration || '-'),
        order.total || order.productPrice || 0,
        order.status,
        order.type === 'sewa' ? 'Sewa Bot' : (order.type === 'script' ? 'Script' : (order.type === 'panel' ? 'Panel' : 'Payment'))
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `histori_belanja_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Export berhasil!', 'success');
}

// ========================================
// RESET FILTERS
// ========================================
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('sortBy').value = 'newest';
    currentTab = 'all';
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === 'all') {
            btn.classList.add('active');
        }
    });
    
    applyFilters();
}

// ========================================
// EVENT LISTENERS
// ========================================
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('dateFrom').addEventListener('change', applyFilters);
document.getElementById('dateTo').addEventListener('change', applyFilters);
document.getElementById('sortBy').addEventListener('change', applyFilters);
document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
document.getElementById('exportBtn').addEventListener('click', exportToExcel);
document.getElementById('prevPageBtn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});
document.getElementById('nextPageBtn').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});

// Tab Event Listeners
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        applyFilters();
    });
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('detailModal');
    if (event.target === modal) {
        closeModal();
    }
};

// ========================================
// INITIALIZE
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Admin Histori Panel Started');
    console.log('📁 Menunggu Firebase Config dari firebase-config.js...');
    
    // Tunggu sebentar untuk memastikan database sudah terinisialisasi dari firebase-config.js
    setTimeout(() => {
        if (typeof database !== 'undefined') {
            console.log('✅ Database terdeteksi, memuat data...');
            loadAllOrders();
        } else {
            console.error('❌ Database tidak ditemukan! Pastikan firebase-config.js sudah di-load dengan benar.');
            showToast('Error: Firebase Config tidak ditemukan!', 'error');
            hideLoading();
        }
    }, 500);
});

// Make functions global for HTML onclick
window.showDetail = showDetail;
window.closeModal = closeModal;