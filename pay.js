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

async function loadCheckoutData() {
    cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    total = parseInt(localStorage.getItem('checkoutTotal')) || 0;
    orderData = JSON.parse(localStorage.getItem('orderData')) || {};
    loadActiveGateways();
    
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
    
    console.log('📦 Loaded cart:', cart);
    console.log('💰 Total:', total);
    console.log('📋 Order type:', orderData.type);
    
    if (cart.length === 0) {
        window.location.href = 'rayy-store.com.html';
        return;
    }
    
    displayOrderSummary();
    
    if (isTotalGratis()) {
        showNotification('🎉 Total Rp 0! Langsung konfirmasi pesanan.', 'success');
        setTimeout(() => {
            if (orderData.type === 'panel') {
                paymentSuccessPanelGratis();
            } else {
                paymentSuccessGratis();
            }
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

// KHUSUS PANEL GRATIS
async function paymentSuccessPanelGratis() {
    if (statusInterval) clearInterval(statusInterval);
    if (window.countdownInterval) clearInterval(window.countdownInterval);
    
    clearExistingDeposit();
    
    const orderId = Date.now().toString();
    const buyerName = orderData.buyerName || localStorage.getItem('buyerName') || 'Customer';
    const buyerPhone = orderData.userPhone || localStorage.getItem('userPhone') || '';
    const productName = cart[0]?.name || 'Panel UNLIMITED';
    const productPrice = cart[0]?.price || total || 15000;
    
    const panelOrderData = {
        orderId: orderId,
        type: 'panel',
        buyerName: buyerName,
        buyerPhone: buyerPhone,
        productName: productName,
        productPrice: productPrice,
        total: total,
        panelUsername: orderData.panelUsername,
        panelPassword: orderData.panelPassword,
        ramSize: 0,
        ramLabel: '♾️ UNLIMITED',
        cpu: 0,
        disk: 0,
        status: 'pending',
        isPaid: true,
        isGratis: true,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        voucherCode: orderData.voucherCode,
        voucherDiscount: orderData.voucherDiscount
    };
    
    try {
        const panelOrderRef = database.ref('panel_orders').push();
        await panelOrderRef.set(panelOrderData);
        console.log('✅ Data panel gratis disimpan ke panel_orders');
        
        localStorage.setItem('lastOrderId', panelOrderRef.key);
        localStorage.setItem('lastOrderData', JSON.stringify(panelOrderData));
        localStorage.setItem('buyerName', buyerName);
        
        showNotification('✅ Pesanan panel gratis berhasil! Menunggu bot membuat panel...', 'success');
        
        setTimeout(() => {
            window.location.href = 'panel-data.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error saving panel order:', error);
        showNotification('Gagal menyimpan data, silakan hubungi admin', 'error');
    }
}

// KHUSUS PANEL BERBAYAR - setelah pembayaran sukses
async function paymentSuccessPanelPaid(orderIdBaru, depositIdValue) {
    if (statusInterval) clearInterval(statusInterval);
    if (window.countdownInterval) clearInterval(window.countdownInterval);
    
    clearExistingDeposit();
    
    const buyerName = orderData.buyerName || localStorage.getItem('buyerName') || 'Customer';
    const buyerPhone = orderData.userPhone || localStorage.getItem('userPhone') || '';
    const productName = cart[0]?.name || 'Panel UNLIMITED';
    const productPrice = cart[0]?.price || total || 15000;
    
    const panelOrderData = {
        orderId: orderIdBaru,
        type: 'panel',
        buyerName: buyerName,
        buyerPhone: buyerPhone,
        productName: productName,
        productPrice: productPrice,
        total: total,
        panelUsername: orderData.panelUsername,
        panelPassword: orderData.panelPassword,
        ramSize: 0,
        ramLabel: '♾️ UNLIMITED',
        cpu: 0,
        disk: 0,
        status: 'pending',
        isPaid: true,
        isGratis: false,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        depositId: depositIdValue,
        gateway: currentGateway
    };
    
    try {
        const panelOrderRef = database.ref('panel_orders').push();
        await panelOrderRef.set(panelOrderData);
        console.log('✅ Data panel berbayar disimpan ke panel_orders');
        
        localStorage.setItem('lastOrderId', panelOrderRef.key);
        localStorage.setItem('lastOrderData', JSON.stringify(panelOrderData));
        localStorage.setItem('buyerName', buyerName);
        
        showNotification('✅ Pembayaran berhasil! Panel akan segera dibuat...', 'success');
        
        setTimeout(() => {
            window.location.href = 'panel-data.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error saving panel order:', error);
        showNotification('Gagal menyimpan data, silakan hubungi admin', 'error');
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
            console.log('⚠️ Deposit sudah kadaluarsa, membuat baru...');
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

async function sendPaymentNotification(type, data) {
    try {
        const notifRef = database.ref(`${type}_notifications`);
        await notifRef.push({
            type: type,
            data: data,
            timestamp: Date.now()
        });
        console.log(`✅ Notifikasi ${type} terkirim ke Firebase`);
    } catch (error) {
        console.error(`❌ Gagal kirim notifikasi ${type}:`, error);
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

async function sendToTelegram(message, replyMarkup = null) {
    try {
        const TELEGRAM_BOT_TOKEN = "8277063637:AAHUkTG_InkhLl3FV2GN-nMEz0P-pk8_z2Q";
        const BOT_OWNER_ID = "6709377378";
        
        const body = {
            chat_id: BOT_OWNER_ID,
            text: message,
            parse_mode: 'Markdown'
        };
        if (replyMarkup) {
            body.reply_markup = replyMarkup;
        }
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        console.log('✅ Notifikasi Telegram terkirim');
        return true;
    } catch (error) {
        console.error('❌ Gagal kirim Telegram:', error);
        return false;
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
            
            // KIRIM NOTIFIKASI QR DIGENERATE KE BOT
            const buyerName = orderData.buyerName || localStorage.getItem('userName');
            const produkList = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
            const notifMessage = `🟡 *QRIS TELAH DIGENERATE* 🟡\n\n` +
                `👤 *Pembeli:* ${buyerName}\n` +
                `📱 *No WA:* ${localStorage.getItem('userPhone') || '-'}\n` +
                `📦 *Produk:* ${produkList}\n` +
                `💰 *Total:* Rp ${formatNumberPay(total)}\n` +
                `🆔 *Deposit ID:* ${depositId}\n` +
                `⏰ *Kadaluarsa:* ${new Date(data.data.expired_at).toLocaleString('id-ID')}\n\n` +
                `📌 *Status:* Menunggu pembayaran dari pembeli`;
            
            await sendToTelegram(notifMessage);
            await sendPaymentNotification('payment_qr_generated', {
                orderId: depositId,
                userName: buyerName,
                total: total,
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
    
    let successSent = false;
    
    statusInterval = setInterval(async () => {
        try {
            const response = await fetch(`https://qris.zakki.store/cektopup?idtopup=${id}`);
            const data = await response.json();
            
            console.log('🔍 Status Check:', data);
            
            if (data && data.kategori_status === 'SUCCESS' && !successSent) {
                successSent = true;
                clearInterval(statusInterval);
                clearExistingDeposit();
                
                const buyerName = orderData.buyerName || localStorage.getItem('userName');
                const buyerPhone = localStorage.getItem('userPhone') || '';
                const produkList = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
                const orderIdDB = Date.now().toString();
                
                // KIRIM NOTIFIKASI KE BOT
                const notifMessage = `✅ *PEMBAYARAN BERHASIL* ✅\n\n` +
                    `👤 *Pembeli:* ${buyerName}\n` +
                    `📱 *No WA:* ${buyerPhone}\n` +
                    `📦 *Produk:* ${produkList}\n` +
                    `💰 *Total:* Rp ${formatNumberPay(total)}\n` +
                    `🆔 *Deposit ID:* ${id}\n` +
                    `🆔 *Order ID:* ${orderIdDB}\n` +
                    `💳 *Gateway:* Zakki Store\n` +
                    `🕐 *Waktu Bayar:* ${new Date().toLocaleString('id-ID')}\n\n` +
                    `📌 *Pilih aksi di bawah untuk memproses pesanan:*`;
                
                const replyMarkup = {
                    inline_keyboard: [
                        [{ text: "✅ SETUJUI & PROSES", callback_data: `approvesewa_${orderIdDB}` }],
                        [{ text: "❌ TOLAK", callback_data: `rejectsewa_${orderIdDB}` }]
                    ]
                };
                
                await sendToTelegram(notifMessage, replyMarkup);
                await sendPaymentNotification('payment_success', {
                    orderId: orderIdDB,
                    userName: buyerName,
                    userPhone: buyerPhone,
                    products: produkList,
                    total: total,
                    gateway: 'zakki',
                    paidAt: Date.now()
                });
                
                // 🔥 CEK APAKAH INI PESANAN PANEL
                const isPanelOrder = (orderData.type === 'panel');
                
                if (isPanelOrder) {
                    // PANEL: langsung proses dan redirect ke panel-data
                    await paymentSuccessPanelPaid(orderIdDB, id);
                } else {
                    // BUKAN PANEL: simpan ke sewa_orders dulu
                    const sewaOrderData = {
                        orderId: orderIdDB,
                        buyerName: buyerName,
                        buyerPhone: buyerPhone,
                        linkGroup: orderData.linkGroup || '',
                        durasi: orderData.durasi || 7,
                        productName: cart[0]?.name || 'Produk',
                        productPrice: cart[0]?.price || total,
                        cart: cart,
                        total: total,
                        gateway: 'zakki',
                        depositId: id,
                        status: 'pending_approval',
                        isPaid: true,
                        paidAt: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    };
                    
                    await database.ref('sewa_orders').push(sewaOrderData);
                    
                    localStorage.setItem('lastOrderId', orderIdDB);
                    localStorage.setItem('lastOrderData', JSON.stringify(sewaOrderData));
                    
                    // Tampilkan di web
                    const qrSection = document.getElementById('qrSection');
                    if (qrSection) {
                        qrSection.innerHTML = `
                            <div class="status-badge status-success">
                                <i class="fas fa-check-circle"></i> Pembayaran Berhasil!
                            </div>
                            <div style="text-align:center; padding:20px;">
                                <i class="fas fa-spinner fa-pulse" style="font-size:48px; color:#4facfe;"></i>
                                <p>Menunggu konfirmasi admin...</p>
                                <p style="font-size:12px; color:#888;">Halaman akan otomatis refresh setelah dikonfirmasi</p>
                            </div>
                        `;
                    }
                    
                    // Mulai cek status approval
                    checkApprovalStatus(orderIdDB);
                }
                
            } else if (data && data.kategori_status === 'EXPIRED') {
                clearInterval(statusInterval);
                await sendToTelegram(`⏰ *PEMBAYARAN KADALUARSA*\n\n🆔 Deposit ID: ${id}\n👤 Pembeli: ${orderData?.buyerName || 'Customer'}\n💰 Total: Rp ${formatNumberPay(total)}`);
            }
            
        } catch (err) {
            console.error('Error cek status:', err);
        }
    }, 5000);
}

// Cek status approval untuk non-panel
async function checkApprovalStatus(orderIdDB) {
    const approvalRef = database.ref(`sewa_orders/${orderIdDB}`);
    const interval = setInterval(async () => {
        const snapshot = await approvalRef.once('value');
        const order = snapshot.val();
        
        if (order && order.status === 'active') {
            clearInterval(interval);
            showNotification('✅ Pesanan disetujui! Mengalihkan...', 'success');
            setTimeout(() => {
                window.location.href = 'upload-bukti.html';
            }, 1500);
        } else if (order && order.status === 'rejected') {
            clearInterval(interval);
            showNotification('❌ Pesanan ditolak! Silakan hubungi admin.', 'error');
            setTimeout(() => {
                window.location.href = 'rayy-store.com.html';
            }, 2000);
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
                    
                    // CEK APAKAH INI PESANAN PANEL
                    const isPanelOrder = (orderData.type === 'panel');
                    if (isPanelOrder) {
                        await paymentSuccessPanelPaid(Date.now().toString(), id);
                    } else {
                        paymentSuccess();
                    }
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

async function paymentSuccess() {
    if (statusInterval) clearInterval(statusInterval);
    if (window.countdownInterval) clearInterval(window.countdownInterval);
    
    clearExistingDeposit();
    
    const orderId = Date.now().toString();
    const buyerName = orderData.buyerName || localStorage.getItem('buyerName') || 'Customer';
    const buyerPhone = orderData.buyerPhone || localStorage.getItem('userPhone') || '';
    const linkGroup = orderData.linkGroup || '';
    const durasi = orderData.durasi || 7;
    const productName = cart[0]?.name || 'Sewa Bot';
    const productPrice = cart[0]?.price || total;
    
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
    
    try {
        const sewaOrderRef = database.ref('sewa_orders').push();
        await sewaOrderRef.set(sewaOrderData);
        console.log('✅ Data disimpan ke sewa_orders dengan ID:', sewaOrderRef.key);
        
        localStorage.setItem('lastOrderId', sewaOrderRef.key);
        localStorage.setItem('lastOrderData', JSON.stringify(sewaOrderData));
        localStorage.setItem('buyerName', buyerName);
        
        showNotification('✅ Pembayaran berhasil! Menunggu konfirmasi admin...', 'success');
        
        // Tampilkan pesan menunggu di halaman
        const qrSection = document.getElementById('qrSection');
        if (qrSection) {
            qrSection.innerHTML = `
                <div class="status-badge status-success">
                    <i class="fas fa-check-circle"></i> Pembayaran Berhasil!
                </div>
                <div style="text-align:center; padding:20px;">
                    <i class="fas fa-spinner fa-pulse" style="font-size:48px; color:#4facfe;"></i>
                    <p>Menunggu konfirmasi admin...</p>
                    <p style="font-size:12px; color:#888;">Halaman akan otomatis refresh setelah dikonfirmasi</p>
                </div>
            `;
        }
        
        // Cek status approval
        checkApprovalStatus(sewaOrderRef.key);
        
    } catch (error) {
        console.error('Error saving to database:', error);
        showNotification('Gagal menyimpan data, silakan hubungi admin', 'error');
    }
}

async function paymentSuccessGratis() {
    const orderId = Date.now().toString();
    const buyerName = orderData.buyerName || localStorage.getItem('buyerName') || 'Customer';
    const buyerPhone = orderData.buyerPhone || localStorage.getItem('userPhone') || '';
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
    
    try {
        const sewaOrderRef = database.ref('sewa_orders').push();
        await sewaOrderRef.set(sewaOrderData);
        
        localStorage.setItem('lastOrderId', sewaOrderRef.key);
        localStorage.setItem('lastOrderData', JSON.stringify(sewaOrderData));
        localStorage.setItem('buyerName', buyerName);
        
        showNotification('🎉 Pesanan gratis berhasil! Menunggu konfirmasi admin...', 'success');
        
        const qrSection = document.getElementById('qrSection');
        if (qrSection) {
            qrSection.innerHTML = `
                <div class="status-badge status-success">
                    <i class="fas fa-check-circle"></i> Pesanan Gratis!
                </div>
                <div style="text-align:center; padding:20px;">
                    <i class="fas fa-spinner fa-pulse" style="font-size:48px; color:#4facfe;"></i>
                    <p>Menunggu konfirmasi admin...</p>
                </div>
            `;
        }
        
        checkApprovalStatus(sewaOrderRef.key);
        
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