// ========================================
// VOUCHER CENTER - Rayy Store
// ========================================

// Set current date
const dateBadge = document.getElementById('dateBadge');
if (dateBadge) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateBadge.innerHTML = `<i class="far fa-calendar-alt"></i> ${new Date().toLocaleDateString('id-ID', options)}`;
}

// Go to store
function goToStore() {
    window.location.href = 'rayy-store.com.html';
}

// Show toast notification
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Copy voucher code
function copyVoucherCode(code) {
    navigator.clipboard.writeText(code);
    showToast(`✅ Kode ${code} berhasil disalin! Gunakan di halaman keranjang.`);
}

// Format number
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// LOAD INFO VOUCHER SETTINGS FROM FIREBASE
// (SAMA SEPERTI NEWS.COM)
// ========================================
function loadVoucherInfoSettings() {
    database.ref('settings/voucherInfo').on('value', (snapshot) => {
        const data = snapshot.val();
        
        const marqueeSection = document.getElementById('infoMarquee');
        const marqueeText = document.getElementById('marqueeText');
        const heroMessage = document.getElementById('heroMessage');
        const infoBadge = document.getElementById('infoBadge');
        
        if (data) {
            // Handle Marquee (Info Berjalan)
            if (data.enabled && data.text) {
                marqueeSection.style.display = 'block';
                marqueeText.innerHTML = `<i class="fas fa-fire"></i> ${escapeHtml(data.text)}`;
            } else {
                marqueeSection.style.display = 'none';
            }
            
            // Handle Badge
            if (data.badgeText) {
                infoBadge.innerHTML = `<i class="fas fa-gift fa-beat"></i> ${escapeHtml(data.badgeText)}`;
            } else {
                infoBadge.innerHTML = `<i class="fas fa-gift fa-beat"></i> UPDATE TERBARU`;
            }
            
            // Handle Hero Message
            if (data.heroMessage) {
                heroMessage.innerText = data.heroMessage;
            } else {
                heroMessage.innerText = 'Dapatkan potongan harga dengan menggunakan kode voucher di halaman keranjang. Jangan sampai kehabisan, setiap voucher terbatas!';
            }
        } else {
            // Default jika belum ada setting
            marqueeSection.style.display = 'none';
            infoBadge.innerHTML = `<i class="fas fa-gift fa-beat"></i> UPDATE TERBARU`;
            heroMessage.innerText = 'Dapatkan potongan harga dengan menggunakan kode voucher di halaman keranjang. Jangan sampai kehabisan, setiap voucher terbatas!';
        }
    });
}

// ========================================
// LOAD VOUCHERS FROM FIREBASE
// ========================================
function loadVouchers() {
    const activeGrid = document.getElementById('voucherGrid');
    const expiredGrid = document.getElementById('expiredVoucherGrid');
    
    activeGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner"></i><p>Memuat voucher...</p></div>';
    
    database.ref('vouchers').orderByChild('createdAt').on('value', (snapshot) => {
        if (!snapshot.exists()) {
            activeGrid.innerHTML = '<div class="empty-message">✨ Belum ada voucher tersedia. Pantau terus ya!</div>';
            expiredGrid.innerHTML = '<div class="empty-message">✨ Belum ada voucher kadaluarsa</div>';
            return;
        }
        
        const activeVouchers = [];
        const expiredVouchers = [];
        const now = new Date();
        
        snapshot.forEach(child => {
            const voucher = child.val();
            voucher.id = child.key;
            const expiredDate = new Date(voucher.expiredAt);
            const isExpired = expiredDate < now;
            const isFull = voucher.used >= voucher.usageLimit;
            
            if (isExpired || isFull) {
                expiredVouchers.push(voucher);
            } else {
                activeVouchers.push(voucher);
            }
        });
        
        // Sort active vouchers by created date (newest first)
        activeVouchers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        expiredVouchers.sort((a, b) => new Date(b.expiredAt) - new Date(a.expiredAt));
        
        // Render active vouchers
        if (activeVouchers.length === 0) {
            activeGrid.innerHTML = '<div class="empty-message">✨ Belum ada voucher aktif. Pantau terus ya!</div>';
        } else {
            activeGrid.innerHTML = activeVouchers.map((voucher, index) => {
                const discountText = voucher.type === 'percentage' ? `${voucher.value}% OFF` : `Rp ${formatNumber(voucher.value)} OFF`;
                const remaining = voucher.usageLimit - voucher.used;
                const expiredDate = new Date(voucher.expiredAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                
                let discountDetail = '';
                if (voucher.type === 'percentage') {
                    discountDetail = `<p><i class="fas fa-percent"></i> Potongan ${voucher.value}% dari total belanja</p>`;
                } else {
                    discountDetail = `<p><i class="fas fa-money-bill"></i> Potongan Rp ${formatNumber(voucher.value)} langsung</p>`;
                }
                
                return `
                    <div class="voucher-card" style="animation-delay: ${0.1 + (index * 0.05)}s">
                        <div class="voucher-header-card">
                            <div class="voucher-code">${escapeHtml(voucher.code)}</div>
                            <div class="voucher-discount">${discountText}</div>
                        </div>
                        <div class="voucher-detail">
                            <p><i class="fas fa-users"></i> Sisa penggunaan: ${remaining} dari ${voucher.usageLimit}</p>
                            <p><i class="fas fa-calendar"></i> Berlaku sampai: ${expiredDate}</p>
                            ${discountDetail}
                            <p><i class="fas fa-shopping-cart"></i> Gunakan di halaman keranjang</p>
                        </div>
                        <div class="voucher-footer">
                            <button class="copy-btn" onclick="copyVoucherCode('${escapeHtml(voucher.code)}')">
                                <i class="fas fa-copy"></i> Salin Kode
                            </button>
                            <span class="voucher-status status-active">✅ Aktif</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Render expired/inactive vouchers
        if (expiredVouchers.length === 0) {
            expiredGrid.innerHTML = '<div class="empty-message">✨ Belum ada voucher kadaluarsa</div>';
        } else {
            expiredGrid.innerHTML = expiredVouchers.map((voucher, index) => {
                const discountText = voucher.type === 'percentage' ? `${voucher.value}% OFF` : `Rp ${formatNumber(voucher.value)} OFF`;
                const isFull = voucher.used >= voucher.usageLimit;
                const statusText = isFull ? 'Kuota Habis' : 'Kadaluarsa';
                const statusClass = isFull ? 'status-full' : 'status-expired';
                const expiredDate = new Date(voucher.expiredAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                
                return `
                    <div class="voucher-card" style="animation-delay: ${0.1 + (index * 0.05)}s; opacity: 0.7;">
                        <div class="voucher-header-card">
                            <div class="voucher-code">${escapeHtml(voucher.code)}</div>
                            <div class="voucher-discount" style="background: #cbd5e1;">${discountText}</div>
                        </div>
                        <div class="voucher-detail">
                            <p><i class="fas fa-users"></i> Penggunaan: ${voucher.used}/${voucher.usageLimit}</p>
                            <p><i class="fas fa-calendar"></i> Kadaluarsa: ${expiredDate}</p>
                        </div>
                        <div class="voucher-footer">
                            <span class="voucher-status ${statusClass}">⏰ ${statusText}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    });
}

// ========================================
// INITIALIZE
// ========================================
loadVoucherInfoSettings();
loadVouchers();