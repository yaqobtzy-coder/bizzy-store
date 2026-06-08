// ========================================
// TELEGRAM & WHATSAPP NOTIFICATION
// ========================================

// TELEGRAM BOT TOKEN
const TELEGRAM_BOT_TOKEN = "8996706964:AAEXwbGDvtJC3l2X6WTeFfk3K5KZb7JxtLQ";
const TELEGRAM_CHAT_ID = "7966336512";

// WhatsApp Numbers
const WHATSAPP_NUMBER = "6285794545996";
const WHATSAPP_ADMIN2 = "6285189712417";

function formatNumberTele(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function escapeMarkdownTele(text) {
    if (!text) return '-';
    return String(text)
        .replace(/_/g, '\\_')
        .replace(/\*/g, '\\*')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/~/g, '\\~')
        .replace(/`/g, '\\`')
        .replace(/>/g, '\\>')
        .replace(/#/g, '\\#')
        .replace(/\+/g, '\\+')
        .replace(/=/g, '\\=')
        .replace(/\|/g, '\\|')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\./g, '\\.')
        .replace(/\!/g, '\\!');
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

// Kirim notifikasi ke Telegram dengan tombol inline
async function sendTelegramNotificationWithButtons(message, replyMarkup) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                reply_markup: replyMarkup
            })
        });
        const result = await response.json();
        if (result.ok) {
            console.log('✅ Telegram notifikasi dengan tombol terkirim');
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
    if (!phoneNumber || phoneNumber === '-') return;
    let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
        cleanNumber = '62' + cleanNumber.substring(1);
    }
    if (!cleanNumber.startsWith('62')) {
        cleanNumber = '62' + cleanNumber;
    }
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    console.log('📱 Membuka WhatsApp untuk nomor:', phoneNumber);
}

// ==================== NOTIFIKASI 1: TAMBAH KE KERANJANG ====================
async function notifyAddToCartTelegram(productName, price, quantity, userName, userPhone) {
    const messageTelegram = `🛒 *TAMBAH KE KERANJANG*\n\n` +
        `👤 *User:* ${escapeMarkdownTele(userName || 'Guest')}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(userPhone || '-')}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(productName)}\n` +
        `🔢 *Jumlah:* ${quantity}\n` +
        `💰 *Harga:* Rp ${formatNumberTele(price)}\n` +
        `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
}

// ==================== NOTIFIKASI 2: PROSES CHECKOUT ====================
async function notifyOrderProcessing(orderData) {
    const user = orderData.customerData?.buyerName || 
                 orderData.customerData?.wajib?.ownerName || 
                 orderData.customerData?.ownerName || 
                 orderData.customerData?.panelUsername ||
                 'Customer';
    
    const userPhone = orderData.customerData?.buyerPhone || 
                      orderData.customerData?.userPhone ||
                      orderData.customerData?.wajib?.ownerPhone ||
                      localStorage.getItem('userPhone') || '-';
    
    let produkText = '';
    let totalItem = 0;
    if (orderData.cart && orderData.cart.length > 0) {
        produkText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
        totalItem = orderData.cart.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    const messageTelegram = `🛍️ *PRODUK DIPROSES (CHECKOUT)*\n\n` +
        `👤 *User:* ${escapeMarkdownTele(user)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(userPhone)}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(produkText)}\n` +
        `🔢 *Total Item:* ${totalItem}\n` +
        `💰 *Total Harga:* Rp ${formatNumberTele(orderData.total || 0)}\n` +
        `📂 *Kategori:* ${orderData.type === 'sewa' ? 'SEWA BOT' : orderData.type === 'script' ? 'SCRIPT' : 'PANEL HOSTING'}\n` +
        `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}`;
    
    const messageWA = `🛍️ *PRODUK DIPROSES (CHECKOUT)*%0A%0A` +
        `👤 User: ${user}%0A` +
        `📱 No WA: ${userPhone}%0A` +
        `📦 Produk: ${produkText}%0A` +
        `🔢 Total Item: ${totalItem}%0A` +
        `💰 Total Harga: Rp ${formatNumberTele(orderData.total || 0)}%0A` +
        `📂 Kategori: ${orderData.type === 'sewa' ? 'SEWA BOT' : orderData.type === 'script' ? 'SCRIPT' : 'PANEL HOSTING'}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
}

