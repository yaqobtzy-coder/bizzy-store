let selectedFile = null;
let orderId = null;
let orderData = null;
let buyerName = '';
let approvalCheckInterval = null;
let isProcessing = false;

// WA Bot Config
const WA_BOT_GROUP_ID = "120363425398406088@g.us";

// Kirim perintah ke WA Bot via Firebase
async function sendToWABot(groupId, command) {
    try {
        await database.ref('wa_bot_commands').push({
            groupId: groupId,
            command: command,
            status: "pending",
            createdAt: new Date().toISOString()
        });
        console.log(`✅ Perintah disimpan ke Firebase: ${command}`);
        return true;
    } catch (error) {
        console.error('Gagal kirim ke WA bot:', error);
        return false;
    }
}

// Kirim perintah addsewagc
async function sendAddSewaCommand(linkGroup, durasi) {
    const command = `.addsewagc ${linkGroup} ${durasi}`;
    return await sendToWABot(WA_BOT_GROUP_ID, command);
}

// Load order info dari localStorage
function loadOrderInfo() {
    orderId = localStorage.getItem('lastOrderId');
    const orderDataStr = localStorage.getItem('lastOrderData');
    buyerName = localStorage.getItem('buyerName') || localStorage.getItem('userName') || 'Customer';
    const buyerPhone = localStorage.getItem('userPhone') || '';
    
    if (orderDataStr) {
        orderData = JSON.parse(orderDataStr);
    }
    
    const container = document.getElementById('orderInfo');
    if (!container) return;
    
    let productsHtml = '';
    let total = 0;
    
    if (orderData && orderData.cart) {
        orderData.cart.forEach(item => {
            productsHtml += `<p>📦 ${escapeHtml(item.name)} x${item.quantity} = Rp ${formatNumber(item.price * item.quantity)}</p>`;
            total += item.price * item.quantity;
        });
    } else if (orderData && orderData.productName) {
        productsHtml += `<p>📦 ${escapeHtml(orderData.productName)} x1 = Rp ${formatNumber(orderData.productPrice || 0)}</p>`;
        total = orderData.productPrice || orderData.total || 0;
    }
    
    const isGratis = (total === 0 || orderData?.total === 0);
    
    container.innerHTML = `
        <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
        ${productsHtml}
        <p><strong style="color:${isGratis ? '#28a745' : '#00f2fe'};">Total: ${isGratis ? '🎉 GRATIS!' : 'Rp ' + formatNumber(total)}</strong></p>
        <p><strong>Pembeli:</strong> ${escapeHtml(buyerName)}</p>
        <p><strong>No WhatsApp:</strong> ${escapeHtml(buyerPhone) || '-'}</p>
        ${orderData && orderData.isRenew ? '<p><strong style="color:#f59e0b;">🔄 Perpanjangan Sewa</strong></p>' : ''}
        ${orderData && orderData.type === 'panel' ? '<p><strong style="color:#3b82f6;">🖥️ Panel Hosting</strong></p>' : ''}
    `;
}

