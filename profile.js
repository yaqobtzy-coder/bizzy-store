// ========================================
// PROFILE PAGE - RAYY STORE
// DENGAN VALIDASI NO WA WAJIB
// ========================================

// Load user data
async function loadUserData() {
    const savedName = localStorage.getItem('userName');
    const savedPhone = localStorage.getItem('userPhone');
    const joinDate = localStorage.getItem('joinDate');
    const hasSetName = localStorage.getItem('hasSetName') === 'true';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    console.log('📝 Load User Data:', { savedName, savedPhone, hasSetName, isLoggedIn });
    
    // Tampilkan nama
    if (isLoggedIn && savedName && savedName !== 'Customer' && savedName !== 'null' && savedName !== 'Guest') {
        document.getElementById('displayName').textContent = savedName;
        document.getElementById('userNameInput').value = savedName;
    } else {
        document.getElementById('displayName').textContent = 'Customer';
        document.getElementById('userNameInput').value = '';
        // Reset status login
        localStorage.setItem('isLoggedIn', 'false');
        localStorage.setItem('hasSetName', 'false');
    }
    
    // Tampilkan nomor WA
    if (savedPhone && savedPhone !== 'null') {
        document.getElementById('userPhoneInput').value = savedPhone;
    } else {
        document.getElementById('userPhoneInput').value = '';
    }
    
    // Set join date
    if (joinDate) {
        document.getElementById('joinDate').textContent = joinDate;
    } else {
        const date = new Date().getFullYear().toString();
        document.getElementById('joinDate').textContent = date;
        localStorage.setItem('joinDate', date);
    }
    
    // Set email
    document.getElementById('userEmail').textContent = localStorage.getItem('userEmail') || 'customer@rayystore.com';
    
    // UPDATE UI berdasarkan status login
    const nameInput = document.getElementById('userNameInput');
    const phoneInput = document.getElementById('userPhoneInput');
    const saveBtn = document.getElementById('saveBtn');
    const nameNote = document.getElementById('nameNote');
    const phoneNote = document.getElementById('phoneNote');
    
    // Hapus pesan info lama
    const oldInfo = document.getElementById('profileInfoMsg');
    if (oldInfo) oldInfo.remove();
    
    if (isLoggedIn && hasSetName) {
        // SUDAH LOGIN - LOCK PERMANEN (nama tidak bisa diubah)
        if (nameInput) {
            nameInput.readOnly = true;
            nameInput.style.backgroundColor = 'rgba(0,0,0,0.5)';
            nameInput.style.cursor = 'not-allowed';
            nameInput.placeholder = 'Nama sudah disimpan';
        }
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
        }
        if (nameNote) {
            nameNote.innerHTML = '<i class="fas fa-lock"></i> Nama sudah disimpan. Logout jika ingin mengganti.';
            nameNote.style.color = '#f59e0b';
        }
        if (phoneNote) {
            phoneNote.innerHTML = '<i class="fas fa-lock"></i> Nomor WA sudah disimpan. Logout jika ingin mengganti.';
            phoneNote.style.color = '#f59e0b';
        }
        
        const infoMsg = document.createElement('p');
        infoMsg.id = 'profileInfoMsg';
        infoMsg.style.cssText = 'color: #f59e0b; font-size: 12px; margin-top: 8px; text-align: center; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 8px;';
        infoMsg.innerHTML = '<i class="fas fa-info-circle"></i> Anda sudah login. Klik "Logout" jika ingin mengganti data.';
        const formGroup = document.querySelector('.form-group');
        if (formGroup) formGroup.appendChild(infoMsg);
        
    } else {
        // BELUM LOGIN - BISA INPUT
        if (nameInput) {
            nameInput.readOnly = false;
            nameInput.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            nameInput.style.cursor = 'text';
            nameInput.placeholder = 'Masukkan nama lengkap Anda';
            nameInput.value = '';
        }
        if (phoneInput) {
            phoneInput.readOnly = false;
            phoneInput.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            phoneInput.style.cursor = 'text';
            phoneInput.placeholder = '628xxxxxxxxxx';
            phoneInput.value = '';
        }
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }
        if (nameNote) {
            nameNote.innerHTML = '<i class="fas fa-info-circle"></i> Masukkan nama lengkap Anda. Nama akan digunakan untuk transaksi.';
            nameNote.style.color = '#888';
        }
        if (phoneNote) {
            phoneNote.innerHTML = '<i class="fas fa-info-circle"></i> Masukkan nomor WhatsApp aktif (format 62xxx). Digunakan untuk notifikasi pesanan.';
            phoneNote.style.color = '#888';
        }
        
        const infoMsg = document.createElement('p');
        infoMsg.id = 'profileInfoMsg';
        infoMsg.style.cssText = 'color: #4facfe; font-size: 12px; margin-top: 8px; text-align: center; padding: 8px; background: rgba(79, 172, 254, 0.1); border-radius: 8px;';
        infoMsg.innerHTML = '<i class="fas fa-info-circle"></i> Isi nama dan nomor WhatsApp untuk memulai belanja.';
        const formGroup = document.querySelector('.form-group');
        if (formGroup) formGroup.appendChild(infoMsg);
    }
}

