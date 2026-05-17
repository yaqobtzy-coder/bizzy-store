let cart = [];
let total = 0;
let currentGateway = 'zakki';
let depositId = null;
let statusInterval = null;
let orderData = null;

// Load checkout data
function loadCheckoutData() {
    cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    total = parseInt(localStorage.getItem('checkoutTotal')) || 0;
    orderData = JSON.parse(localStorage.getItem('orderData')) || {};
    
    if (cart.length === 0) {
        window.location.href = 'rayy-store.html';
        return;
    }
    
    displayOrderSummary();
}

function displayOrderSummary() {
    const container = document.getElementById('orderSummary');
    let itemsHtml = '';
    cart.forEach(item => {
        itemsHtml += `
            <div class="order-item">
                <span>${escapeHtml(item.name)} x${item.quantity}</span>
                <span>Rp ${formatNumber(item.price * item.quantity)}</span>
            </div>
        `;
    });
    
    container.innerHTML = `
        ${itemsHtml}
        <div class="order-total">
            <span>Total Pembayaran</span>
            <span>Rp ${formatNumber(total)}</span>
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

// Gateway selection
document.querySelectorAll('input[name="gateway"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentGateway = e.target.value;
        createDeposit();
    });
});

// Create deposit based on selected gateway
async function createDeposit() {
    const qrSection = document.getElementById('qrSection');
    qrSection.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner"></i><p>Menyiapkan QRIS...</p></div>`;
    document.getElementById('paymentInfo').style.display = 'none';
    
    if (currentGateway === 'zakki') {
        await createZakkiDeposit();
    } else {
        await createRamashopDeposit();
    }
}

// Zakki Gateway
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
    const qrSection = document.getElementById('qrSection');
    qrSection.innerHTML = `
        <div class="status-badge status-pending">
            <i class="fas fa-clock"></i> Menunggu Pembayaran
        </div>
        <div class="qr-image">
            <img src="${data.qris_image}" alt="QRIS Code" onerror="this.src='https://placehold.co/220x220/1a1d24/4facfe?text=QRIS'">
        </div>
        <div class="payment-info-box">
            <p><strong>Total Bayar:</strong> Rp ${formatNumber(data.rincian?.total_bayar || total)}</p>
            <p><strong>Kode Unik:</strong> ${data.rincian?.kode_unik || '-'}</p>
        </div>
    `;
    document.getElementById('paymentInfo').style.display = 'block';
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

// Ramashop Gateway
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
    const qrSection = document.getElementById('qrSection');
    qrSection.innerHTML = `
        <div class="status-badge status-pending">
            <i class="fas fa-clock"></i> Menunggu Pembayaran
        </div>
        <div class="qr-image">
            <img src="${data.qrImage}" alt="QRIS Code" onerror="this.src='https://placehold.co/220x220/1a1d24/4facfe?text=QRIS'">
        </div>
        <div class="payment-info-box">
            <p><strong>Total Bayar:</strong> Rp ${formatNumber(data.totalAmount || total)}</p>
            <p><strong>Kode Unik:</strong> ${data.uniqueCode || '-'}</p>
        </div>
    `;
    document.getElementById('paymentInfo').style.display = 'block';
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

// Countdown timer
function startCountdown(expiredAt) {
    const expiredTime = new Date(expiredAt).getTime();
    const countdownEl = document.getElementById('countdown');
    
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expiredTime - now;
        
        if (distance <= 0) {
            clearInterval(interval);
            countdownEl.innerHTML = '⏰ QRIS Kadaluarsa, silakan buat baru';
        } else {
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            countdownEl.innerHTML = `⏰ Kadaluarsa dalam: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Payment success
async function paymentSuccess() {
    clearInterval(statusInterval);
    
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
    
    // Reduce stock
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

// Initialize
loadCheckoutData();
createDeposit();