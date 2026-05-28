let cart = [];
let total = 0;

function loadCartData() {
    cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    total = parseInt(localStorage.getItem('checkoutTotal')) || 0;
    
    if (cart.length === 0) {
        window.location.href = 'rayy-store.com.html';
        return;
    }
    
    displayOrderSummary();
}

function displayOrderSummary() {
    const container = document.getElementById('orderSummary');
    if (!container) return;
    
    let itemsHtml = '';
    let durasi = '';
    let totalHarga = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalHarga += itemTotal;
        itemsHtml += `
            <div class="order-item">
                <span>${escapeHtml(item.name)} x${item.quantity}</span>
                <span>Rp ${formatNumber(itemTotal)}</span>
            </div>
        `;
        if (item.duration) durasi = item.duration;
    });
    
    container.innerHTML = `
        ${itemsHtml}
        ${durasi ? `<div class="order-item"><span>📅 Durasi Sewa</span><span>${escapeHtml(durasi)}</span></div>` : ''}
        <div class="order-total">
            <span>Total Pembayaran</span>
            <span>Rp ${formatNumber(totalHarga)}</span>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

async function submitData() {
    const buyerName = document.getElementById('buyerName').value.trim();
    const buyerPhone = document.getElementById('buyerPhone').value.trim();
    const linkGroup = document.getElementById('linkGroup').value.trim();
    const notes = document.getElementById('notes').value.trim();
    
    // Validasi
    if (!buyerName) {
        alert('Masukkan nama pembeli!');
        return;
    }
    
    if (!buyerPhone) {
        alert('Masukkan nomor WhatsApp!');
        return;
    }
    
    if (!linkGroup) {
        alert('Masukkan link grup WhatsApp!');
        return;
    }
    
    if (!linkGroup.includes('chat.whatsapp.com')) {
        alert('Masukkan link grup WhatsApp yang valid! (contoh: https://chat.whatsapp.com/...)');
        return;
    }
    
    showLoading();
    
    // Ambil durasi dari cart
    let durasi = 1;
    let productName = '';
    let productPrice = 0;
    
    if (cart[0]) {
        if (cart[0].duration) {
            const match = cart[0].duration.match(/(\d+)/);
            if (match) durasi = parseInt(match[1]);
        }
        productName = cart[0].name;
        productPrice = cart[0].price;
    }
    
    // Buat order dengan status pending_approval (menunggu admin approve)
    const orderData = {
        type: 'sewa',
        buyerName: buyerName,
        buyerPhone: buyerPhone,
        linkGroup: linkGroup,
        notes: notes,
        durasi: durasi,
        productName: productName,
        productPrice: productPrice,
        cart: cart,
        total: total,
        status: 'pending_approval',
        createdAt: new Date().toISOString()
    };
    
    // Simpan ke Firebase sewa_orders
    const newOrderRef = database.ref('sewa_orders').push();
    await newOrderRef.set(orderData);
    
    // Simpan ke localStorage untuk proses selanjutnya
    localStorage.setItem('orderData', JSON.stringify(orderData));
    localStorage.setItem('buyerName', buyerName);
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', total);
    
    // Kirim notifikasi ke Telegram
    if (typeof sendTelegramNotification !== 'undefined') {
        const produkList = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
        const messageTelegram = `🛍️ *PRODUK DIPROSES (CHECKOUT)*\n\n` +
            `👤 User: ${buyerName}\n` +
            `📱 No WA: ${buyerPhone}\n` +
            `🔗 Link Grup: ${linkGroup}\n` +
            `📦 Produk: ${produkList}\n` +
            `💰 Total Harga: Rp ${formatNumber(total)}\n` +
            `📅 Durasi: ${durasi} hari\n` +
            `📂 Kategori: SEWA BOT\n` +
            `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
        
        await sendTelegramNotification(messageTelegram);
    }
    
    hideLoading();
    
    // 🔥 PERUBAHAN: LANGSUNG KE pay.html (BUKAN KE WEB STORE)
    // Tampilkan alert bahwa pesanan akan diproses admin
    alert('✅ Data berhasil disimpan! Silakan lanjutkan ke pembayaran.\n\nAdmin akan memproses pesanan Anda setelah pembayaran dikonfirmasi.');
    
    // Redirect ke halaman pembayaran
    window.location.href = 'pay.html';
}

// Load cart data saat halaman dimuat
loadCartData();