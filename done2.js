(function() {
    const canvas = document.getElementById('doneCanvas');
    const ctx = canvas.getContext('2d');
    const downloadBtn = document.getElementById('downloadBtn');
    const uploadBtn = document.getElementById('uploadCanvasBtn');
    const uploadLoading = document.getElementById('uploadLoading');
    
    let doneData = null;
    let imgbbImage = null;
    let uploadedCanvasUrl = '';
    
    const WA_BOT_GROUP_ID = "120363425398406088@g.us";
    const STORE_NAME = "Rayy Store";
    const STORE_LINK = "https://bizzy-store.web.id/rayy-store.com";
    
    function loadData() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        const dataStr = localStorage.getItem('doneData');
        
        if (dataStr) {
            doneData = JSON.parse(dataStr);
            console.log('✅ doneData loaded:', doneData);
        }
        
        if (doneData && doneData.imgbbUrl && doneData.imgbbUrl !== 'null') {
            imgbbImage = new Image();
            imgbbImage.crossOrigin = "Anonymous";
            imgbbImage.src = doneData.imgbbUrl;
            imgbbImage.onload = () => {
                drawCanvas();
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            };
            imgbbImage.onerror = () => {
                drawCanvas();
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            };
        } else {
            drawCanvas();
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    }
    
    function formatNumber(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    async function sendToWABot(groupId, command) {
        try {
            await database.ref('wa_bot_commands').push({
                groupId: groupId,
                command: command,
                status: "pending",
                orderId: doneData?.orderId || null,
                linkGroup: doneData?.linkGroup || null,
                durasi: doneData?.durasi || null,
                buyerName: doneData?.buyerName || null,
                buyerPhone: localStorage.getItem('userPhone') || null,
                createdAt: new Date().toISOString()
            });
            console.log('✅ Perintah dikirim ke WA Bot:', command);
            return true;
        } catch (error) {
            console.error('Gagal kirim ke WA bot:', error);
            return false;
        }
    }
    
    async function sendAddSewaCommand(linkGroup, durasi, orderId, buyerName) {
        const command = `.addsewagc ${linkGroup} ${durasi}`;
        return await sendToWABot(WA_BOT_GROUP_ID, command);
    }
    
    function drawCanvas() {
        const w = 1080, h = 1920;
        canvas.width = w;
        canvas.height = h;
        
        const buyerName = doneData?.buyerName || localStorage.getItem('userName') || "Nama Pembeli";
        const buyerPhone = localStorage.getItem('userPhone') || '-';
        const productName = doneData?.productsText || "Produk Digital";
        const productQty = "1";
        const totalAmount = doneData?.totalAmount || 0;
        const isGratis = totalAmount === 0;
        const productPrice = isGratis ? "🎉 GRATIS! 🎉" : `Rp ${formatNumber(totalAmount)}`;
        const tanggalNow = new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/\./g, ':');
        
        const bgGrd = ctx.createLinearGradient(0, 0, w, h);
        bgGrd.addColorStop(0, '#FFFBF5');
        bgGrd.addColorStop(1, '#FFEFE0');
        ctx.fillStyle = bgGrd;
        ctx.fillRect(0, 0, w, h);
        
        ctx.save();
        ctx.strokeStyle = '#E2C294';
        ctx.lineWidth = 8;
        ctx.strokeRect(40, 40, w-80, h-80);
        ctx.strokeStyle = '#D6A95C';
        ctx.lineWidth = 3;
        ctx.strokeRect(52, 52, w-104, h-104);
        
        ctx.font = '800 88px "Inter", system-ui';
        ctx.fillStyle = '#2F5D3A';
        ctx.fillText("✔️ DONE", 70, 160);
        ctx.font = '600 34px "Inter"';
        ctx.fillStyle = '#B57C2E';
        ctx.fillText("KONFIRMASI PEMBELIAN", 470, 150);
        
        ctx.font = '700 46px "Inter"';
        ctx.fillStyle = '#C47D2E';
        ctx.fillText(STORE_NAME, 70, 245);
        ctx.font = '500 28px monospace';
        ctx.fillStyle = '#AC8E64';
        ctx.fillText(STORE_LINK, 70, 295);
        
        const imgW = 680, imgH = 680;
        const imgX = (w - imgW) / 2;
        const imgY = 420;
        
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
        ctx.restore();
        
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
        
        let startY = imgY + imgH + 70;
        
        ctx.font = '600 28px "Inter"';
        ctx.fillStyle = '#A5753E';
        ctx.fillText("👤 PEMBELI", 70, startY);
        ctx.font = '700 40px "Inter"';
        ctx.fillStyle = '#2B3B2C';
        let buyerText = buyerName.length > 35 ? buyerName.slice(0,32)+"..." : buyerName;
        ctx.fillText(buyerText, 70, startY + 55);
        startY += 120;
        
        ctx.font = '600 28px "Inter"';
        ctx.fillStyle = '#A5753E';
        ctx.fillText("📦 NAMA PRODUK", 70, startY);
        ctx.font = '700 38px "Inter"';
        ctx.fillStyle = '#2C4A34';
        let productText = productName.length > 38 ? productName.slice(0,35)+"..." : productName;
        ctx.fillText(productText, 70, startY + 55);
        startY += 120;
        
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
        ctx.fillStyle = isGratis ? '#28a745' : '#D97706';
        ctx.fillText(productPrice, 620, startY + 55);
        startY += 130;
        
        ctx.font = '600 26px "Inter"';
        ctx.fillStyle = '#A5753E';
        ctx.fillText("⏱️ TANGGAL TRANSAKSI", 70, startY);
        ctx.font = '600 34px "JetBrains Mono", monospace';
        ctx.fillStyle = '#2A5D48';
        ctx.fillText(tanggalNow, 70, startY + 55);
        startY += 110;
        
        ctx.font = '500 24px "Inter"';
        ctx.fillStyle = '#B87C3C';
        ctx.fillText("🔗 Link Toko Resmi:", 70, startY);
        ctx.font = '600 32px "Inter", monospace';
        ctx.fillStyle = '#E09D32';
        ctx.fillText(STORE_LINK, 70, startY + 50);
        
        const badgeX = w - 280;
        const badgeY = h - 110;
        ctx.font = 'bold 60px "Inter"';
        ctx.fillStyle = '#DFB87A30';
        ctx.fillText("✔️ DONE", badgeX, badgeY);
        ctx.font = 'italic 22px "Inter"';
        ctx.fillStyle = '#C69850';
        ctx.fillText("verified by Rayy Store", badgeX - 20, badgeY + 45);
        
        ctx.beginPath();
        ctx.moveTo(70, h - 170);
        ctx.lineTo(w - 70, h - 170);
        ctx.strokeStyle = '#E2C198';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.font = '500 18px "Inter"';
        ctx.fillStyle = '#C9AD87';
        ctx.fillText("done.canvas · official confirmation", 70, h - 60);
        
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
        
        saveToAdmin(buyerName, productName, totalAmount, tanggalNow);
        
        // KIRIM PERINTAH KE WA BOT UNTUK SEWA (BUKAN PERPANJANGAN)
        if (doneData && doneData.isSewaOrder && doneData.linkGroup && !doneData.isRenew) {
            const durasi = doneData.durasi || 1;
            const orderId = doneData.orderId || 'unknown';
            const buyerNameShort = doneData.buyerName || 'Customer';
            
            console.log('🚀 Mengirim perintah addsewagc ke WA Bot:', `.addsewagc ${doneData.linkGroup} ${durasi}`);
            
            sendAddSewaCommand(doneData.linkGroup, durasi, orderId, buyerNameShort)
                .then(() => console.log('✅ Perintah sewa berhasil dikirim ke WA Bot'))
                .catch(err => console.error('❌ Gagal kirim perintah sewa:', err));
        }
    }
    
    async function saveToAdmin(buyerName, productName, total, tanggal) {
        const buyerPhone = localStorage.getItem('userPhone') || '';
        const canvasData = {
            buyerName: buyerName,
            buyerPhone: buyerPhone,
            productName: productName,
            total: total,
            tanggal: tanggal,
            imgbbUrl: doneData?.imgbbUrl || '',
            createdAt: new Date().toISOString()
        };
        
        try {
            const canvasId = Date.now().toString();
            await database.ref('doneCanvas/' + canvasId).set(canvasData);
            console.log('✅ Data tersimpan ke admin');
        } catch (e) {
            console.error('Error saving to admin:', e);
        }
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
    
    function sendToWhatsApp(canvasUrl) {
        const buyerName = doneData?.buyerName || localStorage.getItem('userName') || 'Customer';
        const buyerPhone = localStorage.getItem('userPhone') || '';
        const productsText = doneData?.productsText || 'Produk Digital';
        const totalAmount = doneData?.totalAmount || 0;
        const isGratis = totalAmount === 0;
        
        const message = `*📝 FORMAT ORDER PRODUK RAYY STORE*%0A%0A` +
            `*👤 Nama* : ${buyerName}%0A` +
            `*📱 No WA* : ${buyerPhone}%0A` +
            `*🛒 Produk* : ${productsText}%0A` +
            `*💰 Harga* : ${isGratis ? 'GRATIS!' : 'Rp ' + formatNumber(totalAmount)}%0A` +
            `*💳 Metode Bayar* : ${isGratis ? 'GRATIS' : 'QRIS'}%0A` +
            `*📸 Bukti pembayaran*%0A` +
            `${canvasUrl}%0A%0A` +
            `💌 Mohon diproses ya admin 😘`;
        
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        window.open(waUrl, '_blank');
        
        setTimeout(() => {
            const waUrl2 = `https://wa.me/${WHATSAPP_ADMIN2}?text=${message}`;
            window.open(waUrl2, '_blank');
        }, 500);
        
        showNotification('Membuka WhatsApp...', 'success');
    }
    
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.download = `KARTU_KONFIRMASI_${timestamp}.png`;
            link.href = canvas.toDataURL();
            link.click();
            showNotification('Kartu berhasil di download!', 'success');
        };
    }
    
    if (uploadBtn) {
        uploadBtn.onclick = async () => {
            uploadBtn.disabled = true;
            uploadBtn.style.opacity = '0.5';
            if (uploadLoading) uploadLoading.style.display = 'block';
            
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
                    
                    if (typeof notifyDoneCanvas !== 'undefined') {
                        const buyerName = doneData?.buyerName || localStorage.getItem('userName') || 'Customer';
                        const buyerPhone = localStorage.getItem('userPhone') || '';
                        const productsText = doneData?.productsText || 'Produk Digital';
                        const totalAmount = doneData?.totalAmount || 0;
                        await notifyDoneCanvas(buyerName, buyerPhone, productsText, totalAmount, uploadedCanvasUrl);
                    }
                    
                    if (uploadLoading) uploadLoading.style.display = 'none';
                    showNotification('Upload kartu berhasil!', 'success');
                    
                    setTimeout(() => {
                        sendToWhatsApp(uploadedCanvasUrl);
                    }, 500);
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                if (uploadLoading) uploadLoading.style.display = 'none';
                showNotification('Gagal upload, coba lagi!', 'error');
                uploadBtn.disabled = false;
                uploadBtn.style.opacity = '1';
            }
        };
    }
    
    loadData();
})();