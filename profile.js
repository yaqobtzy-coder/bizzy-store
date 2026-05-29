// ========================================
// PROFILE PAGE - RAYY STORE
// ========================================

// Load user data
async function loadUserData() {
    const savedName = localStorage.getItem('userName');
    const joinDate = localStorage.getItem('joinDate');
    const hasSetName = localStorage.getItem('hasSetName') === 'true';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    console.log('📝 Load User Data:', { savedName, hasSetName, isLoggedIn });
    
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
    const saveBtn = document.getElementById('saveBtn');
    const nameNote = document.getElementById('nameNote');
    
    // Hapus pesan info lama
    const oldInfo = document.getElementById('profileInfoMsg');
    if (oldInfo) oldInfo.remove();
    
    if (isLoggedIn && hasSetName) {
        // SUDAH LOGIN DAN PERNAH GANTI NAMA - LOCK PERMANEN
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
            nameNote.innerHTML = '<i class="fas fa-lock"></i> Anda sudah login dan nama sudah disimpan. Logout jika ingin mengganti nama.';
            nameNote.style.color = '#f59e0b';
        }
        
        const infoMsg = document.createElement('p');
        infoMsg.id = 'profileInfoMsg';
        infoMsg.style.cssText = 'color: #f59e0b; font-size: 12px; margin-top: 8px; text-align: center; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 8px;';
        infoMsg.innerHTML = '<i class="fas fa-info-circle"></i> Anda sudah login. Klik "Logout" jika ingin mengganti nama.';
        const formGroup = document.querySelector('.form-group');
        if (formGroup) formGroup.appendChild(infoMsg);
        
    } else {
        // BELUM LOGIN ATAU BELUM PUNYA NAMA - BISA INPUT BEBAS
        if (nameInput) {
            nameInput.readOnly = false;
            nameInput.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            nameInput.style.cursor = 'text';
            nameInput.placeholder = 'Masukkan nama Anda (bebas)';
            nameInput.value = '';
        }
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }
        if (nameNote) {
            nameNote.innerHTML = '<i class="fas fa-info-circle"></i> Masukkan nama Anda. Nama akan digunakan untuk transaksi.';
            nameNote.style.color = '#888';
        }
        
        const infoMsg = document.createElement('p');
        infoMsg.id = 'profileInfoMsg';
        infoMsg.style.cssText = 'color: #4facfe; font-size: 12px; margin-top: 8px; text-align: center; padding: 8px; background: rgba(79, 172, 254, 0.1); border-radius: 8px;';
        infoMsg.innerHTML = '<i class="fas fa-info-circle"></i> Anda belum login. Masukkan nama bebas untuk memulai belanja.';
        const formGroup = document.querySelector('.form-group');
        if (formGroup) formGroup.appendChild(infoMsg);
    }
}

// Save name (login)
async function saveName() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const hasSetName = localStorage.getItem('hasSetName') === 'true';
    
    // Jika sudah login dan sudah punya nama, tidak bisa ganti
    if (isLoggedIn && hasSetName) {
        alert('⚠️ Anda sudah login! Silakan logout terlebih dahulu jika ingin mengganti nama.');
        return;
    }
    
    const newName = document.getElementById('userNameInput').value.trim();
    
    if (!newName) {
        alert('Masukkan nama Anda!');
        return;
    }
    
    if (newName.length < 3) {
        alert('Nama minimal 3 karakter!');
        return;
    }
    
    // Simpan nama ke localStorage (LOGIN)
    localStorage.setItem('userName', newName);
    localStorage.setItem('buyerName', newName);
    localStorage.setItem('hasSetName', 'true');
    localStorage.setItem('isLoggedIn', 'true');
    
    document.getElementById('displayName').textContent = newName;
    
    // Update UI
    const nameInput = document.getElementById('userNameInput');
    const saveBtn = document.getElementById('saveBtn');
    
    if (nameInput) {
        nameInput.readOnly = true;
        nameInput.style.backgroundColor = 'rgba(0,0,0,0.5)';
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

// LOGOUT - Hapus session, nama kembali ke Customer
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?\n\nSetelah logout, Anda bisa login dengan nama baru.')) {
        // Simpan cart dulu
        const cart = localStorage.getItem('cart');
        
        // Hapus semua data user (logout)
        localStorage.removeItem('userName');
        localStorage.removeItem('buyerName');
        localStorage.removeItem('hasSetName');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        
        // Kembalikan cart
        if (cart) localStorage.setItem('cart', cart);
        
        // Reset tampilan
        document.getElementById('displayName').textContent = 'Customer';
        document.getElementById('userNameInput').value = '';
        document.getElementById('userNameInput').readOnly = false;
        document.getElementById('userNameInput').style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        
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
        infoMsg.innerHTML = '<i class="fas fa-info-circle"></i> Anda telah logout. Masukkan nama bebas untuk login kembali.';
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