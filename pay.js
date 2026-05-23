let cart = [];
let total = 0;
let currentGateway = null;
let depositId = null;
let statusInterval = null;
let orderData = null;
let processingNotifSent = false;
let activeGateways = { zakki: true, ramashop: false };
let isDepositCreated = false;

// Load active gateways dari localStorage
function loadActiveGateways() {
    const saved = localStorage.getItem('activeGateways');
    if (saved) {
        activeGateways = JSON.parse(saved);
    }
}

// Cek apakah sudah ada depositId di sessionStorage (mencegah regenerasi QR saat refresh)
function loadExistingDeposit() {
    const savedDepositId = sessionStorage.getItem('currentDepositId');
    const savedGateway = sessionStorage.getItem('currentGateway');
    const savedQRHtml = sessionStorage.getItem('currentQRHtml');
    const savedExpiredAt = sessionStorage.getItem('currentExpiredAt');
    
    if (savedDepositId && savedGateway && savedQRHtml) {
        depositId = savedDepositId;
        currentGateway = savedGateway;
        isDepositCreated = true;
        
        const qrSection = document.getElementById('qrSection');
        if (qrSection && savedQRHtml) {
            qrSection.innerHTML = savedQRHtml;
            document.getElementById('paymentInfo').style.display = 'block';
            if (savedExpiredAt) {
                startCountdown(savedExpiredAt);
            }
        }
        
        if (currentGateway === 'zakki') {
            startZakkiStatusCheck(depositId);
        } else if (currentGateway === 'ramashop') {
            startRamashopStatusCheck(depositId);
        }
        
        return true;
    }
    return false;
}

// Render gateway options berdasarkan yang aktif
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
                createDeposit();
            } else {
                showNotification('Pembayaran sudah dibuat, silakan selesaikan pembayaran!', 'error');
                radio.checked = currentGateway === e.target.value;
            }
        });
    });
}

// Load checkout data
function loadCheckoutData() {
    cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    total = parseInt(localStorage.getItem('checkoutTotal')) || 0;
    orderData = JSON.parse(localStorage.getItem('orderData')) || {};
    loadActiveGateways();
    
    if (cart.length === 0) {
        window.location.href = 'rayy-store.com.html';
        return;
    }
    
    displayOrderSummary();
    renderGatewayOptions();
    
    if (!loadExistingDeposit()) {
        if (activeGateways.zakki || activeGateways.ramashop) {
            createDeposit();
        }
    }
}

function displayOrderSummary() {
    const container = document.getElementById('orderSummary');
    let itemsHtml = '';
    cart.forEach(item => {
        itemsHtml += `
            <div class="order-item">
                <span>${escapeHtml(item.name)} x${item.quantity}</span>
                <span>Rp ${formatNumberPay(item.price * item.quantity)}</span>
            </div>
        `;
    });
    
    container.innerHTML = `
        ${itemsHtml}
        <div class="order-total">
            <span>Total Pembayaran</span>
            <span>Rp ${formatNumberPay(total)}</span>
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
            
            sessionStorage.setItem('currentDepositId', depositId);
            sessionStorage.setItem('currentGateway', currentGateway);
            
            displayZakkiQR(data.data);
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
    
    sessionStorage.setItem('currentQRHtml', qrHtml);
    sessionStorage.setItem('currentExpiredAt', data.expired_at);
}

function startZakkiStatusCheck(id) {
    if (statusInterval) clearInterval(statusInterval);
    
    statusInterval = setInterval(async () => {
        try {
            const response = await fetch(`https://qris.zakki.store/cektopup?idtopup=${id}`);
            const data = await response.json();
            
            if (data.kategori_status === 'SUCCESS') {
                clearInterval(statusInterval);
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
            
            sessionStorage.setItem('currentDepositId', depositId);
            sessionStorage.setItem('currentGateway', currentGateway);
            
            displayRamashopQR(data.data);
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
    
    sessionStorage.setItem('currentQRHtml', qrHtml);
    sessionStorage.setItem('currentExpiredAt', data.expiredAt);
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
    
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expiredTime - now;
        
        if (distance <= 0) {
            clearInterval(interval);
            countdownEl.innerHTML = '⏰ QRIS Kadaluarsa, silakan buat baru';
            sessionStorage.removeItem('currentDepositId');
            sessionStorage.removeItem('currentQRHtml');
            isDepositCreated = false;
        } else {
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            countdownEl.innerHTML = `⏰ Kadaluarsa dalam: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

async function paymentSuccess() {
    clearInterval(statusInterval);
    
    sessionStorage.removeItem('currentDepositId');
    sessionStorage.removeItem('currentGateway');
    sessionStorage.removeItem('currentQRHtml');
    sessionStorage.removeItem('currentExpiredAt');
    
    const orderId = Date.now().toString();
    const finalOrderData = {
        id: orderId,
        type: orderData.type || 'unknown',
        cart: cart,
        total: total,
        gateway: currentGateway,
        depositId: depositId,
        status: 'paid',
        createdAt: new Date().toISOString(),
        customerData: orderData
    };
    
    await database.ref('orders/' + orderId).set(finalOrderData);
    
    try {
        if (typeof notifySewaSuccess !== 'undefined' && typeof notifyScriptSuccess !== 'undefined') {
            if (orderData.type === 'sewa') {
                await notifySewaSuccess(finalOrderData);
            } else if (orderData.type === 'script') {
                await notifyScriptSuccess(finalOrderData);
            }
        }
    } catch(e) {
        console.error('Error kirim notifikasi:', e);
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
    
    localStorage.setItem('lastOrderId', orderId);
    localStorage.setItem('lastOrderData', JSON.stringify(finalOrderData));
    
    window.location.href = 'upload-bukti.html';
}

function showError(message) {
    const qrSection = document.getElementById('qrSection');
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

loadCheckoutData();
sendProcessingNotification();