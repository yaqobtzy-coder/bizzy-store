let cart = [];
let total = 0;
let currentGateway = null;
let depositId = null;
let statusInterval = null;
let orderData = null;
let processingNotifSent = false;
let activeGateways = { zakki: true, ramashop: false };
let isDepositCreated = false;

function loadActiveGateways() {
    const saved = localStorage.getItem('activeGateways');
    if (saved) {
        activeGateways = JSON.parse(saved);
    }
}

function isTotalGratis() {
    return total <= 0;
}

function loadCheckoutData() {
    cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    total = parseInt(localStorage.getItem('checkoutTotal')) || 0;
    orderData = JSON.parse(localStorage.getItem('orderData')) || {};
    loadActiveGateways();
    
    console.log('📦 Loaded cart:', cart);
    console.log('💰 Total:', total);
    console.log('📝 Order Data:', orderData);
    
    if (cart.length === 0) {
        window.location.href = 'rayy-store.com.html';
        return;
    }
    
    displayOrderSummary();
    
    if (isTotalGratis()) {
        showNotification('🎉 Total Rp 0! Langsung konfirmasi pesanan.', 'success');
        setTimeout(() => {
            paymentSuccessGratis();
        }, 1500);
        return;
    }
    
    renderGatewayOptions();
    
    const hasExistingDeposit = loadExistingDeposit();
    if (!hasExistingDeposit) {
        if (activeGateways.zakki || activeGateways.ramashop) {
            createDeposit();
        }
    }
}

function renderGatewayOptions() {
    const container = document.getElementById('gatewayOptions');
    if (!container) return;
    
    let html = '';
    let hasActive = false;
    
    if (activeGateways.zakki) {
        html += `
            <div class="gateway-option" data-gateway="zakki">
                <div class="gateway-radio">
                    <input type="radio" name="gateway" value="zakki" id="gatewayZakki" ${!hasActive ? 'checked' : ''}>
                    <label for="gatewayZakki">
                        <strong>Zakki Store QRIS</strong>
                        <span class="recommended">⭐ Recommended</span>
                        <small>Rate terbaik & proses cepat</small>
                    </label>
                </div>
            </div>
        `;
        hasActive = true;
    }
    
    if (activeGateways.ramashop) {
        html += `
            <div class="gateway-option" data-gateway="ramashop">
                <div class="gateway-radio">
                    <input type="radio" name="gateway" value="ramashop" id="gatewayRamashop" ${!hasActive ? 'checked' : ''}>
                    <label for="gatewayRamashop">
                        <strong>Ramashop QRIS</strong>
                        <small>Payment gateway alternatif</small>
                    </label>
                </div>
            </div>
        `;
    }
    
    if (!activeGateways.zakki && !activeGateways.ramashop) {
        container.innerHTML = '<div style="color:#ff6b6b; text-align:center; padding:20px;">⚠️ Tidak ada gateway pembayaran yang aktif. Silakan hubungi admin.</div>';
        return;
    }
    
    container.innerHTML = html;
    
    if (!currentGateway) {
        if (activeGateways.zakki) {
            currentGateway = 'zakki';
            document.getElementById('gatewayZakki')?.setAttribute('checked', 'checked');
        } else if (activeGateways.ramashop) {
            currentGateway = 'ramashop';
            document.getElementById('gatewayRamashop')?.setAttribute('checked', 'checked');
        }
    }
    
    document.querySelectorAll('input[name="gateway"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (!isDepositCreated) {
                currentGateway = e.target.value;
                clearExistingDeposit();
                createDeposit();
            } else {
                showNotification('Pembayaran sudah dibuat, silakan selesaikan!', 'error');
                radio.checked = currentGateway === e.target.value;
            }
        });
    });
}

function saveDepositToSession(gateway, depositData) {
    const depositInfo = {
        gateway: gateway,
        depositId: depositData.id,
        qrHtml: depositData.qrHtml,
        expiredAt: depositData.expiredAt,
        createdAt: Date.now(),
        total: total,
        cart: cart,
        orderData: orderData
    };
    sessionStorage.setItem('currentDeposit', JSON.stringify(depositInfo));
    sessionStorage.setItem('currentGateway', gateway);
    sessionStorage.setItem('currentDepositId', depositData.id);
    sessionStorage.setItem('currentQRHtml', depositData.qrHtml);
    sessionStorage.setItem('currentExpiredAt', depositData.expiredAt);
}