// ==================== NOTIFIKASI 2B: QR TELAH DIGENERATE ====================
async function notifyQrGenerated(orderData, depositId, expiredAt) {
    const user = orderData.buyerName || orderData.customerData?.buyerName || 'Customer';
    const userPhone = orderData.userPhone || orderData.buyerPhone || localStorage.getItem('userPhone') || '-';
    const produkList = orderData.cart ? orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ') : orderData.productName || 'Produk';
    const isPanelOrder = (orderData.type === 'panel');
    
    let messageTelegram = '';
    if (isPanelOrder) {
        messageTelegram = `🖥️ *PANEL - QRIS TELAH DIGENERATE* 🖥️\n\n` +
            `👤 *Pembeli:* ${escapeMarkdownTele(user)}\n` +
            `📱 *No WA:* ${escapeMarkdownTele(userPhone)}\n` +
            `📦 *Paket:* ${escapeMarkdownTele(orderData.productName || 'Panel UNLIMITED')}\n` +
            `💾 *Spesifikasi:* ${orderData.ramLabel || 'UNLIMITED'} RAM\n` +
            `💰 *Total:* Rp ${formatNumberTele(orderData.total || 0)}\n` +
            `🆔 *Deposit ID:* ${depositId}\n` +
            `⏰ *Kadaluarsa:* ${new Date(expiredAt).toLocaleString('id-ID')}\n\n` +
            `📌 *Status:* Menunggu pembayaran dari pembeli\n` +
            `⚠️ *JANGAN KONFIRMASI SEBELUM UANG MASUK!*`;
    } else {
        messageTelegram = `🟡 *QRIS TELAH DIGENERATE* 🟡\n\n` +
            `👤 *Pembeli:* ${escapeMarkdownTele(user)}\n` +
            `📱 *No WA:* ${escapeMarkdownTele(userPhone)}\n` +
            `📦 *Produk:* ${escapeMarkdownTele(produkList)}\n` +
            `💰 *Total:* Rp ${formatNumberTele(orderData.total || 0)}\n` +
            `🆔 *Deposit ID:* ${depositId}\n` +
            `⏰ *Kadaluarsa:* ${new Date(expiredAt).toLocaleString('id-ID')}\n\n` +
            `📌 *Status:* Menunggu pembayaran dari pembeli\n` +
            `⚠️ *JANGAN KONFIRMASI SEBELUM UANG MASUK!*`;
    }
    
    await sendTelegramNotification(messageTelegram);
}