// Validasi nomor WhatsApp
function validatePhoneNumber(phone) {
    if (!phone) return false;
    // Hapus semua karakter non-digit
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    // Cek apakah dimulai dengan 62 dan panjang minimal 10 digit
    if (cleanPhone.startsWith('62') && cleanPhone.length >= 10 && cleanPhone.length <= 15) {
        return true;
    }
    // Cek apakah dimulai dengan 0 (akan dikonversi ke 62 nanti)
    if (cleanPhone.startsWith('0') && cleanPhone.length >= 11 && cleanPhone.length <= 16) {
        return true;
    }
    return false;
}

function formatPhoneNumber(phone) {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    }
    return cleanPhone;
}

// Save profile (login)
async function saveProfile() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const hasSetName = localStorage.getItem('hasSetName') === 'true';
    
    // Jika sudah login dan sudah punya nama, tidak bisa ganti
    if (isLoggedIn && hasSetName) {
        alert('⚠️ Anda sudah login! Silakan logout terlebih dahulu jika ingin mengganti data.');
        return;
    }
    
    const newName = document.getElementById('userNameInput').value.trim();
    let newPhone = document.getElementById('userPhoneInput').value.trim();
    
    // VALIDASI NAMA
    if (!newName) {
        alert('⚠️ Masukkan nama lengkap Anda!');
        return;
    }
    
    if (newName.length < 3) {
        alert('⚠️ Nama minimal 3 karakter!');
        return;
    }
    
    // VALIDASI NOMOR WA
    if (!newPhone) {
        alert('⚠️ Masukkan nomor WhatsApp!');
        return;
    }
    
    if (!validatePhoneNumber(newPhone)) {
        alert('⚠️ Format nomor WhatsApp tidak valid!\n\nGunakan format:\n- 628xxxxxxxxxx (62 di depan)\n- 08xxxxxxxxxx (0 di depan)\n\nContoh: 6281234567890');
        return;
    }
    
    // Format nomor WA
    newPhone = formatPhoneNumber(newPhone);
    
    // Kirim notifikasi ke Telegram bahwa user baru register
    if (typeof sendTelegramNotification !== 'undefined') {
        const messageTelegram = `👤 *USER BARU REGISTER*\n\n` +
            `👤 Nama: ${newName}\n` +
            `📱 No WA: ${newPhone}\n` +
            `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;
        await sendTelegramNotification(messageTelegram);
    }
    
    // Simpan ke localStorage (LOGIN)
    localStorage.setItem('userName', newName);
    localStorage.setItem('buyerName', newName);
    localStorage.setItem('userPhone', newPhone);
    localStorage.setItem('hasSetName', 'true');
    localStorage.setItem('isLoggedIn', 'true');
    
    document.getElementById('displayName').textContent = newName;
    
    // Update UI
    const nameInput = document.getElementById('userNameInput');
    const phoneInput = document.getElementById('userPhoneInput');
    const saveBtn = document.getElementById('saveBtn');
    
    if (nameInput) {
        nameInput.readOnly = true;
        nameInput.style.backgroundColor = 'rgba(0,0,0,0.5)';
    }
    if (phoneInput) {
        phoneInput.readOnly = true;
        phoneInput.style.backgroundColor = 'rgba(0,0,0,0.5)';
    }
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.5';
        saveBtn.style.cursor = 'not-allowed';
    }
    
    showNotification(`✅ Selamat datang ${newName}!`, 'success');
    
    setTimeout(() => {
        window.location.href = 'rayy-store.com.html';
    }, 1500);
}

// LOGOUT - Hapus semua data user
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?\n\nSetelah logout, Anda bisa login dengan data baru.')) {
        // Simpan cart dulu
        const cart = localStorage.getItem('cart');
        
        // Hapus semua data user (logout)
        localStorage.removeItem('userName');
        localStorage.removeItem('buyerName');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('hasSetName');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('activeVoucher');
        localStorage.removeItem('usedVouchers');
        
        // Kembalikan cart
        if (cart) localStorage.setItem('cart', cart);
        
        // Reset tampilan
        document.getElementById('displayName').textContent = 'Customer';
        document.getElementById('userNameInput').value = '';
        document.getElementById('userPhoneInput').value = '';
        document.getElementById('userNameInput').readOnly = false;
        document.getElementById('userPhoneInput').readOnly = false;
        document.getElementById('userNameInput').style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        document.getElementById('userPhoneInput').style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }
        
        // Hapus pesan info lama
        const oldInfo = document.getElementById('profileInfoMsg');
        if (oldInfo) oldInfo.remove();
        
        // Tambah pesan baru
        const infoMsg = document.createElement('p');
        infoMsg.id = 'profileInfoMsg';
        infoMsg.style.cssText = 'color: #4facfe; font-size: 12px; margin-top: 8px; text-align: center; padding: 8px; background: rgba(79, 172, 254, 0.1); border-radius: 8px;';
        infoMsg.innerHTML = '<i class="fas fa-info-circle"></i> Anda telah logout. Isi nama dan nomor WA untuk login kembali.';
        const formGroup = document.querySelector('.form-group');
        if (formGroup) formGroup.appendChild(infoMsg);
        
        showNotification('✅ Anda telah logout!', 'success');
        
        // Redirect ke beranda setelah 1.5 detik
        setTimeout(() => {
            window.location.href = 'rayy-store.com.html';
        }, 1500);
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
    }, 3000);
}

// Load data saat halaman dimuat
loadUserData();