function loadExistingDeposit() {
    const savedDeposit = sessionStorage.getItem('currentDeposit');
    if (!savedDeposit) return false;
    
    try {
        const deposit = JSON.parse(savedDeposit);
        const now = Date.now();
        const expiredAt = new Date(deposit.expiredAt).getTime();
        
        if (expiredAt > now) {
            currentGateway = deposit.gateway;
            depositId = deposit.depositId;
            isDepositCreated = true;
            total = deposit.total;
            cart = deposit.cart;
            orderData = deposit.orderData;
            
            displayOrderSummary();
            
            const qrSection = document.getElementById('qrSection');
            if (qrSection && deposit.qrHtml) {
                qrSection.innerHTML = deposit.qrHtml;
                document.getElementById('paymentInfo').style.display = 'block';
                startCountdown(deposit.expiredAt);
            }
            
            if (currentGateway === 'zakki') {
                startZakkiStatusCheck(depositId);
            } else if (currentGateway === 'ramashop') {
                startRamashopStatusCheck(depositId);
            }
            
            console.log('✅ Menggunakan deposit yang sudah ada:', depositId);
            return true;
        } else {
            console.log('⚠️ Deposit sudah kadaluarsa');
            clearExistingDeposit();
            return false;
        }
    } catch(e) {
        console.error('Error loading deposit:', e);
        clearExistingDeposit();
        return false;
    }
}

function clearExistingDeposit() {
    sessionStorage.removeItem('currentDeposit');
    sessionStorage.removeItem('currentGateway');
    sessionStorage.removeItem('currentDepositId');
    sessionStorage.removeItem('currentQRHtml');
    sessionStorage.removeItem('currentExpiredAt');
    isDepositCreated = false;
    depositId = null;
    
    if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
    }
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
        window.countdownInterval = null;
    }
}

function displayOrderSummary() {
    const container = document.getElementById('orderSummary');
    if (!container) return;
    
    let itemsHtml = '';
    cart.forEach(item => {
        itemsHtml += `
            <div class="order-item">
                <span>${escapeHtml(item.name)} x${item.quantity}</span>
                <span>Rp ${formatNumberPay(item.price * item.quantity)}</span>
            </div>
        `;
    });
    
    const totalText = total <= 0 ? '🎉 GRATIS!' : `Rp ${formatNumberPay(total)}`;
    const totalColor = total <= 0 ? '#28a745' : '#00f2fe';
    
    container.innerHTML = `
        ${itemsHtml}
        <div class="order-total">
            <span>Total Pembayaran</span>
            <span style="color: ${totalColor}; font-size: 18px; font-weight: 800;">${totalText}</span>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumberPay(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showNotification(msg, type) {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

async function sendProcessingNotification() {
    if (processingNotifSent) return;
    processingNotifSent = true;
    
    const processingData = {
        id: Date.now().toString(),
        type: orderData.type || 'unknown',
        cart: cart,
        total: total,
        customerData: orderData,
        status: 'processing',
        createdAt: new Date().toISOString()
    };
    
    if (typeof notifyOrderProcessing !== 'undefined') {
        await notifyOrderProcessing(processingData);
    }
}

async function createDeposit() {
    if (!currentGateway) {
        showError('Tidak ada gateway pembayaran yang dipilih');
        return;
    }
    
    if (isDepositCreated) {
        showNotification('Pembayaran sudah dibuat, silakan selesaikan!', 'error');
        return;
    }
    
    const qrSection = document.getElementById('qrSection');
    qrSection.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner"></i><p>Menyiapkan QRIS...</p></div>`;
    document.getElementById('paymentInfo').style.display = 'none';
    
    if (currentGateway === 'zakki') {
        if (!activeGateways.zakki) {
            showError('Gateway Zakki sedang tidak aktif');
            return;
        }
        await createZakkiDeposit();
    } else if (currentGateway === 'ramashop') {
        if (!activeGateways.ramashop) {
            showError('Gateway Ramashop sedang tidak aktif');
            return;
        }
        await createRamashopDeposit();
    }
}

