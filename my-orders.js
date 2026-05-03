import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase, ref, get, onValue } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBUHSGJ2Yaet7ue1x8WLcHn6LI627SINqg",
    authDomain: "rayy-digital-store.firebaseapp.com",
    databaseURL: "https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rayy-digital-store",
    storageBucket: "rayy-digital-store.firebasestorage.app",
    messagingSenderId: "537690791174",
    appId: "1:537690791174:web:c29f7cdfcae0506b6e1287"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function loadCustomTheme() {
    const themeRef = ref(db, 'bizzy_settings/theme');
    const snapshot = await get(themeRef);
    const theme = snapshot.val();
    if (theme) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.primaryColor || '#1e88e5');
        root.style.setProperty('--primary-dark', theme.primaryDark || '#0d47a1');
        root.style.setProperty('--primary-light', theme.primaryLight || '#42a5f5');
        root.style.setProperty('--accent-color', theme.accentColor || '#ffd700');
        root.style.setProperty('--accent-dark', theme.accentDark || '#ff8c00');
    }
}

async function loadBotStatus() {
    const botConfigRef = ref(db, 'bizzy_settings/bot_config');
    const snapshot = await get(botConfigRef);
    const config = snapshot.val();
    const dot = document.getElementById('botStatusDot');
    const text = document.getElementById('botStatusText');
    
    if (config && config.online) {
        dot.className = 'status-dot online';
        text.innerHTML = '<i class="fab fa-telegram"></i> Bot Online';
    } else {
        dot.className = 'status-dot offline';
        text.innerHTML = '<i class="fab fa-telegram"></i> Bot Offline';
    }
}

let currentUserId = localStorage.getItem("bizzy_userId");
let currentUsername = localStorage.getItem("bizzy_username");
let refreshInterval = null;

function showLoading() { document.getElementById('loadingOverlay').classList.add('show'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('show'); }

function showToast(msg) {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function copyCommand(command) {
    navigator.clipboard.writeText(command);
    showToast(`✅ Command ${command} disalin! Gunakan di @BizzyImpactBot`);
}

function openBot() {
    window.open('https://t.me/BizzyImpactBot', '_blank');
}

function getStatusBadge(status) {
    switch(status) {
        case 'pending': return '<span class="status-badge status-pending">⏳ MENUNGGU KONFIRMASI</span>';
        case 'processing': return '<span class="status-badge status-processing">⚙️ SEDANG DI PROSES</span>';
        case 'completed': return '<span class="status-badge status-completed">✅ SELESAI</span>';
        case 'cancelled': return '<span class="status-badge status-cancelled">❌ DIBATALKAN</span>';
        default: return '<span class="status-badge status-pending">⏳ PENDING</span>';
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'pending': return 'pending';
        case 'processing': return 'processing';
        case 'completed': return 'completed';
        case 'cancelled': return 'cancelled';
        default: return 'pending';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Menunggu Konfirmasi Admin';
        case 'processing': return 'Sedang Dikerjakan oleh Admin';
        case 'completed': return 'Pesanan Selesai! Terima kasih 🙏';
        case 'cancelled': return 'Pesanan Dibatalkan';
        default: return 'Menunggu Konfirmasi';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

async function loadOrders() {
    if (!currentUserId) {
        document.getElementById('ordersList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <p>Silakan login terlebih dahulu untuk melihat pesanan Anda</p>
                <button class="btn-secondary" onclick="window.location.href='index.html'">Login Sekarang</button>
            </div>
        `;
        return;
    }

    showLoading();
    try {
        const ordersRef = ref(db, 'bizzy_orders');
        const snapshot = await get(ordersRef);
        const orders = snapshot.val();

        if (!orders) {
            document.getElementById('ordersList').innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Belum ada pesanan</p><button class="btn-secondary" onclick="window.location.href='index.html'">Order Sekarang</button></div>`;
            hideLoading();
            return;
        }

        const userOrders = Object.entries(orders).filter(([id, order]) => order.userId === currentUserId).sort((a,b) => new Date(b[1].createdAt) - new Date(a[1].createdAt));

        if (userOrders.length === 0) {
            document.getElementById('ordersList').innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Belum ada pesanan</p><button class="btn-secondary" onclick="window.location.href='index.html'">Order Sekarang</button></div>`;
            hideLoading();
            return;
        }

        let html = '';
        for (const [id, order] of userOrders) {
            const statusClass = getStatusClass(order.status);
            const statusBadge = getStatusBadge(order.status);
            const statusText = getStatusText(order.status);
            
            let queueHtml = '';
            if (order.queueNumber) {
                queueHtml = `<span class="queue-badge-small"><i class="fas fa-hourglass-half"></i> Antrian ke-${order.queueNumber}</span>`;
            }
            
            html += `
                <div class="order-card ${statusClass}">
                    <div class="order-header">
                        <span class="order-product"><i class="fas fa-gamepad"></i> ${escapeHtml(order.productName)}</span>
                        <div style="display: flex; gap: 8px; align-items: center;">${queueHtml}${statusBadge}</div>
                    </div>
                    <div class="order-details">
                        <p><span class="label">📅 Tanggal Order:</span> <span class="value">${new Date(order.createdAt).toLocaleString()}</span></p>
                        <p><span class="label">💰 Total Bayar:</span> <span class="value">Rp ${order.productPrice?.toLocaleString() || 0}</span></p>
                        <p><span class="label">🆔 ID Transaksi:</span> <span class="value history-id">${order.transactionId || '-'}</span></p>
                        <p><span class="label">📱 WhatsApp:</span> <span class="value">${escapeHtml(order.phoneNumber || '-')}</span></p>
                        <p><span class="label">📊 Status:</span> <span class="value">${statusText}</span></p>
                        ${order.proofLink ? `<p><span class="label">🔗 Bukti Transfer:</span> <span class="value"><a href="${escapeHtml(order.proofLink)}" target="_blank" style="color:var(--primary-color);">Lihat Bukti</a></span></p>` : ''}
                        ${order.processedBy ? `<p><span class="label">👨‍💼 Diproses oleh:</span> <span class="value">${escapeHtml(order.processedBy)}</span></p>` : ''}
                    </div>
                </div>
            `;
        }
        document.getElementById('ordersList').innerHTML = html;
    } catch (error) {
        console.error("Error loading orders:", error);
        document.getElementById('ordersList').innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat pesanan</p><button class="btn-secondary" onclick="location.reload()">Coba Lagi</button></div>`;
    } finally {
        hideLoading();
    }
}

function manualRefresh() { 
    showToast("🔄 Memuat ulang data..."); 
    loadOrders(); 
}

function goBack() { 
    window.location.href = 'index.html'; 
}

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => { 
        if (currentUserId) loadOrders(); 
    }, 10000);
}

if (!currentUserId || !currentUsername) {
    document.getElementById('ordersList').innerHTML = `<div class="empty-state"><i class="fas fa-lock"></i><p>Silakan login terlebih dahulu</p><button class="btn-secondary" onclick="window.location.href='index.html'">Login Sekarang</button></div>`;
} else {
    loadOrders();
    startAutoRefresh();
}

await loadCustomTheme();
await loadBotStatus();

window.goBack = goBack;
window.manualRefresh = manualRefresh;
window.copyCommand = copyCommand;
window.openBot = openBot;