// ========================================
// PANEL DATA - RAYY STORE (FIX UNLIMITED)
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
    setTimeout(() => toast.remove(), 3000);
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
    console.log('👤 UserName:', userName);
    
    if (!userName || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    currentUserId = userName;
    
    showLoading();
    
    try {
        // Ambil dari panel_orders
        console.log('🔍 Mengambil data dari panel_orders...');
        const snapshot = await database.ref('panel_orders').once('value');
        const panels = snapshot.val();
        const container = document.getElementById('panelList');

        console.log('📦 Data panels:', panels);

        if (!panels || Object.keys(panels).length === 0) {
            console.log('❌ Tidak ada data panel');
            container.innerHTML = '<div class="empty-message"><i class="fas fa-inbox"></i><p>Anda belum memiliki panel hosting.</p><p>Silakan beli panel terlebih dahulu.</p><button class="btn-primary" onclick="window.location.href=\'buy-panel.html\'">Beli Panel Sekarang</button></div>';
            hideLoading();
            return;
        }

        // Filter panel milik user
        let userPanels = [];
        for (const [id, panel] of Object.entries(panels)) {
            console.log(`📋 Cek panel ID: ${id}`, panel);
            
            const isUserPanel = (
                panel.buyerName === currentUserId ||
                panel.panelUsername === currentUserId ||
                panel.username === currentUserId ||
                (panel.buyerName && panel.buyerName.toLowerCase() === currentUserId.toLowerCase()) ||
                (panel.panelUsername && panel.panelUsername.toLowerCase() === currentUserId.toLowerCase())
            );
            
            if (isUserPanel) {
                console.log(`✅ Panel milik user: ${id}`);
                userPanels.push({ id, ...panel });
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
            
            // Tentukan status
            let statusClass = 'status-pending';
            let statusText = '⏳ Menunggu';
            
            if (panel.status === 'done') {
                statusClass = 'status-done';
                statusText = '✅ AKTIF';
            } else if (panel.status === 'paid') {
                statusClass = 'status-paid';
                statusText = '⏳ Diproses';
            } else if (panel.status === 'pending') {
                statusClass = 'status-pending';
                statusText = '⏳ Menunggu';
            }
            
            // Handle spesifikasi UNLIMITED
            const isUnlimited = (panel.ram === 'unli' || panel.ramSize === 0 || panel.ramLabel === 'UNLIMITED');
            
            let ramLabel = getRamLabel(panel.ram || panel.spec || 'unli');
            let cpuDisplay = panel.cpu || panel.specData?.cpu || '30';
            let diskDisplay = panel.disk || panel.specData?.disk || '2048';
            
            // Jika unlimited, tampilkan UNLIMITED
            if (isUnlimited || panel.ram === 'unli') {
                ramLabel = '♾️ UNLIMITED';
                cpuDisplay = 'UNLIMITED';
                diskDisplay = 'UNLIMITED';
            } else {
                // Konversi disk dari MB ke GB
                if (diskDisplay !== 'UNLIMITED' && !isNaN(diskDisplay)) {
                    diskDisplay = Math.floor(diskDisplay / 1024) + ' GB';
                }
                cpuDisplay = cpuDisplay + '%';
            }
            
            const orderIdDisplay = panel.orderId || panel.id;
            const productPrice = panel.productPrice || panel.price || 15000;
            const createdAt = panel.createdAt || panel.timestamp || Date.now();
            
            // Data panel dari hasil bot (jika status done)
            const panelInfo = panel.panelInfo || {};
            const panelUrl = panelInfo.panelUrl || panel.panelUrl || 
                            (panel.status === 'done' ? 'https://igabakar.sano.biz.id' : '#');
            const panelUsername = panelInfo.username || panel.panelUsername || panel.panelUsernameResult || '-';
            const panelPassword = panelInfo.password || panel.panelPassword || panel.panelPasswordResult || '●●●●●●●●';
            const serverId = panelInfo.serverId || panel.serverId || '-';

            html += `
                <div class="panel-card">
                    <div class="panel-title">📦 ${escapeHtml(panel.productName || 'Panel UNLIMITED')}</div>
                    <div class="panel-info">
                        <span class="info-label">🆔 Order ID:</span>
                        <span class="info-value">${orderIdDisplay.substring(0, 12)}... <button class="copy-btn" onclick="copyToClipboard('${orderIdDisplay}')">Salin</button></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">💻 Spesifikasi:</span>
                        <span class="info-value">${ramLabel} RAM | CPU ${cpuDisplay} | Disk ${diskDisplay}</span>
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

            // Jika status DONE, tampilkan data panel
            if (panel.status === 'done') {
                html += `
                    <hr style="margin: 15px 0; border-color: rgba(79,172,254,0.2);">
                    <div class="panel-title" style="color:#28a745;"><i class="fas fa-check-circle"></i> Data Panel Anda</div>
                    <div class="panel-info">
                        <span class="info-label">🔗 Link Panel:</span>
                        <span class="info-value">${escapeHtml(panelUrl)} <button class="copy-btn" onclick="copyToClipboard('${panelUrl}')">Salin</button> <a href="${panelUrl}" target="_blank" style="color:#4facfe;"><i class="fas fa-external-link-alt"></i></a></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">👤 Username:</span>
                        <span class="info-value">${escapeHtml(panelUsername)} <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(panelUsername)}')">Salin</button></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">🔑 Password:</span>
                        <span class="info-value">${escapeHtml(panelPassword)} <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(panelPassword)}')">Salin</button></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">🆔 Server ID:</span>
                        <span class="info-value">${escapeHtml(serverId)}</span>
                    </div>
                `;
            } 
            // Jika status PAID atau PENDING, tampilkan loading
            else if (panel.status === 'paid' || panel.status === 'pending') {
                html += `
                    <hr style="margin: 15px 0; border-color: rgba(79,172,254,0.2);">
                    <div class="info-value" style="text-align:center; color:#ffc107; padding:10px;">
                        <i class="fas fa-spinner fa-pulse"></i> Panel sedang diproses oleh sistem.
                    </div>
                    <div class="info-value" style="text-align:center; font-size:12px; color:#888;">
                        Data panel akan muncul setelah selesai dibuat (biasanya 1-5 menit)
                    </div>
                    <div class="info-value" style="text-align:center; font-size:11px; color:#4facfe; margin-top:5px;">
                        <button class="refresh-btn" onclick="loadUserPanels()" style="background:rgba(79,172,254,0.2); border:none; padding:5px 15px; border-radius:20px; color:#4facfe; cursor:pointer;">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
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
window.loadUserPanels = loadUserPanels;