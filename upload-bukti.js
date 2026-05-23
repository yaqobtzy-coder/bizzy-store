let selectedFile = null;
let orderId = null;
let orderData = null;
let buyerName = '';

// Load order info
function loadOrderInfo() {
    orderId = localStorage.getItem('lastOrderId');
    const orderDataStr = localStorage.getItem('lastOrderData');
    buyerName = localStorage.getItem('buyerName') || localStorage.getItem('userName') || 'Customer';
    
    if (orderDataStr) {
        orderData = JSON.parse(orderDataStr);
    }
    
    const container = document.getElementById('orderInfo');
    let productsHtml = '';
    let total = 0;
    
    if (orderData && orderData.cart) {
        orderData.cart.forEach(item => {
            productsHtml += `<p>📦 ${escapeHtml(item.name)} x${item.quantity} = Rp ${formatNumber(item.price * item.quantity)}</p>`;
            total += item.price * item.quantity;
        });
    }
    
    container.innerHTML = `
        <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
        ${productsHtml}
        <p><strong style="color:#00f2fe;">Total: Rp ${formatNumber(total)}</strong></p>
        <p><strong>Pembeli:</strong> ${escapeHtml(buyerName)}</p>
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

// Upload area click
document.getElementById('uploadArea').onclick = () => {
    document.getElementById('fileInput').click();
};

// File input change
document.getElementById('fileInput').onchange = (e) => {
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
            preview.src = e.target.result;
            document.getElementById('previewContainer').style.display = 'block';
            document.getElementById('uploadArea').style.display = 'none';
            document.getElementById('submitBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    }
};

function removeImage() {
    selectedFile = null;
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('fileInput').value = '';
    document.getElementById('submitBtn').disabled = true;
}

// Submit button - upload to ImgBB and save to localStorage
document.getElementById('submitBtn').onclick = async () => {
    if (!selectedFile) return;
    
    const submitBtn = document.getElementById('submitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    submitBtn.disabled = true;
    loadingOverlay.style.display = 'flex';
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    try {
        // Upload to ImgBB
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const imageUrl = data.data.url;
            
            // Save to Firebase
            if (orderId) {
                await database.ref('orders/' + orderId).update({
                    paymentProof: imageUrl,
                    paymentProofUploadedAt: new Date().toISOString(),
                    status: 'completed'
                });
            }
            
            // Save to payments collection
            const paymentId = Date.now().toString();
            await database.ref('payments/' + paymentId).set({
                orderId: orderId,
                imageUrl: imageUrl,
                buyerName: buyerName,
                uploadedAt: new Date().toISOString(),
                status: 'pending_verification'
            });
            
            // Kirim notifikasi upload bukti ke Telegram
            if (typeof notifyUploadBukti !== 'undefined') {
                const total = orderData?.total || 0;
                await notifyUploadBukti(orderId, buyerName, total, imageUrl);
            }
            
            // Prepare data for done2.html
            let productsText = '';
            let totalAmount = 0;
            if (orderData && orderData.cart) {
                const productNames = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
                productsText = productNames;
                totalAmount = orderData.total || 0;
            }
            
            // Save ALL data to localStorage for done2.html
            const doneData = {
                imgbbUrl: imageUrl,
                buyerName: buyerName,
                productsText: productsText,
                totalAmount: totalAmount,
                orderId: orderId,
                orderData: orderData
            };
            
            localStorage.setItem('doneData', JSON.stringify(doneData));
            console.log('Data saved to localStorage:', doneData);
            
            loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <i class="fas fa-check-circle" style="color: #28a745;"></i>
                    <p>Upload berhasil! Mengalihkan...</p>
                </div>
            `;
            
            // Redirect to done2.html (BUKAN done.html)
            setTimeout(() => {
                window.location.href = 'done2.html';
            }, 1500);
            
        } else {
            loadingOverlay.style.display = 'none';
            showNotification('Gagal upload: ' + (data.error?.message || 'Unknown error'), 'error');
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        loadingOverlay.style.display = 'none';
        showNotification('Gagal terhubung ke server', 'error');
        submitBtn.disabled = false;
    }
};

// Initialize
loadOrderInfo();