async function createZakkiDeposit() {
    try {
        const response = await fetch('https://qris.zakki.store/topup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: PAYMENT_GATEWAYS.zakki.token,
                nominal: total
            })
        });
        
        const data = await response.json();
        
        if (data.code === 201 && data.data) {
            depositId = data.data.id_transaksi;
            isDepositCreated = true;
            
            const qrHtml = displayZakkiQR(data.data);
            
            saveDepositToSession('zakki', {
                id: depositId,
                qrHtml: qrHtml,
                expiredAt: data.data.expired_at
            });
            
            startZakkiStatusCheck(depositId);
            startCountdown(data.data.expired_at);
        } else {
            showError('Gagal membuat pembayaran: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error:', err);
        showError('Gagal terhubung ke payment gateway Zakki');
    }
}

function displayZakkiQR(data) {
    const qrHtml = `
        <div class="status-badge status-pending">
            <i class="fas fa-clock"></i> Menunggu Pembayaran
        </div>
        <div class="qr-image">
            <img src="${data.qris_image}" alt="QRIS Code" onerror="this.src='https://placehold.co/220x220/1a1d24/4facfe?text=QRIS'">
        </div>
        <div class="payment-info-box">
            <p><strong>Total Bayar:</strong> Rp ${formatNumberPay(data.rincian?.total_bayar || total)}</p>
            <p><strong>Kode Unik:</strong> ${data.rincian?.kode_unik || '-'}</p>
        </div>
    `;
    
    const qrSection = document.getElementById('qrSection');
    qrSection.innerHTML = qrHtml;
    document.getElementById('paymentInfo').style.display = 'block';
    
    return qrHtml;
}

function startZakkiStatusCheck(id) {
    if (statusInterval) clearInterval(statusInterval);
    
    statusInterval = setInterval(async () => {
        try {
            const response = await fetch(`https://qris.zakki.store/cektopup?idtopup=${id}`);
            const data = await response.json();
            
            if (data.kategori_status === 'SUCCESS') {
                clearInterval(statusInterval);
                clearExistingDeposit();
                paymentSuccess();
            }
        } catch (err) {
            console.error('Error cek status:', err);
        }
    }, 3000);
}