// ==================== NOTIFIKASI 3: PEMBAYARAN BERHASIL (SEWA) ====================
async function notifySewaSuccess(orderData) {
    const user = orderData.customerData?.buyerName || orderData.buyerName || 'Customer';
    const userPhone = orderData.customerData?.buyerPhone || orderData.buyerPhone || '-';
    
    let produkText = '';
    if (orderData.cart && orderData.cart.length > 0) {
        produkText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
    } else if (orderData.productName) {
        produkText = orderData.productName;
    }
    
    const linkGroup = orderData.customerData?.linkGroup || orderData.linkGroup || '-';
    const idTransaksi = orderData.depositId || orderData.id || '-';
    const gateway = orderData.gateway || 'unknown';
    const isRenew = orderData.isRenew ? ' (PERPANJANGAN)' : '';
    const orderId = orderData.orderId || '-';
    
    const messageTelegram = `✅ *PEMBAYARAN BERHASIL - SEWA${isRenew}* ✅\n\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(user)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(userPhone)}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(produkText)}\n` +
        `💰 *Total:* Rp ${formatNumberTele(orderData.total || 0)}\n` +
        `🔗 *Link Grup:* ${escapeMarkdownTele(linkGroup)}\n` +
        `🆔 *Deposit ID:* ${idTransaksi}\n` +
        `🆔 *Order ID:* ${orderId}\n` +
        `💳 *Gateway:* ${gateway}\n` +
        `⏰ *Waktu Bayar:* ${new Date(orderData.paidAt || Date.now()).toLocaleString('id-ID')}`;
    
    const messageWA = `✅ *PEMBAYARAN BERHASIL - SEWA${isRenew}* ✅%0A%0A` +
        `👤 Pembeli: ${user}%0A` +
        `📱 No WA: ${userPhone}%0A` +
        `📦 Produk: ${produkText}%0A` +
        `💰 Total: Rp ${formatNumberTele(orderData.total || 0)}%0A` +
        `🔗 Link Grup: ${linkGroup}%0A` +
        `🆔 Deposit ID: ${idTransaksi}%0A` +
        `🆔 Order ID: ${orderId}%0A` +
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
                 orderData.buyerName || 'Customer';
    
    const userPhone = orderData.customerData?.wajib?.ownerPhone || 
                      orderData.customerData?.ownerPhone || 
                      orderData.buyerPhone || '-';
    
    let produkText = '';
    if (orderData.cart && orderData.cart.length > 0) {
        produkText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
    } else if (orderData.productName) {
        produkText = orderData.productName;
    }
    
    const botNumber = orderData.customerData?.wajib?.botNumber || '-';
    const customPairing = orderData.customerData?.wajib?.customPairing || '-';
    const gateway = orderData.gateway || 'unknown';
    const orderId = orderData.orderId || '-';
    
    const messageTelegram = `✅ *PEMBAYARAN BERHASIL - SCRIPT* ✅\n\n` +
        `👤 *Nama Owner:* ${escapeMarkdownTele(user)}\n` +
        `📱 *No Owner:* ${escapeMarkdownTele(userPhone)}\n` +
        `🤖 *No Bot:* ${escapeMarkdownTele(botNumber)}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(produkText)}\n` +
        `💰 *Total:* Rp ${formatNumberTele(orderData.total || 0)}\n` +
        `🔗 *Custom Pairing:* ${escapeMarkdownTele(customPairing)}\n` +
        `🆔 *Order ID:* ${orderId}\n` +
        `💳 *Gateway:* ${gateway}\n` +
        `⏰ *Waktu Bayar:* ${new Date(orderData.paidAt || Date.now()).toLocaleString('id-ID')}`;
    
    const messageWA = `✅ *PEMBAYARAN BERHASIL - SCRIPT* ✅%0A%0A` +
        `👤 Nama Owner: ${user}%0A` +
        `📱 No Owner: ${userPhone}%0A` +
        `🤖 No Bot: ${botNumber}%0A` +
        `📦 Produk: ${produkText}%0A` +
        `💰 Total: Rp ${formatNumberTele(orderData.total || 0)}%0A` +
        `🔗 Custom Pairing: ${customPairing}%0A` +
        `🆔 Order ID: ${orderId}%0A` +
        `💳 Gateway: ${gateway}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
    sendWhatsAppNotification(WHATSAPP_NUMBER, messageWA);
}

// ==================== NOTIFIKASI 5: PEMBAYARAN BERHASIL (PANEL) ====================
async function notifyPanelOrder(orderData) {
    const user = orderData.customerData?.panelUsername || orderData.customerData?.buyerName || orderData.buyerName || 'Customer';
    const userPhone = orderData.customerData?.buyerPhone || orderData.buyerPhone || '-';
    const spec = orderData.customerData?.specData || orderData.specData || {};
    const ramLabel = spec.ramLabel || orderData.ramLabel || 'UNLIMITED';
    const orderId = orderData.orderId || '-';
    
    const messageTelegram = `🖥️ *PEMBAYARAN BERHASIL - PANEL HOSTING* 🖥️\n\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(user)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(userPhone)}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(orderData.productName || 'Panel Hosting')}\n` +
        `💻 *Spesifikasi:* ${escapeMarkdownTele(ramLabel)} RAM | ${spec.cpu || '0'}% CPU\n` +
        `💰 *Total:* Rp ${formatNumberTele(orderData.total || 0)}\n` +
        `🆔 *Order ID:* ${orderId}\n` +
        `💳 *Gateway:* ${orderData.gateway || 'unknown'}\n` +
        `⏰ *Waktu Bayar:* ${new Date(orderData.paidAt || Date.now()).toLocaleString('id-ID')}\n\n` +
        `🤖 *Panel akan otomatis dibuat oleh bot*`;
    
    const messageWA = `🖥️ *PEMBAYARAN BERHASIL - PANEL HOSTING* 🖥️%0A%0A` +
        `👤 Pembeli: ${user}%0A` +
        `📱 No WA: ${userPhone}%0A` +
        `📦 Produk: ${orderData.productName}%0A` +
        `💻 Spesifikasi: ${ramLabel} RAM%0A` +
        `💰 Total: Rp ${formatNumberTele(orderData.total || 0)}%0A` +
        `🆔 Order ID: ${orderId}%0A` +
        `💳 Gateway: ${orderData.gateway}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
    sendWhatsAppNotification(WHATSAPP_NUMBER, messageWA);
}

// ==================== NOTIFIKASI 6: PEMBAYARAN KADALUARSA ====================
async function notifyPaymentExpired(orderId, userName, total) {
    const messageTelegram = `⏰ *PEMBAYARAN KADALUARSA* ⏰\n\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(userName || 'Customer')}\n` +
        `🆔 *Deposit ID:* ${orderId}\n` +
        `💰 *Total:* Rp ${formatNumberTele(total)}\n` +
        `⏰ *Waktu Kadaluarsa:* ${new Date().toLocaleString('id-ID')}\n\n` +
        `❌ *Pembayaran tidak dilanjutkan*`;
    
    await sendTelegramNotification(messageTelegram);
}

