import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

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

let lastOrder = null;
let adminNumber = '6281772352832';

function copyCommand(command) {
    navigator.clipboard.writeText(command);
    showToastCustom(`✅ Command ${command} disalin! Gunakan di @BizzyImpactBot`);
}

function showToastCustom(msg) {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function loadData() {
    const orderData = localStorage.getItem('bizzy_last_order');
    if (orderData) {
        lastOrder = JSON.parse(orderData);
        document.getElementById('detailProduct').innerText = lastOrder.productName || '-';
        document.getElementById('detailAmount').innerText = 'Rp ' + (lastOrder.productPrice || 0).toLocaleString();
        document.getElementById('detailTransactionId').innerText = lastOrder.transactionId || '-';
        document.getElementById('detailDate').innerText = formatDate(lastOrder.createdAt);
        document.getElementById('detailQueue').innerText = lastOrder.queueNumber || '-';
        if (lastOrder.adminTarget) adminNumber = lastOrder.adminTarget;
    } else {
        const product = localStorage.getItem('bizzy_order_product');
        const price = localStorage.getItem('bizzy_order_price');
        if (product && price) {
            document.getElementById('detailProduct').innerText = product;
            document.getElementById('detailAmount').innerText = 'Rp ' + parseInt(price).toLocaleString();
            document.getElementById('detailDate').innerText = formatDate(new Date());
        }
    }
}

document.getElementById('confirmBtn').addEventListener('click', () => {
    const product = document.getElementById('detailProduct').innerText;
    const amount = document.getElementById('detailAmount').innerText;
    const transId = document.getElementById('detailTransactionId').innerText;
    const queue = document.getElementById('detailQueue').innerText;
    
    const message = `Halo Admin Bizzy Impact, saya ingin konfirmasi pesanan saya:

📦 Produk: ${product}
💰 Total: ${amount}
🆔 ID Transaksi: ${transId}
🎫 Antrian: ${queue}

Mohon segera diproses. Terima kasih.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${adminNumber}?text=${encodedMessage}`, '_blank');
});

document.getElementById('botBtn').addEventListener('click', () => {
    window.open('https://t.me/BizzyImpactBot', '_blank');
});

function goToHome() {
    localStorage.removeItem('bizzy_last_order');
    localStorage.removeItem('bizzy_order_product');
    localStorage.removeItem('bizzy_order_price');
    window.location.href = 'index.html';
}

let seconds = 10;
const countdownArea = document.getElementById('countdownArea');
const interval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
        clearInterval(interval);
        goToHome();
    } else {
        countdownArea.innerHTML = `⏰ Akan diarahkan ke beranda dalam ${seconds} detik...`;
    }
}, 1000);

await loadCustomTheme();
await loadBotStatus();
loadData();

window.goToHome = goToHome;
window.copyCommand = copyCommand;