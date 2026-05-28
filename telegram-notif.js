// ========================================
// TELEGRAM & WHATSAPP NOTIFICATION
// ========================================

// TELEGRAM BOT TOKEN BARU
const TELEGRAM_BOT_TOKEN = "8996706964:AAEXwbGDvtJC3l2X6WTeFfk3K5KZb7JxtLQ";
const TELEGRAM_CHAT_ID = "7966336512";

// WhatsApp Numbers
const WHATSAPP_NUMBER = "6285794545996";
const WHATSAPP_ADMIN2 = "6285189712417";

function formatNumberTele(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Kirim ke Telegram
async function sendTelegramNotification(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        const result = await response.json();
        if (result.ok) {
            console.log('✅ Telegram notifikasi terkirim');
            return true;
        } else {
            console.error('❌ Gagal kirim Telegram:', result);
            return false;
        }
    } catch (error) {
        console.error('❌ Error kirim Telegram:', error);
        return false;
    }
}

// Kirim ke WhatsApp (membuka tab baru)
function sendWhatsAppNotification(phoneNumber, message) {
    let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
        cleanNumber = '62' + cleanNumber.substring(1);
    }
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    console.log('📱 Membuka WhatsApp untuk nomor:', phoneNumber);
}

// ==================== NOTIFIKASI 1: TAMBAH KE KERANJANG ====================
async function notifyAddToCartTelegram(productName, price, quantity, userName) {
    const messageTelegram = `🛒 *TAMBAH KE KERANJANG*\n\n` +
        `👤 User: ${userName || 'Guest'}\n` +
        `📦 Produk: ${productName}\n` +
        `🔢 Jumlah: ${quantity}\n` +
        `💰 Harga: Rp ${formatNumberTele(price)}\n` +
        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
}

