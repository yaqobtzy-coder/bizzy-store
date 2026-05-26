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

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

async function submitData() {
    const requiredFields = {
        ownerName: 'Nama Owner',
        ownerPhone: 'Nomor Owner',
        botNumber: 'Nomor Bot',
        botName1: 'Nama Bot 1',
        botName2: 'Nama Bot 2',
        botName3: 'Nama Bot 3',
        customPairing: 'Custom Pairing',
        packageSticker: 'Package Sticker',
        authorStc: 'Author STC'
    };
    
    for (const [id, name] of Object.entries(requiredFields)) {
        const value = document.getElementById(id).value.trim();
        if (!value) {
            alert(`Isi ${name} terlebih dahulu!`);
            return;
        }
    }
    
    showLoading();
    
    const scriptData = {
        type: 'script',
        wajib: {
            ownerName: document.getElementById('ownerName').value.trim(),
            ownerPhone: document.getElementById('ownerPhone').value.trim(),
            botNumber: document.getElementById('botNumber').value.trim(),
            botName1: document.getElementById('botName1').value.trim(),
            botName2: document.getElementById('botName2').value.trim(),
            botName3: document.getElementById('botName3').value.trim(),
            customPairing: document.getElementById('customPairing').value.trim(),
            packageSticker: document.getElementById('packageSticker').value.trim(),
            authorStc: document.getElementById('authorStc').value.trim()
        },
        opsional: {
            linkGroup: document.getElementById('linkGroup').value.trim(),
            linkChannel: document.getElementById('linkChannel').value.trim(),
            channelName: document.getElementById('channelName').value.trim()
        },
        cart: cart,
        total: total,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('orderData', JSON.stringify(scriptData));
    localStorage.setItem('buyerName', scriptData.wajib.ownerName);
    
    if (typeof notifyOrderProcessing !== 'undefined') {
        const processingData = {
            id: Date.now().toString(),
            type: 'script',
            cart: cart,
            total: total,
            customerData: scriptData,
            status: 'data_filled',
            createdAt: new Date().toISOString()
        };
        await notifyOrderProcessing(processingData);
    }
    
    hideLoading();
    window.location.href = 'pay.html';
}

loadCartData();