// ==================== NOTIFIKASI 7: UPLOAD BUKTI PEMBAYARAN ====================
async function notifyUploadBukti(orderId, buyerName, total, imageUrl) {
    let produkText = '';
    let orderData = JSON.parse(localStorage.getItem('lastOrderData') || '{}');
    if (orderData.cart && orderData.cart.length > 0) {
        produkText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
    } else if (orderData.productName) {
        produkText = orderData.productName;
    }
    const userPhone = localStorage.getItem('userPhone') || '-';
    
    const messageTelegram = `📸 *UPLOAD BUKTI PEMBAYARAN* 📸\n\n` +
        `🆔 *Order ID:* ${orderId}\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(buyerName)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(userPhone)}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(produkText)}\n` +
        `💰 *Total:* Rp ${formatNumberTele(total)}\n` +
        `🔗 *Link Bukti:* ${imageUrl}\n` +
        `⏰ *Waktu Upload:* ${new Date().toLocaleString('id-ID')}\n\n` +
        `📌 *Status:* Menunggu verifikasi admin`;
    
    const messageWA = `📸 *UPLOAD BUKTI PEMBAYARAN* 📸%0A%0A` +
        `🆔 Order ID: ${orderId}%0A` +
        `👤 Pembeli: ${buyerName}%0A` +
        `📱 No WA: ${userPhone}%0A` +
        `📦 Produk: ${produkText}%0A` +
        `💰 Total: Rp ${formatNumberTele(total)}%0A` +
        `🔗 Link Bukti: ${imageUrl}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
}

// ==================== NOTIFIKASI 8: DONE CANVAS GENERATED ====================
async function notifyDoneCanvas(buyerName, buyerPhone, productsText, totalAmount, canvasUrl) {
    const messageTelegram = `🎨 *DONE CANVAS GENERATED* 🎨\n\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(buyerName)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(buyerPhone || '-')}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(productsText)}\n` +
        `💰 *Total:* Rp ${formatNumberTele(totalAmount)}\n` +
        `🔗 *Link Canvas:* ${canvasUrl}\n` +
        `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}`;
    
    const messageWA = `🎨 *DONE CANVAS GENERATED* 🎨%0A%0A` +
        `👤 Pembeli: ${buyerName}%0A` +
        `📱 No WA: ${buyerPhone}%0A` +
        `📦 Produk: ${productsText}%0A` +
        `💰 Total: Rp ${formatNumberTele(totalAmount)}%0A` +
        `🔗 Link Canvas: ${canvasUrl}%0A%0A` +
        `⏰ ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
    sendWhatsAppNotification(WHATSAPP_ADMIN2, messageWA);
    sendWhatsAppNotification(WHATSAPP_NUMBER, messageWA);
}

