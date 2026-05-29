let selectedFile = null;
let orderId = null;
let orderData = null;
let buyerName = '';

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

// Load order info
function loadOrderInfo() {
    orderId = localStorage.getItem('lastOrderId');
    const orderDataStr = localStorage.getItem('lastOrderData');
    buyerName = localStorage.getItem('buyerName') || localStorage.getItem('userName') || 'Customer';
    
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
    }
    
    const isGratis = (total === 0 || orderData?.total === 0);
    
    container.innerHTML = `
        <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
        ${productsHtml}
        <p><strong style="color:${isGratis ? '#28a745' : '#00f2fe'};">Total: ${isGratis ? '🎉 GRATIS!' : 'Rp ' + formatNumber(total)}</strong></p>
        <p><strong>Pembeli:</strong> ${escapeHtml(buyerName)}</p>
        ${orderData && orderData.isRenew ? '<p><strong style="color:#f59e0b;">🔄 Perpanjangan Sewa</strong></p>' : ''}
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
                    uploadedAt: new Date().toISOString(),
                    status: 'pending_verification'
                });
                
                if (typeof notifyUploadBukti !== 'undefined') {
                    const total = orderData?.total || 0;
                    await notifyUploadBukti(orderId, buyerName, total, imageUrl);
                }
                
                let productsText = '';
                let totalAmount = 0;
                let isSewaOrder = false;
                let linkGroup = '';
                let durasi = 1;
                let isRenew = false;
                
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
                    }
                }
                
                if (isSewaOrder && linkGroup && !isRenew) {
                    await sendAddSewaCommand(linkGroup, durasi);
                    showNotification(`✅ Perintah sewa ${durasi} hari telah dikirim ke bot!`, 'success');
                } else if (isSewaOrder && isRenew) {
                    showNotification(`✅ Perpanjangan sewa ${durasi} hari berhasil! Bot tetap aktif.`, 'success');
                }
                
                const doneData = {
                    imgbbUrl: imageUrl,
                    buyerName: buyerName,
                    productsText: productsText,
                    totalAmount: totalAmount,
                    orderId: orderId,
                    orderData: orderData,
                    isSewaOrder: isSewaOrder,
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

loadOrderInfo();

window.removeImage = removeImage;