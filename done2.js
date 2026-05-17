const canvas = document.getElementById('doneCanvas');
const ctx = canvas.getContext('2d');

let doneData = null;
let imgbbImage = null;
let canvasImageUrl = '';
let whatsappUrl = '';

// Load data from localStorage
function loadData() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
    
    const dataStr = localStorage.getItem('doneData');
    if (dataStr) {
        doneData = JSON.parse(dataStr);
    }
    
    // If no data, try to get from old storage
    if (!doneData) {
        const imageUrl = localStorage.getItem('doneImageUrl');
        const buyerName = localStorage.getItem('doneBuyerName') || localStorage.getItem('buyerName') || 'Customer';
        const orderData = JSON.parse(localStorage.getItem('doneOrderData') || '{}');
        
        let productsText = '';
        let totalAmount = 0;
        if (orderData && orderData.cart) {
            productsText = orderData.cart.map(item => `${item.name} x${item.quantity}`).join(', ');
            totalAmount = orderData.total || 0;
        }
        
        doneData = {
            imgbbUrl: imageUrl,
            buyerName: buyerName,
            productsText: productsText,
            totalAmount: totalAmount,
            orderData: orderData
        };
    }
    
    if (doneData && doneData.imgbbUrl) {
        imgbbImage = new Image();
        imgbbImage.crossOrigin = "Anonymous";
        imgbbImage.src = doneData.imgbbUrl;
        imgbbImage.onload = () => {
            drawCanvas();
        };
        imgbbImage.onerror = () => {
            console.error('Gagal load gambar dari ImgBB');
            drawCanvas();
        };
    } else {
        drawCanvas();
    }
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function drawCanvas() {
    const w = 1080, h = 1920;
    canvas.width = w;
    canvas.height = h;
    
    // Get data
    const buyerName = doneData?.buyerName || 'Customer';
    const productsText = doneData?.productsText || 'Produk Digital';
    const totalAmount = doneData?.totalAmount || 0;
    
    const tanggal = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Background gradient premium
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#0a0c10');
    gradient.addColorStop(0.5, '#0f1220');
    gradient.addColorStop(1, '#1a1d2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // Border double
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, w-80, h-80);
    
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.strokeRect(52, 52, w-104, h-104);
    
    // Header dengan efek glow
    ctx.shadowColor = '#4facfe';
    ctx.shadowBlur = 10;
    ctx.font = '800 72px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText("✔️ DONE", 80, 140);
    ctx.shadowBlur = 0;
    
    ctx.font = '600 32px "Inter"';
    ctx.fillStyle = '#4facfe';
    ctx.fillText("KONFIRMASI PEMBELIAN", 80, 220);
    
    ctx.font = '700 48px "Inter"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Rayy Store", 80, 300);
    
    // Garis dekoratif
    ctx.beginPath();
    ctx.moveTo(80, 340);
    ctx.lineTo(w - 80, 340);
    ctx.strokeStyle = '#4facfe50';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Foto bukti dari ImgBB di tengah
    const imgW = 600, imgH = 600;
    const imgX = (w - imgW) / 2;
    const imgY = 400;
    
    // Background foto
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 3;
    ctx.strokeRect(imgX, imgY, imgW, imgH);
    
    // Draw image from ImgBB
    if (imgbbImage && imgbbImage.complete && imgbbImage.naturalWidth > 0) {
        const imgRatio = imgbbImage.width / imgbbImage.height;
        const targetRatio = imgW / imgH;
        let drawW, drawH, offX, offY;
        
        if (imgRatio > targetRatio) {
            drawH = imgH;
            drawW = imgbbImage.width * (imgH / imgbbImage.height);
            offX = imgX + (imgW - drawW) / 2;
            offY = imgY;
        } else {
            drawW = imgW;
            drawH = imgbbImage.height * (imgW / imgbbImage.width);
            offX = imgX;
            offY = imgY + (imgH - drawH) / 2;
        }
        ctx.drawImage(imgbbImage, offX, offY, drawW, drawH);
    } else {
        ctx.font = '36px "Inter"';
        ctx.fillStyle = '#888';
        ctx.fillText("📷 Bukti Pembayaran", imgX + 150, imgY + 300);
    }
    
    // Data section
    let startY = imgY + imgH + 80;
    
    // Pembeli
    ctx.font = '600 28px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText("👤 PEMBELI", 80, startY);
    ctx.font = '700 36px "Inter"';
    ctx.fillStyle = '#ffffff';
    const buyerText = buyerName.length > 30 ? buyerName.substring(0, 27) + '...' : buyerName;
    ctx.fillText(buyerText, 80, startY + 55);
    startY += 110;
    
    // Produk
    ctx.font = '600 28px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText("📦 PRODUK", 80, startY);
    ctx.font = '600 32px "Inter"';
    ctx.fillStyle = '#ffffff';
    const productTextWrapped = productsText.length > 40 ? productsText.substring(0, 37) + '...' : productsText;
    ctx.fillText(productTextWrapped, 80, startY + 50);
    startY += 100;
    
    // Total
    ctx.font = '600 28px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText("💰 TOTAL", 80, startY);
    ctx.font = '700 42px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText(`Rp ${formatNumber(totalAmount)}`, 80, startY + 55);
    startY += 110;
    
    // Tanggal
    ctx.font = '600 28px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText("⏱️ TANGGAL", 80, startY);
    ctx.font = '500 28px "Inter"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tanggal, 80, startY + 50);
    
    // Footer
    ctx.font = '400 20px "Inter"';
    ctx.fillStyle = '#888888';
    ctx.fillText("verified by Rayy Store • rayystore.com", w/2 - 220, h - 80);
    
    // Save canvas to admin
    saveToAdmin(buyerName, productsText, totalAmount, tanggal);
    
    // Hide loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'none';
    
    // Convert canvas to URL and send to WhatsApp
    setTimeout(() => {
        convertCanvasToUrlAndSendToWA();
    }, 500);
}

