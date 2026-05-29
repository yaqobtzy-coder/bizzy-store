let currentUserId = localStorage.getItem('userName') || 'Guest';

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast("✅ Data disalin!");
}

function showToast(msg) {
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = msg;
    toast.style.cssText = 'position:fixed; bottom:20px; left:20px; right:20px; background:#1a1a2e; padding:12px; border-radius:40px; text-align:center; z-index:2000; border-left:4px solid #4facfe;';
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
        'unli': 'UNLIMITED'
    };
    return ramMap[ram] || (ram ? ram.toUpperCase() : '1 GB');
}

async function loadUserPanels() {
    // CEK NAMA
    const userName = localStorage.getItem('userName');
    if (!userName || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    currentUserId = userName;
    
    showLoading();
    try {
        const snapshot = await database.ref('panel_orders').once('value');
        const panels = snapshot.val();
        const container = document.getElementById('panelList');

        if (!panels || Object.keys(panels).length === 0) {
            container.innerHTML = '<div class="empty-message"><i class="fas fa-inbox"></i><p>Anda belum memiliki panel hosting.</p><p>Silakan beli panel terlebih dahulu.</p><button class="btn-primary" onclick="window.location.href=\'buy-panel.html\'">Beli Panel Sekarang</button></div>';
            hideLoading();
            return;
        }

        let userPanels = [];
        for (const [id, panel] of Object.entries(panels)) {
            if (panel.username === currentUserId || panel.buyerName === currentUserId || panel.panelUsername === currentUserId) {
                userPanels.push({ id, ...panel });
            }
        }

        if (userPanels.length === 0) {
            container.innerHTML = '<div class="empty-message"><i class="fas fa-inbox"></i><p>Anda belum memiliki panel hosting.</p><button class="btn-primary" onclick="window.location.href=\'buy-panel.html\'">Beli Panel Sekarang</button></div>';
            hideLoading();
            return;
        }

        let html = '';
        for (const panel of userPanels) {
            const statusClass = panel.status === 'done' ? 'status-done' : (panel.status === 'paid' ? 'status-paid' : 'status-pending');
            const statusText = panel.status === 'done' ? '✅ AKTIF' : (panel.status === 'paid' ? '⏳ Diproses' : '⏳ Menunggu Bayar');
            const panelInfo = panel.panelInfo || {};
            const ramLabel = getRamLabel(panel.spec || panel.ram || '1gb');
            const cpu = panel.specData?.cpu || panel.cpu || '30';
            const disk = panel.specData?.disk || panel.disk || '2048';
            const diskGB = Math.floor(disk / 1024) + ' GB';

            html += `
                <div class="panel-card">
                    <div class="panel-title">📦 ${escapeHtml(panel.productName)}</div>
                    <div class="panel-info">
                        <span class="info-label">🆔 Order ID:</span>
                        <span class="info-value">${panel.id.substring(0, 12)}... <button class="copy-btn" onclick="copyToClipboard('${panel.id}')">Salin</button></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">💻 Spesifikasi:</span>
                        <span class="info-value">${ramLabel} RAM | ${cpu}% CPU | ${diskGB} Disk</span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">💰 Harga:</span>
                        <span class="info-value">Rp ${(panel.productPrice || 0).toLocaleString()}</span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">📅 Tanggal Order:</span>
                        <span class="info-value">${new Date(panel.createdAt || panel.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">📊 Status:</span>
                        <span class="info-value"><span class="status-badge ${statusClass}">${statusText}</span></span>
                    </div>
            `;

            if (panel.status === 'done' && panelInfo.panelUrl) {
                html += `
                    <hr style="margin: 15px 0; border-color: rgba(79,172,254,0.2);">
                    <div class="panel-title" style="color:#28a745;"><i class="fas fa-check-circle"></i> Data Panel Anda</div>
                    <div class="panel-info">
                        <span class="info-label">🔗 Link Panel:</span>
                        <span class="info-value">${escapeHtml(panelInfo.panelUrl)} <button class="copy-btn" onclick="copyToClipboard('${panelInfo.panelUrl}')">Salin</button> <a href="${panelInfo.panelUrl}" target="_blank" style="color:#4facfe;"><i class="fas fa-external-link-alt"></i></a></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">👤 Username:</span>
                        <span class="info-value">${escapeHtml(panelInfo.username || panel.panelUsername)} <button class="copy-btn" onclick="copyToClipboard('${panelInfo.username || panel.panelUsername}')">Salin</button></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">🔑 Password:</span>
                        <span class="info-value">${escapeHtml(panelInfo.password || '●●●●●●●●')} <button class="copy-btn" onclick="copyToClipboard('${panelInfo.password || panel.panelPassword}')">Salin</button></span>
                    </div>
                    <div class="panel-info">
                        <span class="info-label">🆔 Server ID:</span>
                        <span class="info-value">${escapeHtml(panelInfo.serverId || '-')}</span>
                    </div>
                `;
            } else if (panel.status === 'paid') {
                html += `
                    <hr style="margin: 15px 0; border-color: rgba(79,172,254,0.2);">
                    <div class="info-value" style="text-align:center; color:#ffc107;"><i class="fas fa-spinner fa-pulse"></i> Panel sedang diproses oleh sistem.</div>
                    <div class="info-value" style="text-align:center; font-size:12px; color:#888;">Data panel akan muncul setelah selesai dibuat (biasanya 1-5 menit)</div>
                `;
            }

            html += `</div>`;
        }

        container.innerHTML = html;
        hideLoading();
    } catch (error) {
        console.error('Error loading panels:', error);
        document.getElementById('panelList').innerHTML = '<div class="empty-message">Gagal memuat data panel. Coba lagi nanti.</div>';
        hideLoading();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

window.copyToClipboard = copyToClipboard;
loadUserPanels();