// ==================== NOTIFIKASI 2: PROSES CHECKOUT ====================
async function notifyOrderProcessing(orderData) {
    const user = orderData.customerData?.buyerName || 
                 orderData.customerData?.wajib?.ownerName || 
                 orderData.customerData?.ownerName || 
                 orderData.customerData?.panelUsername ||
                 'Customer';
    
    let produkText = '';
    let totalItem = 0;
    if (orderData.cart && orderData.cart.length > 0) {
        produkText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
        totalItem = orderData.cart.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    const messageTelegram = `🛍️ *PRODUK DIPROSES (CHECKOUT)*\n\n` +
        `👤 User: ${user}\n` +
        `📦 Produk: ${produkText}\n` +
        `🔢 Total Item: ${totalItem}\n` +
        `💰 Total Harga: Rp ${formatNumberTele(orderData.total || 0)}\n` +
        `📂 Kategori: ${orderData.type === 'sewa' ? 'SEWA' : orderData.type === 'script' ? 'SCRIPT' : 'PANEL'}\n` +
        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
    
    const messageWA = `🛍️ *PRODUK DIPROSES (CHECKOUT)*%0A%0A` +
        `👤 User: ${user}%0A` +
        `📦 Produk: ${produkText}%0A` +
        `🔢 Total Item: ${totalItem}%0A` +
        `💰 Total Harga: Rp ${formatNumberTele(orderData.total || 0)}%0A` +
        `📂 Kategori: ${orderData.type === 'sewa' ? 'SEWA' : orderData.type === 'script' ? 'SCRIPT' : 'PANEL'}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
}

// ==================== NOTIFIKASI 3: PEMBAYARAN BERHASIL (SEWA) ====================
async function notifySewaSuccess(orderData) {
    const user = orderData.customerData?.buyerName || 'Customer';
    
    let produkText = '';
    if (orderData.cart && orderData.cart.length > 0) {
        produkText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
    }
    
    const linkGroup = orderData.customerData?.linkGroup || '-';
    const noWa = orderData.customerData?.buyerPhone || 
                 orderData.customerData?.wajib?.ownerPhone || 
                 orderData.customerData?.ownerPhone || '-';
    const idTransaksi = orderData.depositId || orderData.id || '-';
    const gateway = orderData.gateway || 'unknown';
    
    const messageTelegram = `✅ *PEMBAYARAN BERHASIL - SEWA* ✅\n\n` +
        `👤 Pembeli: ${user}\n` +
        `📦 Produk: ${produkText}\n` +
        `💰 Total: Rp ${formatNumberTele(orderData.total || 0)}\n` +
        `📱 No WA: ${noWa}\n` +
        `🔗 Link Group: ${linkGroup}\n` +
        `🆔 ID Transaksi: ${idTransaksi}\n` +
        `💳 Gateway: ${gateway}\n` +
        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
    
    const messageWA = `✅ *PEMBAYARAN BERHASIL - SEWA* ✅%0A%0A` +
        `👤 Pembeli: ${user}%0A` +
        `📦 Produk: ${produkText}%0A` +
        `💰 Total: Rp ${formatNumberTele(orderData.total || 0)}%0A` +
        `📱 No WA: ${noWa}%0A` +
        `🔗 Link Group: ${linkGroup}%0A` +
        `🆔 ID Transaksi: ${idTransaksi}%0A` +
        `💳 Gateway: ${gateway}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
    sendWhatsAppNotification(WHATSAPP_NUMBER, messageWA);
}

// ==================== NOTIFIKASI 4: PEMBAYARAN BERHASIL (SCRIPT) ====================
async function notifyScriptSuccess(orderData) {
    const user = orderData.customerData?.wajib?.ownerName || 
                 orderData.customerData?.ownerName || 
                 'Customer';
    
    let produkText = '';
    if (orderData.cart && orderData.cart.length > 0) {
        produkText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
    }
    
    const noWa = orderData.customerData?.wajib?.ownerPhone || 
                 orderData.customerData?.ownerPhone || '-';
    const botNumber = orderData.customerData?.wajib?.botNumber || '-';
    const customPairing = orderData.customerData?.wajib?.customPairing || '-';
    const gateway = orderData.gateway || 'unknown';
    
    const messageTelegram = `✅ *PEMBAYARAN BERHASIL - SCRIPT* ✅\n\n` +
        `👤 Nama Owner: ${user}\n` +
        `📱 No Owner: ${noWa}\n` +
        `🤖 No Bot: ${botNumber}\n` +
        `📦 Produk: ${produkText}\n` +
        `💰 Total: Rp ${formatNumberTele(orderData.total || 0)}\n` +
        `🔗 Custom Pairing: ${customPairing}\n` +
        `💳 Gateway: ${gateway}\n` +
        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
    
    const messageWA = `✅ *PEMBAYARAN BERHASIL - SCRIPT* ✅%0A%0A` +
        `👤 Nama Owner: ${user}%0A` +
        `📱 No Owner: ${noWa}%0A` +
        `🤖 No Bot: ${botNumber}%0A` +
        `📦 Produk: ${produkText}%0A` +
        `💰 Total: Rp ${formatNumberTele(orderData.total || 0)}%0A` +
        `🔗 Custom Pairing: ${customPairing}%0A` +
        `💳 Gateway: ${gateway}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
    sendWhatsAppNotification(WHATSAPP_NUMBER, messageWA);
}

// ==================== NOTIFIKASI 5: PEMBAYARAN BERHASIL (PANEL) ====================
async function notifyPanelOrder(orderData) {
    const user = orderData.customerData?.panelUsername || orderData.customerData?.buyerName || 'Customer';
    const spec = orderData.customerData?.specData || {};
    const ramLabel = spec.ramLabel || spec.spec || '1GB';
    
    const messageTelegram = `🖥️ *PEMBAYARAN BERHASIL - PANEL HOSTING* 🖥️\n\n` +
        `👤 Pembeli: ${user}\n` +
        `📦 Produk: ${orderData.customerData?.productName || 'Panel Hosting'}\n` +
        `💻 Spesifikasi: ${ramLabel} RAM | ${spec.cpu || '30'}% CPU | ${spec.disk ? Math.floor(spec.disk / 1024) : '2'} GB Disk\n` +
        `💰 Total: Rp ${formatNumberTele(orderData.total || 0)}\n` +
        `💳 Gateway: ${orderData.gateway || 'unknown'}\n` +
        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
    
    const messageWA = `🖥️ *PEMBAYARAN BERHASIL - PANEL HOSTING* 🖥️%0A%0A` +
        `👤 Pembeli: ${user}%0A` +
        `📦 Produk: ${orderData.customerData?.productName}%0A` +
        `💻 Spesifikasi: ${ramLabel} RAM | ${spec.cpu || '30'}% CPU%0A` +
        `💰 Total: Rp ${formatNumberTele(orderData.total || 0)}%0A` +
        `💳 Gateway: ${orderData.gateway}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
    sendWhatsAppNotification(WHATSAPP_NUMBER, messageWA);
}

// ==================== NOTIFIKASI 6: UPLOAD BUKTI PEMBAYARAN ====================
async function notifyUploadBukti(orderId, buyerName, total, imageUrl) {
    let produkText = '';
    let orderData = JSON.parse(localStorage.getItem('lastOrderData') || '{}');
    if (orderData.cart && orderData.cart.length > 0) {
        produkText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
    }
    
    const messageTelegram = `📸 *UPLOAD BUKTI PEMBAYARAN* 📸\n\n` +
        `🆔 Order ID: ${orderId}\n` +
        `👤 Pembeli: ${buyerName}\n` +
        `📦 Produk: ${produkText}\n` +
        `💰 Total: Rp ${formatNumberTele(total)}\n` +
        `🔗 Link Bukti: ${imageUrl}\n` +
        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
    
    const messageWA = `📸 *UPLOAD BUKTI PEMBAYARAN* 📸%0A%0A` +
        `🆔 Order ID: ${orderId}%0A` +
        `👤 Pembeli: ${buyerName}%0A` +
        `📦 Produk: ${produkText}%0A` +
        `💰 Total: Rp ${formatNumberTele(total)}%0A` +
        `🔗 Link Bukti: ${imageUrl}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
}

// ==================== NOTIFIKASI 7: DONE CANVAS GENERATED ====================
async function notifyDoneCanvas(buyerName, productsText, totalAmount, canvasUrl) {
    const messageTelegram = `🎨 *DONE CANVAS GENERATED* 🎨\n\n` +
        `👤 Pembeli: ${buyerName}\n` +
        `📦 Produk: ${productsText}\n` +
        `💰 Total: Rp ${formatNumberTele(totalAmount)}\n` +
        `🔗 Link Canvas: ${canvasUrl}\n` +
        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
    
    const messageWA = `🎨 *DONE CANVAS GENERATED* 🎨%0A%0A` +
        `👤 Pembeli: ${buyerName}%0A` +
        `📦 Produk: ${productsText}%0A` +
        `💰 Total: Rp ${formatNumberTele(totalAmount)}%0A` +
        `🔗 Link Canvas: ${canvasUrl}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
    sendWhatsAppNotification(WHATSAPP_NUMBER, messageWA);
}