// CEK STATUS APPROVAL DARI BOT (untuk non-panel)
async function checkApprovalStatus() {
    if (!orderId || isProcessing) return;
    
    try {
        const snapshot = await database.ref(`sewa_orders/${orderId}`).once('value');
        const order = snapshot.val();
        
        if (order) {
            console.log('📊 Status pesanan:', order.status);
            
            if (order.status === 'active') {
                // Disetujui
                isProcessing = true;
                if (approvalCheckInterval) {
                    clearInterval(approvalCheckInterval);
                    approvalCheckInterval = null;
                }
                showNotification('✅ Pesanan disetujui! Mengalihkan...', 'success');
                
                // Simpan data untuk done2
                const doneData = {
                    buyerName: buyerName,
                    productsText: order.productName || (order.cart ? order.cart.map(i => i.name).join(', ') : 'Produk'),
                    totalAmount: order.total || 0,
                    orderId: orderId,
                    isSewaOrder: true,
                    linkGroup: order.linkGroup,
                    durasi: order.durasi,
                    isRenew: order.isRenew || false
                };
                localStorage.setItem('doneData', JSON.stringify(doneData));
                
                setTimeout(() => {
                    window.location.href = 'done2.html';
                }, 1500);
                
            } else if (order.status === 'rejected') {
                // Ditolak
                isProcessing = true;
                if (approvalCheckInterval) {
                    clearInterval(approvalCheckInterval);
                    approvalCheckInterval = null;
                }
                showNotification('❌ Pesanan ditolak! Silakan hubungi admin.', 'error');
                setTimeout(() => {
                    window.location.href = 'rayy-store.com.html';
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error checking approval:', error);
    }
}

// Cek status panel (untuk panel)
async function checkPanelStatus() {
    if (!orderId || isProcessing) return;
    
    try {
        const snapshot = await database.ref(`panel_orders/${orderId}`).once('value');
        const panel = snapshot.val();
        
        if (panel) {
            console.log('🖥️ Status panel:', panel.status);
            
            if (panel.status === 'done') {
                isProcessing = true;
                if (approvalCheckInterval) {
                    clearInterval(approvalCheckInterval);
                    approvalCheckInterval = null;
                }
                showNotification('✅ Panel berhasil dibuat! Mengalihkan...', 'success');
                setTimeout(() => {
                    window.location.href = 'panel-data.html';
                }, 1500);
            } else if (panel.status === 'failed') {
                isProcessing = true;
                if (approvalCheckInterval) {
                    clearInterval(approvalCheckInterval);
                    approvalCheckInterval = null;
                }
                showNotification('❌ Gagal membuat panel! Silakan hubungi admin.', 'error');
            }
        }
    } catch (error) {
        console.error('Error checking panel status:', error);
    }
}

// Mulai cek status
function startStatusCheck() {
    // Hentikan interval sebelumnya jika ada
    if (approvalCheckInterval) {
        clearInterval(approvalCheckInterval);
        approvalCheckInterval = null;
    }
    
    // Cek apakah ini pesanan panel
    const isPanel = (orderData && orderData.type === 'panel');
    
    if (isPanel) {
        // Untuk panel: cek status panel_orders
        approvalCheckInterval = setInterval(() => {
            checkPanelStatus();
        }, 3000);
    } else {
        // Untuk non-panel: cek status sewa_orders
        approvalCheckInterval = setInterval(() => {
            checkApprovalStatus();
        }, 3000);
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

// Upload area click
const uploadArea = document.getElementById('uploadArea');
if (uploadArea) {
    uploadArea.onclick = () => {
        document.getElementById('fileInput').click();
    };
}

// File input change
const fileInput = document.getElementById('fileInput');
if (fileInput) {
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showNotification('File terlalu besar! Maksimal 5MB', 'error');
                return;
            }
            
            selectedFile = file;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('previewImage');
                if (preview) preview.src = e.target.result;
                const previewContainer = document.getElementById('previewContainer');
                if (previewContainer) previewContainer.style.display = 'block';
                if (uploadArea) uploadArea.style.display = 'none';
                const submitBtn = document.getElementById('submitBtn');
                if (submitBtn) submitBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    };
}

function removeImage() {
    selectedFile = null;
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) previewContainer.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
    if (fileInput) fileInput.value = '';
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = true;
}

// Submit button
const submitBtn = document.getElementById('submitBtn');
if (submitBtn) {
    submitBtn.onclick = async () => {
        if (!selectedFile) return;
        
        const submitBtnEl = document.getElementById('submitBtn');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        submitBtnEl.disabled = true;
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                const imageUrl = data.data.url;
                const buyerPhone = localStorage.getItem('userPhone') || '';
                
                if (orderId) {
                    await database.ref('orders/' + orderId).update({
                        paymentProof: imageUrl,
                        paymentProofUploadedAt: new Date().toISOString(),
                        status: 'completed'
                    });
                }
                
                const paymentId = Date.now().toString();
                await database.ref('payments/' + paymentId).set({
                    orderId: orderId,
                    imageUrl: imageUrl,
                    buyerName: buyerName,
                    buyerPhone: buyerPhone,
                    uploadedAt: new Date().toISOString(),
                    status: 'pending_verification'
                });
                
                // KIRIM NOTIFIKASI UPLOAD BUKTI KE TELEGRAM
                if (typeof sendTelegramNotification !== 'undefined') {
                    let produkText = '';
                    let totalAmount = 0;
                    if (orderData && orderData.cart) {
                        produkText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
                        totalAmount = orderData.total || 0;
                    } else if (orderData && orderData.productName) {
                        produkText = orderData.productName;
                        totalAmount = orderData.productPrice || 0;
                    }
                    
                    const messageTelegram = `📸 *UPLOAD BUKTI PEMBAYARAN* 📸\n\n` +
                        `🆔 *Order ID:* ${orderId || paymentId}\n` +
                        `👤 *Pembeli:* ${buyerName}\n` +
                        `📱 *No WA:* ${buyerPhone || '-'}\n` +
                        `📦 *Produk:* ${produkText || '-'}\n` +
                        `💰 *Total:* Rp ${formatNumber(totalAmount)}\n` +
                        `🔗 *Link Bukti:* ${imageUrl}\n` +
                        `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}\n\n` +
                        `📌 *Status:* Menunggu verifikasi admin`;
                    
                    await sendTelegramNotification(messageTelegram);
                }
                
                // Panggil fungsi notifikasi jika ada
                if (typeof notifyUploadBukti !== 'undefined') {
                    const total = orderData?.total || 0;
                    await notifyUploadBukti(orderId, buyerName, total, imageUrl);
                }
                
                // Siapkan data untuk done2
                let productsText = '';
                let totalAmount = 0;
                let isSewaOrder = false;
                let linkGroup = '';
                let durasi = 1;
                let isRenew = false;
                let isPanelOrder = false;
                
                if (orderData && orderData.cart) {
                    const productNames = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
                    productsText = productNames;
                    totalAmount = orderData.total || 0;
                    
                    if (orderData.type === 'sewa') {
                        isSewaOrder = true;
                        linkGroup = orderData.linkGroup || '';
                        durasi = orderData.durasi || 1;
                        isRenew = orderData.isRenew || false;
                        if (orderData.cart && orderData.cart[0] && orderData.cart[0].duration) {
                            const durationMatch = orderData.cart[0].duration.match(/(\d+)/);
                            if (durationMatch) durasi = parseInt(durationMatch[1]);
                        }
                    } else if (orderData.type === 'panel') {
                        isPanelOrder = true;
                    }
                } else if (orderData && orderData.type === 'panel') {
                    isPanelOrder = true;
                    productsText = orderData.productName || 'Panel UNLIMITED';
                    totalAmount = orderData.productPrice || 0;
                }
                
                // Kirim perintah ke WA Bot untuk sewa
                if (isSewaOrder && linkGroup && !isRenew) {
                    await sendAddSewaCommand(linkGroup, durasi);
                    showNotification(`✅ Perintah sewa ${durasi} hari telah dikirim ke bot!`, 'success');
                } else if (isSewaOrder && isRenew) {
                    showNotification(`✅ Perpanjangan sewa ${durasi} hari berhasil! Bot tetap aktif.`, 'success');
                }
                
                // Simpan data untuk done2
                const doneData = {
                    imgbbUrl: imageUrl,
                    buyerName: buyerName,
                    productsText: productsText,
                    totalAmount: totalAmount,
                    orderId: orderId,
                    orderData: orderData,
                    isSewaOrder: isSewaOrder,
                    isPanelOrder: isPanelOrder,
                    linkGroup: linkGroup,
                    durasi: durasi,
                    isRenew: isRenew
                };
                
                localStorage.setItem('doneData', JSON.stringify(doneData));
                console.log('Data saved to localStorage:', doneData);
                
                if (loadingOverlay) {
                    loadingOverlay.innerHTML = `
                        <div class="loading-content">
                            <i class="fas fa-check-circle" style="color: #28a745;"></i>
                            <p>Upload berhasil! Mengalihkan...</p>
                        </div>
                    `;
                }
                
                // Redirect ke done2 untuk menunggu approval
                setTimeout(() => {
                    window.location.href = 'done2.html';
                }, 1500);
                
            } else {
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                showNotification('Gagal upload: ' + (data.error?.message || 'Unknown error'), 'error');
                submitBtnEl.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            showNotification('Gagal terhubung ke server', 'error');
            submitBtnEl.disabled = false;
        }
    };
}

// Inisialisasi
loadOrderInfo();
startStatusCheck();

// Cleanup interval saat halaman ditutup
window.addEventListener('beforeunload', function() {
    if (approvalCheckInterval) {
        clearInterval(approvalCheckInterval);
    }
});

// Export ke global
window.removeImage = removeImage;