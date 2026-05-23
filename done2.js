(function() {
    // DOM Elements
    const canvas = document.getElementById('doneCanvas');
    const ctx = canvas.getContext('2d');
    const downloadBtn = document.getElementById('downloadBtn');
    const uploadBtn = document.getElementById('uploadCanvasBtn');
    const uploadLoading = document.getElementById('uploadLoading');
    const waSection = document.getElementById('waSection');
    
    // Data dari localStorage (hasil upload bukti)
    let doneData = null;
    let imgbbImage = null;
    let uploadedCanvasUrl = '';
    
    // Store info sesuai request
    const STORE_NAME = "Rayy Store";
    const STORE_LINK = "Bizzy-store.web.id/rayy-store.com";
    
    // Load data dari localStorage
    function loadData() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';
        
        const dataStr = localStorage.getItem('doneData');
        console.log('Data dari localStorage:', dataStr);
        
        if (dataStr) {
            doneData = JSON.parse(dataStr);
            console.log('doneData:', doneData);
        }
        
        // Fallback ke data lama
        if (!doneData || !doneData.imgbbUrl) {
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
        
        if (doneData && doneData.imgbbUrl && doneData.imgbbUrl !== 'null') {
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
    
    // Format number
    function formatNumber(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    // DRAW CANVAS - 100% MIRIP dengan done-manual.com.html
    function drawCanvas() {
        const w = 1080, h = 1920;
        canvas.width = w;
        canvas.height = h;
        
        // Get fresh data dari doneData
        const buyerName = doneData?.buyerName || "Nama Pembeli";
        const productName = doneData?.productsText || "Produk Digital";
        const productQty = "1"; // Default quantity
        const productPrice = `Rp ${formatNumber(doneData?.totalAmount || 0)}`;
        const tanggalNow = new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/\./g, ':');
        
        // 1. Background premium soft cream
        const bgGrd = ctx.createLinearGradient(0, 0, w, h);
        bgGrd.addColorStop(0, '#FFFBF5');
        bgGrd.addColorStop(1, '#FFEFE0');
        ctx.fillStyle = bgGrd;
        ctx.fillRect(0, 0, w, h);
        
        // Elegant border double
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#E2C294';
        ctx.lineWidth = 8;
        ctx.strokeRect(40, 40, w-80, h-80);
        ctx.strokeStyle = '#D6A95C';
        ctx.lineWidth = 3;
        ctx.strokeRect(52, 52, w-104, h-104);
        
        // Header: DONE + Store
        ctx.font = '800 88px "Inter", system-ui';
        ctx.fillStyle = '#2F5D3A';
        ctx.fillText("✔️ DONE", 70, 160);
        ctx.font = '600 34px "Inter"';
        ctx.fillStyle = '#B57C2E';
        ctx.fillText("KONFIRMASI PEMBELIAN", 470, 150);
        
        // Store name & link
        ctx.font = '700 46px "Inter"';
        ctx.fillStyle = '#C47D2E';
        ctx.fillText(STORE_NAME, 70, 245);
        ctx.font = '500 28px monospace';
        ctx.fillStyle = '#AC8E64';
        ctx.fillText(STORE_LINK, 70, 295);
        
        // --- FOTO PRODUK DI TENGAH (horizontal center) ---
        const imgW = 680;
        const imgH = 680;
        const imgX = (w - imgW) / 2;
        const imgY = 420;
        
        // Rounded clipping untuk foto
        ctx.beginPath();
        ctx.moveTo(imgX + 60, imgY);
        ctx.lineTo(imgX + imgW - 60, imgY);
        ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + 60);
        ctx.lineTo(imgX + imgW, imgY + imgH - 60);
        ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - 60, imgY + imgH);
        ctx.lineTo(imgX + 60, imgY + imgH);
        ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - 60);
        ctx.lineTo(imgX, imgY + 60);
        ctx.quadraticCurveTo(imgX, imgY, imgX + 60, imgY);
        ctx.closePath();
        ctx.clip();
        
        // Background foto
        ctx.fillStyle = '#F5E7D9';
        ctx.fillRect(imgX, imgY, imgW, imgH);
        
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
            ctx.font = '80px "Inter"';
            ctx.fillStyle = '#D1B48C';
            ctx.fillText("📸", imgX + imgW/2 - 55, imgY + imgH/2 + 30);
            ctx.font = 'bold 32px "Inter"';
            ctx.fillStyle = '#A58767';
            ctx.fillText("Upload foto produk", imgX + imgW/2 - 170, imgY + imgH - 70);
        }
        ctx.restore(); // restore clip
        
        // Border foto
        ctx.beginPath();
        ctx.moveTo(imgX + 60, imgY);
        ctx.lineTo(imgX + imgW - 60, imgY);
        ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + 60);
        ctx.lineTo(imgX + imgW, imgY + imgH - 60);
        ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - 60, imgY + imgH);
        ctx.lineTo(imgX + 60, imgY + imgH);
        ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - 60);
        ctx.lineTo(imgX, imgY + 60);
        ctx.quadraticCurveTo(imgX, imgY, imgX + 60, imgY);
        ctx.closePath();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#E2A324';
        ctx.stroke();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#FFE3A8';
        ctx.stroke();
        
        // --- DATA PRODUK DI BAWAH FOTO ---
        let startY = imgY + imgH + 70;
        
        // 1. Nama Pembeli
        ctx.font = '600 28px "Inter"';
        ctx.fillStyle = '#A5753E';
        ctx.fillText("👤 PEMBELI", 70, startY);
        ctx.font = '700 40px "Inter"';
        ctx.fillStyle = '#2B3B2C';
        let buyerText = buyerName.length > 35 ? buyerName.slice(0,32)+"..." : buyerName;
        ctx.fillText(buyerText, 70, startY + 55);
        startY += 120;
        
        // 2. Nama Produk
        ctx.font = '600 28px "Inter"';
        ctx.fillStyle = '#A5753E';
        ctx.fillText("📦 NAMA PRODUK", 70, startY);
        ctx.font = '700 38px "Inter"';
        ctx.fillStyle = '#2C4A34';
        let productText = productName.length > 38 ? productName.slice(0,35)+"..." : productName;
        ctx.fillText(productText, 70, startY + 55);
        startY += 120;
        
        // 3. Jumlah & Harga (2 kolom)
        ctx.font = '600 28px "Inter"';
        ctx.fillStyle = '#A5753E';
        ctx.fillText("🔢 JUMLAH", 70, startY);
        ctx.font = '600 28px "Inter"';
        ctx.fillStyle = '#A5753E';
        ctx.fillText("💰 HARGA", 620, startY);
        
        ctx.font = '700 40px "Inter"';
        ctx.fillStyle = '#1F2E2A';
        ctx.fillText(productQty, 70, startY + 55);
        ctx.font = '700 40px "Inter"';
        ctx.fillStyle = '#D97706';
        ctx.fillText(productPrice, 620, startY + 55);
        startY += 130;
        
        // 4. Tanggal Transaksi
        ctx.font = '600 26px "Inter"';
        ctx.fillStyle = '#A5753E';
        ctx.fillText("⏱️ TANGGAL TRANSAKSI", 70, startY);
        ctx.font = '600 34px "JetBrains Mono", monospace';
        ctx.fillStyle = '#2A5D48';
        ctx.fillText(tanggalNow, 70, startY + 55);
        startY += 110;
        
        // 5. Link Website Store
        ctx.font = '500 24px "Inter"';
        ctx.fillStyle = '#B87C3C';
        ctx.fillText("🔗 Link Toko Resmi:", 70, startY);
        ctx.font = '600 32px "Inter", monospace';
        ctx.fillStyle = '#E09D32';
        ctx.fillText(STORE_LINK, 70, startY + 50);
        
        // --- ELEMEN BAWAH (stiker verified) ---
        const badgeX = w - 280;
        const badgeY = h - 110;
        ctx.font = 'bold 60px "Inter"';
        ctx.fillStyle = '#DFB87A30';
        ctx.fillText("✔️ DONE", badgeX, badgeY);
        ctx.font = 'italic 22px "Inter"';
        ctx.fillStyle = '#C69850';
        ctx.fillText("verified by Rayy Store", badgeX - 20, badgeY + 45);
        
        // Garis pemisah elegant
        ctx.beginPath();
        ctx.moveTo(70, h - 170);
        ctx.lineTo(w - 70, h - 170);
        ctx.strokeStyle = '#E2C198';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Watermark halus
        ctx.font = '500 18px "Inter"';
        ctx.fillStyle = '#C9AD87';
        ctx.fillText("done.canvas · official confirmation", 70, h - 60);
        
        // Ornamen pojok mewah
        ctx.beginPath();
        ctx.strokeStyle = '#EBB45C';
        ctx.lineWidth = 4;
        ctx.moveTo(60, 80);
        ctx.lineTo(100, 80);
        ctx.lineTo(100, 40);
        ctx.stroke();
        ctx.moveTo(w-60, 80);
        ctx.lineTo(w-100, 80);
        ctx.lineTo(w-100, 40);
        ctx.stroke();
        ctx.moveTo(60, h-80);
        ctx.lineTo(100, h-80);
        ctx.lineTo(100, h-40);
        ctx.stroke();
        ctx.moveTo(w-60, h-80);
        ctx.lineTo(w-100, h-80);
        ctx.lineTo(w-100, h-40);
        ctx.stroke();
        
        // Save to admin
        saveToAdmin(buyerName, productName, doneData?.totalAmount || 0, tanggalNow);
    }
    
    // Save to admin
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
    
    // Show notification
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
    
    // Download canvas
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `KARTU_KONFIRMASI_${timestamp}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showNotification('Kartu berhasil di download!', 'success');
    };
    
    // Upload canvas ke ImgBB
    uploadBtn.onclick = async () => {
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
                
                // Kirim notifikasi done canvas ke Telegram
                if (typeof notifyDoneCanvas !== 'undefined') {
                    const buyerName = doneData?.buyerName || 'Customer';
                    const productsText = doneData?.productsText || 'Produk Digital';
                    const totalAmount = doneData?.totalAmount || 0;
                    await notifyDoneCanvas(buyerName, productsText, totalAmount, uploadedCanvasUrl);
                }
                
                uploadLoading.style.display = 'none';
                waSection.style.display = 'block';
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
    
    // WhatsApp button - format pesan
    document.getElementById('waBtn').onclick = () => {
        if (!uploadedCanvasUrl) {
            showNotification('Upload kartu terlebih dahulu!', 'error');
            return;
        }
        
        const buyerName = doneData?.buyerName || 'Customer';
        const productsText = doneData?.productsText || 'Produk Digital';
        const totalAmount = doneData?.totalAmount || 0;
        const paymentMethod = 'QRIS';
        
        const message = `*📝 FORMAT ORDER PRODUK RAYY STORE*%0A%0A` +
            `*👤 Nama* : ${buyerName}%0A` +
            `*🛒 Produk* : ${productsText}%0A` +
            `*💰 Harga* : Rp ${formatNumber(totalAmount)}%0A` +
            `*💳 Metode Bayar* : ${paymentMethod}%0A` +
            `*📸 Bukti pembayaran*%0A` +
            `${uploadedCanvasUrl}%0A%0A` +
            `💌 Mohon diproses ya admin 😘`;
        
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        window.open(waUrl, '_blank');
        
        setTimeout(() => {
            const waUrl2 = `https://wa.me/${WHATSAPP_ADMIN2}?text=${message}`;
            window.open(waUrl2, '_blank');
        }, 500);
        
        showNotification('Membuka WhatsApp...', 'success');
    };
    
    // Initialize
    loadData();
})();