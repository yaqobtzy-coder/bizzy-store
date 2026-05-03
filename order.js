import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase, ref, get, set, push, update } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

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

const ZAKI_API_URL = 'https://qris.zakki.store/topup';
const ZAKI_CHECK_URL = 'https://qris.zakki.store/cektopup';
const ZAKI_TOKEN = 'c7f15169bcfd61';

let orderData = null;
let selectedMethod = 'hoyoverse';
let pendingTransaction = null;
let checkInterval = null;
let currentQueueNumber = 0;

let currentUserId = localStorage.getItem("bizzy_userId");
let currentUsername = localStorage.getItem("bizzy_username");

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

function showLoading() { document.getElementById("loadingOverlay").classList.add("show"); }
function hideLoading() { document.getElementById("loadingOverlay").classList.remove("show"); }

async function loadQueueNumber() {
    const ordersRef = ref(db, 'bizzy_orders');
    const snapshot = await get(ordersRef);
    const orders = snapshot.val();
    let pendingCount = 0;
    if (orders) {
        pendingCount = Object.values(orders).filter(o => o.status === 'pending' || o.status === 'processing').length;
    }
    currentQueueNumber = pendingCount + 1;
    document.getElementById('currentQueue').innerText = currentQueueNumber;
    return currentQueueNumber;
}

function loadData() {
    const product = localStorage.getItem('bizzy_order_product');
    const price = localStorage.getItem('bizzy_order_price');
    const username = localStorage.getItem('bizzy_username');
    const userId = localStorage.getItem('bizzy_userId');

    if (!product || !price) {
        showToast("Data pesanan tidak ditemukan!");
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        return;
    }

    currentUserId = userId;
    currentUsername = username;

    orderData = {
        productName: product,
        productPrice: parseInt(price),
        username: username,
        userId: userId
    };

    document.getElementById('productName').innerText = product;
    document.getElementById('productPrice').innerText = 'Rp ' + parseInt(price).toLocaleString();
}

document.querySelectorAll('.login-method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.login-method-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMethod = btn.getAttribute('data-method');
    });
});

async function createPayment() {
    showLoading();
    try {
        const response = await fetch(ZAKI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: ZAKI_TOKEN, nominal: orderData.productPrice })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.code === 201 && result.status === "success") {
            pendingTransaction = result.data;
            
            document.getElementById('qrisImage').src = pendingTransaction.qris_image;
            document.getElementById('transaksiId').innerText = pendingTransaction.id_transaksi;
            document.getElementById('totalBayar').innerHTML = `Rp ${pendingTransaction.rincian.total_bayar.toLocaleString()}`;
            document.getElementById('paymentProduct').innerText = orderData.productName;
            document.getElementById('paymentModal').classList.add('active');
            
            startAutoCheck();
            
            if (pendingTransaction.expired_at) {
                startCountdown(new Date(pendingTransaction.expired_at));
            }
        } else {
            showToast("Gagal membuat QRIS: " + (result.message || "Silakan coba lagi"));
        }
    } catch (error) {
        hideLoading();
        showToast("Error koneksi ke payment gateway!");
    }
}

function startAutoCheck() {
    if (checkInterval) clearInterval(checkInterval);
    let checkCount = 0;
    checkInterval = setInterval(async () => {
        checkCount++;
        if (checkCount > 30 || !pendingTransaction) {
            clearInterval(checkInterval);
            return;
        }
        await autoCheckStatus();
    }, 5000);
}

async function autoCheckStatus() {
    if (!pendingTransaction || !pendingTransaction.id_transaksi) return;
    try {
        const response = await fetch(`${ZAKI_CHECK_URL}?idtopup=${pendingTransaction.id_transaksi}`);
        const result = await response.json();
        if (result.code === 200 && result.kategori_status === "SUCCESS") {
            clearInterval(checkInterval);
            await processSuccess();
        }
    } catch (error) { console.error("Auto check error:", error); }
}

async function checkPaymentStatus() {
    if (!pendingTransaction || !pendingTransaction.id_transaksi) {
        showToast("Tidak ada transaksi pending!");
        return;
    }
    showLoading();
    try {
        const response = await fetch(`${ZAKI_CHECK_URL}?idtopup=${pendingTransaction.id_transaksi}`);
        const result = await response.json();
        hideLoading();
        if (result.code === 200 && result.kategori_status === "SUCCESS") {
            clearInterval(checkInterval);
            await processSuccess();
        } else if (result.kategori_status === "PENDING") {
            showToast("⏳ Pembayaran masih pending. Silakan selesaikan pembayaran.");
        } else {
            showToast("❌ Pembayaran belum terdeteksi. Silakan scan QRIS dan bayar.");
        }
    } catch (error) {
        hideLoading();
        showToast("Error mengecek status pembayaran!");
    }
}

