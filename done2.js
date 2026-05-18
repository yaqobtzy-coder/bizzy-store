const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let doneData = null;
let imgbbImage = null;
let uploadedCanvasUrl = '';

// ========================================
// 1. LOAD DATA DARI LOCALSTORAGE
// ========================================
function loadData() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
    
    const dataStr = localStorage.getItem('doneData');
    console.log('Data dari localStorage:', dataStr);
    
    if (!dataStr) {
        console.error('Tidak ada data');
        loadingOverlay.style.display = 'none';
        drawErrorCanvas();
        return;
    }
    
    doneData = JSON.parse(dataStr);
    console.log('doneData:', doneData);
    
    if (doneData.imgbbUrl && doneData.imgbbUrl !== 'null') {
        imgbbImage = new Image();
        imgbbImage.crossOrigin = "Anonymous";
        imgbbImage.src = doneData.imgbbUrl;
        imgbbImage.onload = () => {
            console.log('Gambar bukti berhasil dimuat');
            drawCanvas();
            loadingOverlay.style.display = 'none';
        };
        imgbbImage.onerror = (err) => {
            console.error('Gagal load gambar:', err);
            drawCanvas();
            loadingOverlay.style.display = 'none';
        };
    } else {
        drawCanvas();
        loadingOverlay.style.display = 'none';
    }
}

// ========================================
// 2. DRAW ERROR CANVAS
// ========================================
function drawErrorCanvas() {
    const w = 1080, h = 1920;
    canvas.width = w;
    canvas.height = h;
    
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, w, h);
    
    ctx.font = '40px "Inter"';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText("❌ Error", w/2 - 80, h/2);
    
    ctx.font = '24px "Inter"';
    ctx.fillStyle = '#888';
    ctx.fillText("Data tidak ditemukan", w/2 - 130, h/2 + 60);
    ctx.fillText("Silakan upload bukti terlebih dahulu", w/2 - 200, h/2 + 100);
}

// ========================================
// 3. FORMAT NUMBER
// ========================================
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ========================================
// 4. TRUNCATE TEXT
// ========================================
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// ========================================
// 5. DRAW MAIN CANVAS (FOTO PAS DI TENGAH)
// ========================================
function drawCanvas() {
    const w = 1080, h = 1920;
    canvas.width = w;
    canvas.height = h;
    
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
    
    // ========== BACKGROUND ==========
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#0a0c10');
    gradient.addColorStop(0.5, '#0f1220');
    gradient.addColorStop(1, '#1a1d2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // ========== BORDER DOUBLE ==========
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, w-80, h-80);
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.strokeRect(52, 52, w-104, h-104);
    
    // ========== HEADER ==========
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
    
    // ========== GARIS PEMISAH ==========
    ctx.beginPath();
    ctx.moveTo(80, 340);
    ctx.lineTo(w - 80, 340);
    ctx.strokeStyle = '#4facfe50';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // ========== FOTO BUKTI - UKURAN 400x400 (LEBIH KECIL & PAS TENGAH) ==========
    const imgW = 400;   // Ukuran lebih kecil
    const imgH = 400;   // Ukuran lebih kecil
    const imgX = (w - imgW) / 2;   // TENGAH HORIZONTAL (540 - 200 = 340)
    const imgY = 380;   // TENGAH VERTIKAL (antara header dan data)
    
    // Background foto
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 3;
    ctx.strokeRect(imgX, imgY, imgW, imgH);
    
    // Label "BUKTI PEMBAYARAN" di atas foto
    ctx.font = '500 22px "Inter"';
    ctx.fillStyle = '#4facfe';
    ctx.textAlign = 'center';
    ctx.fillText("📷 BUKTI PEMBAYARAN", w/2, imgY - 12);
    ctx.textAlign = 'left';
    
    // Draw image dari ImgBB (resize ke 400x400)
    if (imgbbImage && imgbbImage.complete && imgbbImage.naturalWidth > 0) {
        try {
            const imgRatio = imgbbImage.width / imgbbImage.height;
            const targetRatio = imgW / imgH;
            let drawW, drawH, offX, offY;
            
            if (imgRatio > targetRatio) {
                // Gambar lebih lebar dari area target
                drawH = imgH;
                drawW = imgbbImage.width * (imgH / imgbbImage.height);
                offX = imgX + (imgW - drawW) / 2;
                offY = imgY;
            } else {
                // Gambar lebih tinggi dari area target
                drawW = imgW;
                drawH = imgbbImage.height * (imgW / imgbbImage.width);
                offX = imgX;
                offY = imgY + (imgH - drawH) / 2;
            }
            ctx.drawImage(imgbbImage, offX, offY, drawW, drawH);
            console.log('Gambar bukti digambar di canvas ukuran 400x400, posisi X:', imgX, 'Y:', imgY);
        } catch(e) {
            console.error('Error drawing image:', e);
            ctx.font = '30px "Inter"';
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.fillText("📷 Gagal muat", w/2, imgY + 200);
            ctx.textAlign = 'left';
        }
    } else {
        ctx.font = '30px "Inter"';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText("📷 Bukti Pembayaran", w/2, imgY + 200);
        ctx.textAlign = 'left';
    }
    
    // ========== DATA PEMBELI (DIBAWAH FOTO) ==========
    let startY = imgY + imgH + 65;  // Jarak dari foto 65px
    
    // PEMBELI
    ctx.font = '600 28px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText("👤 PEMBELI", 80, startY);
    ctx.font = '700 36px "Inter"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(truncateText(buyerName, 28), 80, startY + 50);
    startY += 100;
    
    // PRODUK
    ctx.font = '600 28px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText("📦 PRODUK", 80, startY);
    ctx.font = '600 32px "Inter"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(truncateText(productsText, 35), 80, startY + 50);
    startY += 100;
    
    // TOTAL
    ctx.font = '600 28px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText("💰 TOTAL", 80, startY);
    ctx.font = '700 42px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText(`Rp ${formatNumber(totalAmount)}`, 80, startY + 55);
    startY += 110;
    
    // TANGGAL
    ctx.font = '600 28px "Inter"';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText("⏱️ TANGGAL", 80, startY);
    ctx.font = '500 28px "Inter"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tanggal, 80, startY + 50);
    
    // ========== FOOTER ==========
    ctx.font = '400 20px "Inter"';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText("verified by Rayy Store", w/2, h - 80);
    ctx.textAlign = 'left';
    
    // Save to admin
    saveToAdmin(buyerName, productsText, totalAmount, tanggal);
}

