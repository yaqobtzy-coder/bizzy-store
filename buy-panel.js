// ========================================
// BUY PANEL JS - RAYY STORE
// AMBIL DATA LANGSUNG DARI LOCAL STORAGE
// ========================================

let cart = [];
let total = 0;

// Konfigurasi Bot Telegram
const TELEGRAM_BOT_TOKEN = "8277063637:AAHUkTG_InkhLl3FV2GN-nMEz0P-pk8_z2Q";
const BOT_OWNER_ID = "6709377378";

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

function getRamInGB(ram) {
    const ramMap = {
        '1gb': 1, '2gb': 2, '3gb': 3, '4gb': 4,
        '5gb': 5, '6gb': 6, '7gb': 7, '8gb': 8,
        '9gb': 9, '10gb': 10, '11gb': 11, '12gb': 12,
        '13gb': 13, '14gb': 14, '15gb': 15, '16gb': 16,
        '17gb': 17, '18gb': 18, '19gb': 19, '20gb': 20,
        'unli': 0
    };
    return ramMap[ram] !== undefined ? ramMap[ram] : 1;
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(msg, type) {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function loadCartData() {
    // AMBIL LANGSUNG DARI LOCAL STORAGE
    cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    total = parseInt(localStorage.getItem('checkoutTotal')) || 0;
    
    console.log('📦 Cart dari localStorage:', cart);
    console.log('💰 Total:', total);
    
    // CEK USER
    const userName = localStorage.getItem('userName');
    const userPhone = localStorage.getItem('userPhone');
    
    if (!userName || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    
    if (!userPhone || userPhone === 'null') {
        alert('⚠️ Silakan isi nomor WhatsApp terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    
    if (cart.length === 0) {
        alert('❌ Keranjang kosong!');
        window.location.href = 'rayy-store.com.html';
        return;
    }
    
    // Cek apakah ini produk panel
    const firstItem = cart[0];
    if (firstItem.type !== 'panel') {
        alert('❌ Halaman ini khusus untuk pembelian panel hosting!');
        window.location.href = 'rayy-store.com.html';
        return;
    }
    
    displayOrderSummary();
    loadProfileData(userName, userPhone);
}

function displayOrderSummary() {
    const container = document.getElementById('orderSummary');
    if (!container) return;
    
    let itemsHtml = '';
    let totalHarga = 0;
    let panelSpec = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalHarga += itemTotal;
        
        const ramLabel = getRamLabel(item.ram);
        const ramSize = getRamInGB(item.ram);
        const cpuText = item.ram === 'unli' ? '1000%' : `${item.cpu || ramSize * 30}%`;
        const diskGB = item.disk ? (item.disk === 0 ? '♾️ UNLIMITED' : Math.floor(item.disk / 1024) + ' GB') : '20 GB';
        
        panelSpec = `${ramLabel} RAM | ${cpuText} CPU | ${diskGB} Disk`;
        
        itemsHtml += `
            <div class="order-item">
                <span>📦 ${escapeHtml(item.name)} x${item.quantity}</span>
                <span>Rp ${formatNumber(itemTotal)}</span>
            </div>
            <div class="spec-detail">⚙️ Spesifikasi: ${panelSpec}</div>
        `;
    });
    
    container.innerHTML = `
        ${itemsHtml}
        <div class="order-total">
            <span>Total Pembayaran</span>
            <span>Rp ${formatNumber(totalHarga)}</span>
        </div>
    `;
}

function loadProfileData(userName, userPhone) {
    const buyerNameInput = document.getElementById('buyerName');
    const buyerPhoneInput = document.getElementById('buyerPhone');
    
    if (buyerNameInput) buyerNameInput.value = userName;
    if (buyerPhoneInput) buyerPhoneInput.value = userPhone;
}

async function sendPanelCreationToBot(orderData) {
    try {
        const message = `🖥️ *ORDER PANEL BARU - MENUNGGU PEMBAYARAN*\n\n` +
            `👤 *Pembeli:* ${orderData.buyerName}\n` +
            `📱 *No WA:* ${orderData.userPhone}\n` +
            `📦 *Paket:* ${orderData.ramLabel} RAM\n` +
            `💰 *Harga:* Rp ${formatNumber(orderData.productPrice)}\n` +
            `👤 *Username Panel:* ${orderData.panelUsername}\n` +
            `🔑 *Password Panel:* ${orderData.panelPassword}\n` +
            `💬 *Catatan:* ${orderData.notes || '-'}\n\n` +
            `🆔 *Order ID:* ${orderData.orderId}\n\n` +
            `⚠️ *Setelah pembayaran dikonfirmasi, panel akan otomatis dibuat*`;
        
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: BOT_OWNER_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        console.log('✅ Notifikasi panel terkirim ke bot');
    } catch (error) {
        console.error('❌ Gagal kirim notifikasi panel:', error);
    }
}

async function submitData() {
    const buyerName = localStorage.getItem('userName');
    const buyerPhone = localStorage.getItem('userPhone');
    const panelUsername = document.getElementById('panelUsername').value.trim();
    const panelPassword = document.getElementById('panelPassword').value;
    const notes = document.getElementById('notes').value.trim();
    
    if (!buyerName || buyerName === 'Customer' || buyerName === 'null' || buyerName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    
    if (!buyerPhone || buyerPhone === 'null') {
        alert('⚠️ Silakan isi nomor WhatsApp terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    
    if (!panelUsername) {
        alert('Masukkan username panel!');
        document.getElementById('panelUsername').focus();
        return;
    }
    if (panelUsername.length < 3) {
        alert('Username minimal 3 karakter!');
        document.getElementById('panelUsername').focus();
        return;
    }
    if (!panelPassword) {
        alert('Masukkan password panel!');
        document.getElementById('panelPassword').focus();
        return;
    }
    if (panelPassword.length < 4) {
        alert('Password minimal 4 karakter!');
        document.getElementById('panelPassword').focus();
        return;
    }
    
    showLoading();
    
    const firstItem = cart[0];
    const ramSize = getRamInGB(firstItem.ram);
    const ramLabel = getRamLabel(firstItem.ram);
    const orderId = Date.now().toString();
    
    const orderData = {
        orderId: orderId,
        type: 'panel',
        buyerName: buyerName,
        userPhone: buyerPhone,
        productId: firstItem.id,
        productName: firstItem.name,
        productPrice: firstItem.price,
        panelUsername: panelUsername,
        panelPassword: panelPassword,
        notes: notes,
        ramSize: ramSize,
        ramLabel: ramLabel,
        ram: firstItem.ram,
        specData: {
            ram: firstItem.ram,
            ramSize: ramSize,
            cpu: firstItem.cpu || (ramSize === 0 ? 1000 : ramSize * 30),
            disk: firstItem.disk || (ramSize === 0 ? 0 : ramSize * 1024),
            ramLabel: ramLabel
        },
        timestamp: Date.now(),
        status: 'pending'
    };
    
    console.log('📦 Order Data:', orderData);
    
    // Simpan ke localStorage
    localStorage.setItem('orderData', JSON.stringify(orderData));
    localStorage.setItem('buyerName', buyerName);
    localStorage.setItem('lastOrderId', orderId);
    
    // Kirim notifikasi ke bot
    await sendPanelCreationToBot(orderData);
    
    hideLoading();
    window.location.href = 'pay.html';
}

// Event listener
document.getElementById('submitBtn').addEventListener('click', submitData);

// Load data saat halaman dimuat
loadCartData();