async function notifyBotNewOrder(order) {
    try {
        await push(ref(db, 'bizzy_bot_notifications'), {
            type: 'new_order',
            orderId: order.orderId,
            username: order.username,
            product: order.productName,
            amount: order.productPrice,
            queueNumber: order.queueNumber,
            phoneNumber: order.phoneNumber,
            timestamp: Date.now(),
            sent: false
        });
        console.log('📢 Notifikasi order baru dikirim ke bot');

        await fetch(`https://api.telegram.org/bot8115235461:AAE7JxztTGtd_GtaMwa4eT3SEfHQL0mwhtY/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: '7966336512',
                text: `🆕 *PESANAN BARU DI WEB!*\n\n👤 User: ${order.username}\n📦 Produk: ${order.productName}\n💰 Harga: Rp ${order.productPrice.toLocaleString()}\n📱 WA: ${order.phoneNumber}\n🎫 Antrian: ${order.queueNumber}\n\nGunakan /ambil_data ${order.username} di bot untuk detail.`,
                parse_mode: 'Markdown'
            })
        }).catch(e => console.log('Gagal kirim ke BOT1:', e));
        
        await fetch(`https://api.telegram.org/bot8607918530:AAGylETleFSZJctKLOLt_bq7wzQuoVqxcEs/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: '5484019887',
                text: `🆕 *PESANAN BARU DI WEB!*\n\n👤 User: ${order.username}\n📦 Produk: ${order.productName}\n💰 Harga: Rp ${order.productPrice.toLocaleString()}\n📱 WA: ${order.phoneNumber}\n🎫 Antrian: ${order.queueNumber}\n\nGunakan /ambil_data ${order.username} di bot untuk detail.`,
                parse_mode: 'Markdown'
            })
        }).catch(e => console.log('Gagal kirim ke BOT2:', e));
    } catch(e) {
        console.log('Gagal kirim notifikasi ke bot:', e);
    }
}

async function processSuccess() {
    const queueNumber = currentQueueNumber;
    const loginEmail = document.getElementById('loginEmail').value.trim();
    const loginPassword = document.getElementById('loginPassword').value;
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const adminSelect = document.getElementById('adminSelect').value;
    const proofLink = document.getElementById('proofLink').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!loginEmail) { showToast("Masukkan Email/Username!"); return; }
    if (!loginPassword) { showToast("Masukkan Password!"); return; }
    if (!phoneNumber) { showToast("Masukkan Nomor Telepon!"); return; }
    if (!proofLink) { showToast("Masukkan Link Bukti Transfer!"); return; }

    const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    const order = {
        orderId: orderId,
        userId: orderData.userId,
        username: orderData.username,
        productName: orderData.productName,
        productPrice: orderData.productPrice,
        transactionId: pendingTransaction.id_transaksi,
        paymentAmount: pendingTransaction.rincian.total_bayar,
        loginMethod: selectedMethod,
        loginEmail: loginEmail,
        loginPassword: loginPassword,
        phoneNumber: phoneNumber,
        adminTarget: adminSelect,
        proofLink: proofLink,
        notes: notes,
        queueNumber: queueNumber,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await push(ref(db, 'bizzy_orders'), order);
    
    await notifyBotNewOrder(order);

    localStorage.setItem('bizzy_last_order', JSON.stringify(order));
    document.getElementById('paymentModal').classList.remove('active');
    window.location.href = 'success.html';
}

function startCountdown(expiredTime) {
    const countdownArea = document.getElementById('countdownArea');
    const interval = setInterval(() => {
        const now = new Date();
        const diff = expiredTime - now;
        if (diff <= 0) {
            clearInterval(interval);
            countdownArea.innerHTML = '<i class="fas fa-clock"></i> QRIS telah kadaluarsa. Silakan buat pesanan baru.';
        } else {
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            countdownArea.innerHTML = `<i class="fas fa-hourglass-half"></i> Sisa waktu: ${minutes}m ${seconds}s`;
        }
    }, 1000);
}

document.getElementById('submitBtn').addEventListener('click', async () => {
    const loginEmail = document.getElementById('loginEmail').value.trim();
    const loginPassword = document.getElementById('loginPassword').value;
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const proofLink = document.getElementById('proofLink').value.trim();

    if (!currentUserId || !currentUsername) {
        showToast("❌ Silakan login terlebih dahulu!");
        window.location.href = 'index.html';
        return;
    }
    if (!loginEmail) { showToast("Masukkan Email/Username!"); return; }
    if (!loginPassword) { showToast("Masukkan Password!"); return; }
    if (!phoneNumber) { showToast("Masukkan Nomor Telepon!"); return; }
    if (!proofLink) { showToast("Masukkan Link Bukti Transfer!"); return; }

    await loadQueueNumber();
    createPayment();
});

document.getElementById('checkPaymentBtn').addEventListener('click', checkPaymentStatus);
document.getElementById('closePaymentBtn').addEventListener('click', () => {
    document.getElementById('paymentModal').classList.remove('active');
    if (checkInterval) clearInterval(checkInterval);
});

function goBack() { window.location.href = 'index.html'; }

if (!currentUserId || !currentUsername) {
    showToast("❌ Silakan login terlebih dahulu!");
    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
}

await loadCustomTheme();
await loadBotStatus();
loadQueueNumber();
loadData();

window.goBack = goBack;
window.copyCommand = copyCommand;
window.openBot = openBot;