// Convert canvas to URL (data URL / base64)
function convertCanvasToUrlAndSendToWA() {
    try {
        // Convert canvas to data URL (PNG base64)
        canvasImageUrl = canvas.toDataURL('image/png');
        
        // Build WhatsApp message with canvas image URL
        const buyerName = doneData?.buyerName || 'Customer';
        const productsText = doneData?.productsText || 'Produk Digital';
        const totalAmount = doneData?.totalAmount || 0;
        
        // Kirim URL canvas (bukan URL ImgBB)
        const message = `Halo Rayy Store saya *${buyerName}*%0A%0A` +
            `Saya membeli produk:%0A` +
            `📦 *${productsText}*%0A` +
            `💰 *Rp ${formatNumber(totalAmount)}*%0A%0A` +
            `Ini kartu konfirmasi pembayaran saya:%0A` +
            `${canvasImageUrl}%0A%0A` +
            `Mohon untuk diproses 🙏`;
        
        whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        
        // Show WhatsApp section and redirect
        const whatsappSection = document.getElementById('whatsappSection');
        const manualSection = document.getElementById('manualSection');
        const downloadBtn = document.getElementById('downloadBtn');
        
        // Hide download button initially
        if (downloadBtn) downloadBtn.style.display = 'none';
        
        // Show loading WA
        whatsappSection.style.display = 'block';
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
            
            // After redirect, show manual section
            setTimeout(() => {
                whatsappSection.style.display = 'none';
                manualSection.style.display = 'block';
                if (downloadBtn) downloadBtn.style.display = 'block';
            }, 1000);
        }, 2000);
        
    } catch (error) {
        console.error('Error converting canvas:', error);
        // Fallback: tetap coba kirim
        const buyerName = doneData?.buyerName || 'Customer';
        const productsText = doneData?.productsText || 'Produk Digital';
        const totalAmount = doneData?.totalAmount || 0;
        
        const fallbackMessage = `Halo Rayy Store saya *${buyerName}*%0A%0A` +
            `Saya membeli produk:%0A` +
            `📦 *${productsText}*%0A` +
            `💰 *Rp ${formatNumber(totalAmount)}*%0A%0A` +
            `Mohon untuk diproses 🙏`;
        
        whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${fallbackMessage}`;
        
        const whatsappSection = document.getElementById('whatsappSection');
        const manualSection = document.getElementById('manualSection');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (downloadBtn) downloadBtn.style.display = 'none';
        whatsappSection.style.display = 'block';
        
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
            setTimeout(() => {
                whatsappSection.style.display = 'none';
                manualSection.style.display = 'block';
                if (downloadBtn) downloadBtn.style.display = 'block';
            }, 1000);
        }, 2000);
    }
}

async function saveToAdmin(buyerName, productName, total, tanggal) {
    const canvasData = {
        buyerName: buyerName,
        productName: productName,
        total: total,
        tanggal: tanggal,
        imgbbUrl: doneData?.imgbbUrl || '',
        createdAt: new Date().toISOString()
    };
    
    try {
        const canvasId = Date.now().toString();
        await database.ref('doneCanvas/' + canvasId).set(canvasData);
    } catch (e) {
        console.error('Error saving to admin:', e);
    }
}

// Download canvas
document.getElementById('downloadBtn').onclick = () => {
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `RAYY_DONE_${timestamp}.png`;
    link.href = canvas.toDataURL();
    link.click();
};

// Manual WhatsApp button (kirim ulang canvas URL)
document.getElementById('manualWaBtn').onclick = () => {
    if (canvasImageUrl) {
        const buyerName = doneData?.buyerName || 'Customer';
        const productsText = doneData?.productsText || 'Produk Digital';
        const totalAmount = doneData?.totalAmount || 0;
        
        const message = `Halo Rayy Store saya *${buyerName}*%0A%0A` +
            `Saya membeli produk:%0A` +
            `📦 *${productsText}*%0A` +
            `💰 *Rp ${formatNumber(totalAmount)}*%0A%0A` +
            `Ini kartu konfirmasi pembayaran saya:%0A` +
            `${canvasImageUrl}%0A%0A` +
            `Mohon untuk diproses 🙏`;
        
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        window.open(waUrl, '_blank');
    } else {
        window.open(whatsappUrl, '_blank');
    }
};

// Initialize
loadData();