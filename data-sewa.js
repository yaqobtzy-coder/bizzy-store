let cart = [];
let total = 0;

function loadCartData() {
    cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    total = parseInt(localStorage.getItem('checkoutTotal')) || 0;
    
    // CEK APAKAH USER SUDAH PUNYA NAMA
    const userName = localStorage.getItem('userName');
    if (!userName || userName === 'Customer' || userName === 'null' || userName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
        return;
    }
    
    if (cart.length === 0) {
        window.location.href = 'rayy-store.com.html';
        return;
    }
    
    displayOrderSummary();
    loadProfileName();
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

function loadProfileName() {
    // Ambil nama dari PROFILE (WAJIB)
    let profileName = localStorage.getItem('userName');
    const buyerNameInput = document.getElementById('buyerName');
    
    if (profileName && profileName !== 'Customer' && profileName !== 'null' && profileName !== 'Guest') {
        buyerNameInput.value = profileName;
        buyerNameInput.readOnly = true;
        buyerNameInput.style.backgroundColor = '#f1f5f9';
        buyerNameInput.style.color = '#1e293b';
    } else {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
    }
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
    // Ambil nama dari PROFILE (WAJIB)
    let buyerName = localStorage.getItem('userName');
    const buyerPhone = document.getElementById('buyerPhone').value.trim();
    const linkGroup = document.getElementById('linkGroup').value.trim();
    const notes = document.getElementById('notes').value.trim();
    
    if (!buyerName || buyerName === 'Customer' || buyerName === 'null' || buyerName === 'Guest') {
        alert('⚠️ Silakan isi nama terlebih dahulu di halaman Profil!');
        window.location.href = 'profile.html';
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
        createdAt: new Date().toISOString(),
        username: buyerName
    };
    
    console.log('📦 Menyimpan order:', { buyerName, buyerPhone, linkGroup });
    
    const newOrderRef = database.ref('sewa_orders').push();
    await newOrderRef.set(orderData);
    
    localStorage.setItem('orderData', JSON.stringify(orderData));
    localStorage.setItem('buyerName', buyerName);
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', total);
    localStorage.setItem('userName', buyerName);
    
    // Kirim notifikasi ke Telegram (sudah ada via sendTelegramNotification)
    if (typeof sendTelegramNotification !== 'undefined') {
        const produkList = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
        const messageTelegram = `🛍️ PRODUK DIPROSES (CHECKOUT)\n\n` +
            `👤 User: ${buyerName}\n` +
            `📱 No WA: ${buyerPhone}\n` +
            `🔗 Link Grup: ${linkGroup}\n` +
            `📦 Produk: ${produkList}\n` +
            `💰 Total: Rp ${formatNumber(total)}\n` +
            `📅 Durasi: ${durasi} hari\n` +
            `📂 Kategori: SEWA BOT\n` +
            `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
        
        await sendTelegramNotification(messageTelegram);
    }
    
    hideLoading();
    
    alert('✅ Data berhasil disimpan! Silakan lanjutkan ke pembayaran.\n\nAdmin akan memproses pesanan Anda setelah pembayaran dikonfirmasi.');
    
    window.location.href = 'pay.html';
}

loadCartData();