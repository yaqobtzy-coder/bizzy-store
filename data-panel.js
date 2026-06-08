// ========================================
// PANEL DATA - RAYY STORE
// Menampilkan data panel yang sudah dipesan user
// Data diambil dari Firebase (panel_orders & sewa_orders)
// ========================================

let currentUserId = localStorage.getItem('userName') || 'Guest';

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("✅ Data disalin!");
}

function showToast(msg) {
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = msg;
    toast.style.cssText = 'position:fixed; bottom:20px; left:20px; right:20px; background:#1a1a2e; padding:12px; border-radius:40px; text-align:center; z-index:2000; border-left:4px solid #4facfe; color:white;';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getRamLabel(ram) {
    const ramMap = {
        '1gb': '1 GB', '2gb': '2 GB', '3gb': '3 GB', '4gb': '4 GB',
        '5gb': '5 GB', '6gb': '6 GB', '7gb': '7 GB', '8gb': '8 GB',
        '9gb': '9 GB', '10gb': '10 GB', '11gb': '11 GB', '12gb': '12 GB',
        '13gb': '13 GB', '14gb': '14 GB', '15gb': '15 GB', '16gb': '16 GB',
        '17gb': '17 GB', '18gb': '18 GB', '19gb': '19 GB', '20gb': '20 GB',
        'unli': '♾️ UNLIMITED'
    };
    return ramMap[ram] || (ram ? ram.toUpperCase() : '1 GB');
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

async function loadUserPanels() {
    console.log('🚀 loadUserPanels() dipanggil');
    
    // CEK NAMA USER
    const userName = localStorage.getItem('userName');
    console.log('👤 UserName dari localStorage:', userName);
    
    if (!userName || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    currentUserId = userName;
    
    showLoading();
    
    try {
        // AMBIL DATA DARI panel_orders
        console.log('🔍 Mengambil data dari panel_orders...');
        const panelSnapshot = await database.ref('panel_orders').once('value');
        const panelOrders = panelSnapshot.val();
        
        // AMBIL DATA DARI sewa_orders (kadang panel tersimpan di sini juga)
        console.log('🔍 Mengambil data dari sewa_orders...');
        const sewaSnapshot = await database.ref('sewa_orders').once('value');
        const sewaOrders = sewaSnapshot.val();
        
        const container = document.getElementById('panelList');
        let userPanels = [];
        
        // Proses dari panel_orders
        if (panelOrders && Object.keys(panelOrders).length > 0) {
            for (const [id, panel] of Object.entries(panelOrders)) {
                console.log(`📋 Cek panel_orders ID: ${id}`, panel);
                
                // Cek apakah panel milik user ini
                const isUserPanel = (
                    (panel.buyerName === currentUserId) ||
                    (panel.panelUsername === currentUserId) ||
                    (panel.username === currentUserId) ||
                    (panel.buyerName && panel.buyerName.toLowerCase() === currentUserId.toLowerCase()) ||
                    (panel.panelUsername && panel.panelUsername.toLowerCase() === currentUserId.toLowerCase())
                );
                
                if (isUserPanel) {
                    console.log(`✅ Panel milik user (panel_orders): ${id}`);
                    userPanels.push({ 
                        id: id, 
                        source: 'panel_orders',
                        ...panel 
                    });
                }
            }
        }
        
        // Proses dari sewa_orders (type panel)
        if (sewaOrders && Object.keys(sewaOrders).length > 0) {
            for (const [id, order] of Object.entries(sewaOrders)) {
                if (order.type === 'panel') {
                    console.log(`📋 Cek sewa_orders ID: ${id} (type panel)`, order);
                    
                    const isUserOrder = (
                        (order.buyerName === currentUserId) ||
                        (order.panelUsername === currentUserId) ||
                        (order.username === currentUserId) ||
                        (order.buyerName && order.buyerName.toLowerCase() === currentUserId.toLowerCase()) ||
                        (order.panelUsername && order.panelUsername.toLowerCase() === currentUserId.toLowerCase())
                    );
                    
                    if (isUserOrder) {
                        console.log(`✅ Panel milik user (sewa_orders): ${id}`);
                        userPanels.push({ 
                            id: id, 
                            source: 'sewa_orders',
                            ...order 
                        });
                    }
                }
            }
        }
        
        console.log(`📊 Total panel milik ${currentUserId}: ${userPanels.length}`);
        
        if (userPanels.length === 0) {
            container.innerHTML = '<div class="empty-message"><i class="fas fa-inbox"></i><p>Anda belum memiliki panel hosting.</p><button class="btn-primary" onclick="window.location.href=\'buy-panel.html\'">Beli Panel Sekarang</button></div>';
            hideLoading();
            return;
        }
        
        // Urutkan dari yang terbaru
        userPanels.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.timestamp || 0);
            return dateB - dateA;
        });
        
        let html = '';
        for (const panel of userPanels) {
            console.log('🎨 Render panel:', panel);
            
            const statusClass = panel.status === 'done' ? 'status-done' : (panel.status === 'paid' ? 'status-paid' : 'status-pending');
            const statusText = panel.status === 'done' ? '✅ AKTIF' : (panel.status === 'paid' ? '⏳ Diproses' : '⏳ Menunggu');
            
            // Data panel (dari Firebase, bukan dari API)
            const panelUrl = panel.panelUrl || panel.panel_url || '-';
            const panelUsername = panel.panelUsernameResult || panel.panel_username || panel.panelUsername || panel.username || '-';
            const panelPassword = panel.panelPasswordResult || panel.panel_password || panel.panelPassword || '-';
            const serverId = panel.serverId || panel.server_id || '-';
            
            const ramLabel = getRamLabel(panel.ram || 'unli');
            const cpuValue = (panel.cpu === 0 || panel.cpu === '0') ? 'UNLIMITED' : (panel.cpu || '0');
            const diskValue = (panel.disk === 0 || panel.disk === '0') ? 'UNLIMITED' : (panel.disk ? Math.floor(panel.disk / 1024) + ' GB' : 'UNLIMITED');
            const productPrice = panel.productPrice || panel.price || 15000;
            const orderId = panel.orderId || panel.id;
            const createdAt = panel.createdAt || panel.timestamp || panel.paidAt || Date.now();
            
            html += `
                <div class="panel-card">
                    <div class="panel-title">📦 ${escapeHtml(panel.productName || 'Panel UNLIMITED')}</div>
                    <div class="panel-info">
                        <span class="info-label">🆔 Order ID:</span>
                        <span class="info-value">${orderId.substring(0, 12)}... <button class="copy-btn" onclick="copyToClipboard('${orderId}')">Salin</button></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">💻 Spesifikasi:</span>
                        <span class="info-value">${ramLabel} RAM | CPU ${cpuValue}% | Disk ${diskValue}</span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">💰 Harga:</span>
                        <span class="info-value">Rp ${productPrice.toLocaleString()}</span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">📅 Tanggal Order:</span>
                        <span class="info-value">${new Date(createdAt).toLocaleString()}</span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">📊 Status:</span>
                        <span class="info-value"><span class="status-badge ${statusClass}">${statusText}</span></span>
                    </div>
            `;

            if (panel.status === 'done') {
                html += `
                    <hr style="margin: 15px 0; border-color: #e2e8f0;">
                    <div class="panel-title" style="color:#16a34a;"><i class="fas fa-check-circle"></i> Data Panel Anda</div>
                    <div class="panel-info">
                        <span class="info-label">🔗 Link Panel:</span>
                        <span class="info-value">${escapeHtml(panelUrl)} <button class="copy-btn" onclick="copyToClipboard('${panelUrl}')">Salin</button> <a href="${panelUrl}" target="_blank" style="color:#3b82f6;"><i class="fas fa-external-link-alt"></i></a></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">👤 Username:</span>
                        <span class="info-value">${escapeHtml(panelUsername)} <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(panelUsername)}')">Salin</button></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">🔑 Password:</span>
                        <span class="info-value">${escapeHtml(panelPassword) || '●●●●●●●●'} <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(panelPassword)}')">Salin</button></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">🆔 Server ID:</span>
                        <span class="info-value">${escapeHtml(serverId)}</span>
                    </div>
                `;
            } else if (panel.status === 'pending' || panel.status === 'pending_approval') {
                html += `
                    <hr style="margin: 15px 0; border-color: #e2e8f0;">
                    <div class="info-value" style="text-align:center; color:#d97706; padding:10px;">
                        <i class="fas fa-spinner fa-pulse"></i> Panel sedang diproses oleh sistem.
                    </div>
                    <div class="info-value" style="text-align:center; font-size:12px; color:#94a3b8;">
                        Data panel akan muncul setelah selesai dibuat (biasanya 1-3 menit)
                    </div>
                `;
            }

            html += `</div>`;
        }

        container.innerHTML = html;
        hideLoading();
        
    } catch (error) {
        console.error('❌ Error loading panels:', error);
        const container = document.getElementById('panelList');
        if (container) {
            container.innerHTML = '<div class="empty-message">Gagal memuat data panel. Coba lagi nanti.<br><small style="color:#ef4444;">' + error.message + '</small></div>';
        }
        hideLoading();
    }
}

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Halaman panel-data.html dimuat');
    loadUserPanels();
});

// Export ke global
window.copyToClipboard = copyToClipboard;