// ==================== NOTIFIKASI 9: USER REGISTER ====================
async function notifyUserRegister(userName, userPhone, userEmail) {
    const messageTelegram = `👤 *USER BARU REGISTER* 👤\n\n` +
        `👤 *Nama:* ${escapeMarkdownTele(userName)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(userPhone || '-')}\n` +
        `📧 *Email:* ${escapeMarkdownTele(userEmail || '-')}\n` +
        `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
}

// ==================== NOTIFIKASI 10: PANEL ORDER DARI WEB ====================
async function notifyPanelOrderFromWeb(orderData) {
    const messageTelegram = `🖥️ *PESANAN PANEL BARU DARI WEB* 🖥️\n\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(orderData.buyerName)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(orderData.buyerPhone)}\n` +
        `👤 *Username Panel:* ${escapeMarkdownTele(orderData.panelUsername)}\n` +
        `🔑 *Password:* ${escapeMarkdownTele(orderData.panelPassword)}\n` +
        `💾 *RAM:* ${orderData.ramLabel || 'UNLIMITED'}\n` +
        `💰 *Harga:* Rp ${formatNumberTele(orderData.productPrice || 0)}\n` +
        `🆔 *Order ID:* ${orderData.orderId}\n\n` +
        `🤖 *Membuat panel otomatis...*`;
    
    await sendTelegramNotification(messageTelegram);
}

// ==================== NOTIFIKASI 11: ORDER SEWA PERLU APPROVAL ====================
async function notifySewaNeedApproval(orderData, orderId) {
    const messageTelegram = `✅ *PEMBAYARAN BERHASIL - PERLU APPROVAL* ✅\n\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(orderData.buyerName || orderData.username)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(orderData.buyerPhone || '-')}\n` +
        `🔗 *Link Grup:* ${escapeMarkdownTele(orderData.linkGroup || '-')}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(orderData.productName)}\n` +
        `💰 *Total:* Rp ${formatNumberTele(orderData.total || 0)}\n` +
        `📅 *Durasi:* ${orderData.durasi || 7} hari\n` +
        `🆔 *Order ID:* ${orderId}\n` +
        `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}\n\n` +
        `📌 *Pilih aksi di bawah:*`;
    
    const replyMarkup = {
        inline_keyboard: [
            [{ text: "✅ SETUJUI & PROSES", callback_data: `approvesewa_${orderId}` }],
            [{ text: "❌ TOLAK", callback_data: `rejectsewa_${orderId}` }]
        ]
    };
    
    await sendTelegramNotificationWithButtons(messageTelegram, replyMarkup);
}

// ==================== NOTIFIKASI 12: ORDER SEWA DISETUJUI ====================
async function notifySewaApproved(orderData, orderId, durationDays) {
    const messageTelegram = `🎉 *PESANAN DISETUJUI* 🎉\n\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(orderData.buyerName || orderData.username)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(orderData.buyerPhone || '-')}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(orderData.productName)}\n` +
        `📅 *Durasi:* ${durationDays} hari\n` +
        `🆔 *Order ID:* ${orderId}\n` +
        `🤖 *Bot akan otomatis ditambahkan ke grup*\n\n` +
        `⏰ *Mulai Aktif:* ${new Date().toLocaleString('id-ID')}`;
    
    await sendTelegramNotification(messageTelegram);
}

// ==================== NOTIFIKASI 13: ORDER SEWA DITOLAK ====================
async function notifySewaRejected(orderData, orderId) {
    const messageTelegram = `❌ *PESANAN DITOLAK* ❌\n\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(orderData.buyerName || orderData.username)}\n` +
        `📱 *No WA:* ${escapeMarkdownTele(orderData.buyerPhone || '-')}\n` +
        `📦 *Produk:* ${escapeMarkdownTele(orderData.productName)}\n` +
        `🆔 *Order ID:* ${orderId}\n\n` +
        `💡 *Silakan hubungi admin untuk info lebih lanjut*`;
    
    await sendTelegramNotification(messageTelegram);
}

// ==================== NOTIFIKASI 14: PANEL BERHASIL DIBUAT ====================
async function notifyPanelCreated(orderData, result) {
    const messageTelegram = `✅ *PANEL BERHASIL DIBUAT* ✅\n\n` +
        `👤 *Pembeli:* ${escapeMarkdownTele(orderData.buyerName)}\n` +
        `👤 *Username:* ${escapeMarkdownTele(result.user.username)}\n` +
        `🔑 *Password:* ${escapeMarkdownTele(result.userPassword)}\n` +
        `🔗 *Login:* ${PTERODACTYL_CONFIG?.domain || 'https://igabakar.sano.biz.id'}\n` +
        `🆔 *Server ID:* ${result.server.id}\n\n` +
        `📌 *Data panel sudah tersimpan di Firebase*`;
    
    await sendTelegramNotification(messageTelegram);
}

// Export semua fungsi ke global
window.sendTelegramNotification = sendTelegramNotification;
window.sendTelegramNotificationWithButtons = sendTelegramNotificationWithButtons;
window.sendWhatsAppNotification = sendWhatsAppNotification;
window.notifyAddToCartTelegram = notifyAddToCartTelegram;
window.notifyOrderProcessing = notifyOrderProcessing;
window.notifyQrGenerated = notifyQrGenerated;
window.notifySewaSuccess = notifySewaSuccess;
window.notifyScriptSuccess = notifyScriptSuccess;
window.notifyPanelOrder = notifyPanelOrder;
window.notifyPaymentExpired = notifyPaymentExpired;
window.notifyUploadBukti = notifyUploadBukti;
window.notifyDoneCanvas = notifyDoneCanvas;
window.notifyUserRegister = notifyUserRegister;
window.notifyPanelOrderFromWeb = notifyPanelOrderFromWeb;
window.notifySewaNeedApproval = notifySewaNeedApproval;
window.notifySewaApproved = notifySewaApproved;
window.notifySewaRejected = notifySewaRejected;
window.notifyPanelCreated = notifyPanelCreated;

console.log('✅ telegram-notif.js loaded - semua fungsi notifikasi siap digunakan');