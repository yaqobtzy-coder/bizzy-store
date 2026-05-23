let cart = [];
let total = 0;

// Load cart data
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
            <span>Total</span>
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

async function submitData() {
    const buyerName = document.getElementById('buyerName').value.trim();
    const buyerPhone = document.getElementById('buyerPhone').value.trim();
    const linkGroup = document.getElementById('linkGroup').value.trim();
    
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
    
    // Save data sewa
    const orderData = {
        type: 'sewa',
        buyerName: buyerName,
        buyerPhone: buyerPhone,
        linkGroup: linkGroup,
        cart: cart,
        total: total,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('orderData', JSON.stringify(orderData));
    localStorage.setItem('buyerName', buyerName);
    
    // Kirim notifikasi ke Telegram bahwa data sewa telah diisi
    if (typeof notifyOrderProcessing !== 'undefined') {
        const processingData = {
            id: Date.now().toString(),
            type: 'sewa',
            cart: cart,
            total: total,
            customerData: orderData,
            status: 'data_filled',
            createdAt: new Date().toISOString()
        };
        await notifyOrderProcessing(processingData);
    }
    
    window.location.href = 'pay.html';
}

loadCartData();