// ========================================
// 6. SAVE TO ADMIN
// ========================================
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
        console.log('Saved to admin');
    } catch (e) {
        console.error('Error saving to admin:', e);
    }
}

// ========================================
// 7. SHOW NOTIFICATION
// ========================================
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

// ========================================
// 8. TOMBOL DOWNLOAD
// ========================================
document.getElementById('downloadBtn').onclick = () => {
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `KARTU_KONFIRMASI_${timestamp}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    showNotification('Kartu berhasil di download!', 'success');
    document.getElementById('uploadSection').style.display = 'block';
};

// ========================================
// 9. TOMBOL UPLOAD KE IMGBB
// ========================================
document.getElementById('uploadBtn').onclick = async () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadLoading = document.getElementById('uploadLoading');
    
    uploadBtn.disabled = true;
    uploadBtn.style.opacity = '0.5';
    uploadLoading.style.display = 'block';
    
    try {
        const blob = await (await fetch(canvas.toDataURL('image/png'))).blob();
        const formData = new FormData();
        formData.append('image', blob, 'canvas-image.png');
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            uploadedCanvasUrl = data.data.url;
            console.log('Uploaded canvas URL:', uploadedCanvasUrl);
            
            uploadLoading.style.display = 'none';
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('waSection').style.display = 'block';
            showNotification('Upload kartu berhasil!', 'success');
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Error:', error);
        uploadLoading.style.display = 'none';
        showNotification('Gagal upload, coba lagi!', 'error');
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '1';
    }
};

// ========================================
// 10. TOMBOL WHATSAPP
// ========================================
document.getElementById('waBtn').onclick = () => {
    if (!uploadedCanvasUrl) {
        showNotification('Upload kartu terlebih dahulu!', 'error');
        return;
    }
    
    const buyerName = doneData?.buyerName || 'Customer';
    const productsText = doneData?.productsText || 'Produk Digital';
    const totalAmount = doneData?.totalAmount || 0;
    
    const message = `Halo Rayy Store saya *${buyerName}*%0A%0A` +
        `Saya membeli produk:%0A` +
        `📦 *${productsText}*%0A` +
        `💰 *Rp ${formatNumber(totalAmount)}*%0A%0A` +
        `Ini kartu konfirmasi pembayaran saya:%0A` +
        `${uploadedCanvasUrl}%0A%0A` +
        `Mohon untuk diproses 🙏`;
    
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(waUrl, '_blank');
    showNotification('Membuka WhatsApp...', 'success');
};

// ========================================
// 11. INITIALIZE
// ========================================
loadData();