async function createRamashopDeposit() {
    try {
        const response = await fetch('https://ramashop.my.id/api/public/deposit/create', {
            method: 'POST',
            headers: {
                'X-API-Key': PAYMENT_GATEWAYS.ramashop.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: total,
                method: 'qris'
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            depositId = data.data.depositId;
            isDepositCreated = true;
            
            const qrHtml = displayRamashopQR(data.data);
            
            saveDepositToSession('ramashop', {
                id: depositId,
                qrHtml: qrHtml,
                expiredAt: data.data.expiredAt
            });
            
            startRamashopStatusCheck(depositId);
            startCountdown(data.data.expiredAt);
        } else {
            showError('Gagal membuat pembayaran: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error:', err);
        showError('Gagal terhubung ke payment gateway Ramashop');
    }
}

function displayRamashopQR(data) {
    const qrHtml = `
        <div class="status-badge status-pending">
            <i class="fas fa-clock"></i> Menunggu Pembayaran
        </div>
        <div class="qr-image">
            <img src="${data.qrImage}" alt="QRIS Code" onerror="this.src='https://placehold.co/220x220/1a1d24/4facfe?text=QRIS'">
        </div>
        <div class="payment-info-box">
            <p><strong>Total Bayar:</strong> Rp ${formatNumberPay(data.totalAmount || total)}</p>
            <p><strong>Kode Unik:</strong> ${data.uniqueCode || '-'}</p>
        </div>
    `;
    
    const qrSection = document.getElementById('qrSection');
    qrSection.innerHTML = qrHtml;
    document.getElementById('paymentInfo').style.display = 'block';
    
    return qrHtml;
}

function startRamashopStatusCheck(id) {
    if (statusInterval) clearInterval(statusInterval);
    
    statusInterval = setInterval(async () => {
        try {
            const response = await fetch(`https://ramashop.my.id/api/public/deposit/status/${id}`, {
                headers: {
                    'X-API-Key': PAYMENT_GATEWAYS.ramashop.token,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.status && data.data) {
                if (data.data.status === 'success' || data.data.status === 'already') {
                    clearInterval(statusInterval);
                    clearExistingDeposit();
                    paymentSuccess();
                }
            }
        } catch (err) {
            console.error('Error cek status:', err);
        }
    }, 3000);
}

function startCountdown(expiredAt) {
    const expiredTime = new Date(expiredAt).getTime();
    const countdownEl = document.getElementById('countdown');
    if (!countdownEl) return;
    
    if (window.countdownInterval) clearInterval(window.countdownInterval);
    
    window.countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expiredTime - now;
        
        if (distance <= 0) {
            clearInterval(window.countdownInterval);
            countdownEl.innerHTML = '⏰ QRIS Kadaluarsa, silakan refresh halaman';
        } else {
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            countdownEl.innerHTML = `⏰ Kadaluarsa dalam: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// ========== PAYMENT SUCCESS - SIMPAN KE sewa_orders ==========
async function paymentSuccess() {
    if (statusInterval) clearInterval(statusInterval);
    if (window.countdownInterval) clearInterval(window.countdownInterval);
    
    clearExistingDeposit();
    
    const orderId = Date.now().toString();
    const buyerName = orderData.buyerName || localStorage.getItem('buyerName') || 'Customer';
    const buyerPhone = orderData.buyerPhone || '';
    const linkGroup = orderData.linkGroup || '';
    const durasi = orderData.durasi || 7;
    const productName = cart[0]?.name || 'Sewa Bot';
    const productPrice = cart[0]?.price || total;
    
    // 🔥 DATA UNTUK sewa_orders (HARUS DISIMPAN)
    const sewaOrderData = {
        orderId: orderId,
        buyerName: buyerName,
        buyerPhone: buyerPhone,
        linkGroup: linkGroup,
        notes: orderData.notes || '',
        durasi: durasi,
        productName: productName,
        productPrice: productPrice,
        cart: cart,
        total: total,
        gateway: currentGateway,
        depositId: depositId,
        status: 'pending_approval',
        isPaid: true,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    // 🔥 DATA UNTUK orders (backup)
    const orderDataBackup = {
        id: orderId,
        type: 'sewa',
        cart: cart,
        total: total,
        gateway: currentGateway,
        depositId: depositId,
        status: 'paid',
        createdAt: new Date().toISOString(),
        customerData: orderData
    };
    
    try {
        // SIMPAN KE sewa_orders (UTAMA) - PASTIKAN TERSIMPAN
        const sewaOrderRef = database.ref('sewa_orders').push();
        await sewaOrderRef.set(sewaOrderData);
        console.log('✅ Data disimpan ke sewa_orders dengan ID:', sewaOrderRef.key);
        console.log('📦 Data sewa:', sewaOrderData);
        
        // SIMPAN KE orders (BACKUP)
        await database.ref('orders/' + orderId).set(orderDataBackup);
        console.log('✅ Data disimpan ke orders dengan ID:', orderId);
        
        // KIRIM NOTIFIKASI TELEGRAM
        if (typeof sendTelegramNotification !== 'undefined') {
            const produkList = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
            const messageTelegram = `✅ *PEMBAYARAN BERHASIL - SEWA BOT* ✅\n\n` +
                `👤 Pembeli: ${buyerName}\n` +
                `📱 No WA: ${buyerPhone}\n` +
                `🔗 Link Grup: ${linkGroup}\n` +
                `📦 Produk: ${produkList}\n` +
                `💰 Total: Rp ${formatNumberPay(total)}\n` +
                `💳 Gateway: ${currentGateway}\n` +
                `🆔 ID: ${sewaOrderRef.key}\n` +
                `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
                `⚠️ *MENUNGGU PERSETUJUAN ADMIN* ⚠️\n` +
                `Klik tombol di bawah untuk menyetujui sewa dan memulai hitung mundur.`;
            
            await sendTelegramNotification(messageTelegram);
        }
        
        // UPDATE STOK PRODUK
        for (const item of cart) {
            const productRef = database.ref(`products/${item.type}/${item.id}`);
            const snapshot = await productRef.once('value');
            const product = snapshot.val();
            if (product) {
                const newStock = (product.stock || 0) - item.quantity;
                await productRef.update({ stock: newStock });
            }
        }
        
        localStorage.setItem('lastOrderId', sewaOrderRef.key);
        localStorage.setItem('lastOrderData', JSON.stringify(sewaOrderData));
        localStorage.setItem('buyerName', buyerName);
        
        showNotification('✅ Pembayaran berhasil! Mengalihkan...', 'success');
        setTimeout(() => {
            window.location.href = 'upload-bukti.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error saving to database:', error);
        showNotification('Gagal menyimpan data, silakan hubungi admin', 'error');
    }
}

// ========== PAYMENT SUCCESS GRATIS ==========
async function paymentSuccessGratis() {
    const orderId = Date.now().toString();
    const buyerName = orderData.buyerName || localStorage.getItem('buyerName') || 'Customer';
    const buyerPhone = orderData.buyerPhone || '';
    const linkGroup = orderData.linkGroup || '';
    const durasi = orderData.durasi || 7;
    const productName = cart[0]?.name || 'Sewa Bot';
    
    const sewaOrderData = {
        orderId: orderId,
        buyerName: buyerName,
        buyerPhone: buyerPhone,
        linkGroup: linkGroup,
        notes: orderData.notes || '',
        durasi: durasi,
        productName: productName,
        productPrice: 0,
        cart: cart,
        total: 0,
        gateway: 'gratis',
        status: 'pending_approval',
        isPaid: true,
        isGratis: true,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    const orderDataBackup = {
        id: orderId,
        type: 'sewa',
        cart: cart,
        total: 0,
        gateway: 'gratis',
        status: 'paid',
        isGratis: true,
        createdAt: new Date().toISOString(),
        customerData: orderData
    };
    
    try {
        const sewaOrderRef = database.ref('sewa_orders').push();
        await sewaOrderRef.set(sewaOrderData);
        console.log('✅ Data gratis disimpan ke sewa_orders:', sewaOrderRef.key);
        
        await database.ref('orders/' + orderId).set(orderDataBackup);
        
        if (typeof sendTelegramNotification !== 'undefined') {
            const produkList = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
            const messageTelegram = `🎉 *PEMBAYARAN GRATIS - SEWA BOT* 🎉\n\n` +
                `👤 Pembeli: ${buyerName}\n` +
                `📱 No WA: ${buyerPhone}\n` +
                `🔗 Link Grup: ${linkGroup}\n` +
                `📦 Produk: ${produkList}\n` +
                `💰 Total: GRATIS!\n` +
                `🆔 ID: ${sewaOrderRef.key}\n` +
                `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
                `⚠️ *MENUNGGU PERSETUJUAN ADMIN* ⚠️`;
            
            await sendTelegramNotification(messageTelegram);
        }
        
        for (const item of cart) {
            const productRef = database.ref(`products/${item.type}/${item.id}`);
            const snapshot = await productRef.once('value');
            const product = snapshot.val();
            if (product) {
                const newStock = (product.stock || 0) - item.quantity;
                await productRef.update({ stock: newStock });
            }
        }
        
        localStorage.setItem('lastOrderId', sewaOrderRef.key);
        localStorage.setItem('lastOrderData', JSON.stringify(sewaOrderData));
        localStorage.setItem('buyerName', buyerName);
        
        showNotification('🎉 Pesanan gratis berhasil!', 'success');
        setTimeout(() => {
            window.location.href = 'upload-bukti.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal menyimpan data', 'error');
    }
}

function showError(message) {
    const qrSection = document.getElementById('qrSection');
    if (qrSection) {
        qrSection.innerHTML = `
            <div style="text-align: center; color: #ff6b6b; padding: 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px;"></i>
                <p>${message}</p>
                <button class="back-btn" onclick="location.reload()" style="margin-top: 15px;">
                    <i class="fas fa-sync"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

loadCheckoutData();
sendProcessingNotification();