// ========================================
// PROFILE PAGE - RAYY STORE
// ========================================

// Load user data
async function loadUserData() {
    const savedName = localStorage.getItem('userName');
    const joinDate = localStorage.getItem('joinDate');
    const hasSetName = localStorage.getItem('hasSetName') === 'true';
    
    console.log('📝 Load User Data:', { savedName, hasSetName });
    
    // Tampilkan nama
    if (savedName && savedName !== 'Customer' && savedName !== 'null' && savedName !== 'Guest') {
        document.getElementById('displayName').textContent = savedName;
        document.getElementById('userNameInput').value = savedName;
    } else {
        document.getElementById('displayName').textContent = 'Guest';
        document.getElementById('userNameInput').value = '';
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
    
    // CEK IZIN DARI ADMIN (via Firebase)
    let canRename = false;
    const currentUser = savedName;
    
    if (currentUser && currentUser !== 'Customer' && currentUser !== 'null' && currentUser !== 'Guest') {
        try {
            const snapshot = await database.ref(`user_permissions/${currentUser}`).once('value');
            const perm = snapshot.val();
            canRename = perm?.canRename === true;
            console.log(`🔑 User ${currentUser}, canRename: ${canRename}`);
        } catch(e) {
            console.error('Error checking permission:', e);
        }
    }
    
    // UPDATE UI berdasarkan status
    const nameInput = document.getElementById('userNameInput');
    const saveBtn = document.getElementById('saveBtn');
    const nameNote = document.getElementById('nameNote');
    
    // Hapus pesan info lama
    const oldInfo = document.getElementById('profileInfoMsg');
    if (oldInfo) oldInfo.remove();
    
    if (hasSetName) {
        // SUDAH PERNAH GANTI NAMA - LOCK PERMANEN
        if (nameInput) {
            nameInput.readOnly = true;
            nameInput.style.backgroundColor = 'rgba(0,0,0,0.5)';
            nameInput.style.cursor = 'not-allowed';
        }
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
        }
        if (nameNote) {
            nameNote.innerHTML = '<i class="fas fa-lock"></i> Nama sudah pernah diganti dan tidak dapat diubah lagi.';
            nameNote.style.color = '#f59e0b';
        }
        
        const infoMsg = document.createElement('p');
        infoMsg.id = 'profileInfoMsg';
        infoMsg.style.cssText = 'color: #f59e0b; font-size: 12px; margin-top: 8px; text-align: center; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 8px;';
        infoMsg.innerHTML = '<i class="fas fa-info-circle"></i> Anda sudah pernah mengganti nama. Nama tidak dapat diubah lagi.';
        const formGroup = document.querySelector('.form-group');
        if (formGroup) formGroup.appendChild(infoMsg);
        
    } else if (!canRename) {
        // BELUM DAPAT IZIN DARI ADMIN
        if (nameInput) {
            nameInput.readOnly = true;
            nameInput.style.backgroundColor = 'rgba(0,0,0,0.5)';
            nameInput.style.cursor = 'not-allowed';
        }
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
        }
        if (nameNote) {
            nameNote.innerHTML = '<i class="fas fa-lock"></i> Anda belum mendapat izin untuk mengganti nama. Hubungi admin.';
            nameNote.style.color = '#ef4444';
        }
        
        const infoMsg = document.createElement('p');
        infoMsg.id = 'profileInfoMsg';
        infoMsg.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 8px; text-align: center; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;';
        infoMsg.innerHTML = '<i class="fas fa-lock"></i> Anda belum mendapat izin untuk mengganti nama. Silakan hubungi admin untuk mendapatkan akses.';
        const formGroup = document.querySelector('.form-group');
        if (formGroup) formGroup.appendChild(infoMsg);
        
    } else {
        // DAPAT IZIN DAN BELUM PERNAH GANTI
        if (nameInput) {
            nameInput.readOnly = false;
            nameInput.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            nameInput.style.cursor = 'text';
        }
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }
        if (nameNote) {
            nameNote.innerHTML = '<i class="fas fa-check-circle"></i> Anda memiliki izin untuk mengganti nama. Nama hanya bisa diganti SATU KALI.';
            nameNote.style.color = '#22c55e';
        }
        
        const infoMsg = document.createElement('p');
        infoMsg.id = 'profileInfoMsg';
        infoMsg.style.cssText = 'color: #22c55e; font-size: 12px; margin-top: 8px; text-align: center; padding: 8px; background: rgba(34, 197, 94, 0.1); border-radius: 8px;';
        infoMsg.innerHTML = '<i class="fas fa-check-circle"></i> Anda memiliki izin untuk mengganti nama. Nama hanya bisa diganti SATU KALI.';
        const formGroup = document.querySelector('.form-group');
        if (formGroup) formGroup.appendChild(infoMsg);
    }
}

// Save name
async function saveName() {
    const hasSetName = localStorage.getItem('hasSetName') === 'true';
    const currentUser = localStorage.getItem('userName');
    
    // Cek sudah pernah ganti
    if (hasSetName) {
        alert('⚠️ Anda sudah pernah mengganti nama! Nama tidak dapat diubah lagi.');
        return;
    }
    
    // Cek izin dari admin
    let canRename = false;
    if (currentUser && currentUser !== 'Customer' && currentUser !== 'null' && currentUser !== 'Guest') {
        try {
            const snapshot = await database.ref(`user_permissions/${currentUser}`).once('value');
            const perm = snapshot.val();
            canRename = perm?.canRename === true;
        } catch(e) {
            console.error(e);
        }
    }
    
    if (!canRename) {
        alert('⚠️ Anda belum mendapatkan izin untuk mengganti nama. Silakan hubungi admin!');
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
    
    const oldName = currentUser;
    
    // Simpan ke localStorage
    localStorage.setItem('userName', newName);
    localStorage.setItem('buyerName', newName);
    localStorage.setItem('hasSetName', 'true');
    
    document.getElementById('displayName').textContent = newName;
    
    // Update di database
    await updateDatabaseName(oldName, newName);
    
    // Matikan izin di Firebase (karena sudah ganti)
    await database.ref(`user_permissions/${newName}`).set({
        canRename: false,
        hasChanged: true,
        changedAt: Date.now(),
        renamedFrom: oldName
    });
    
    // Hapus permission lama
    if (oldName && oldName !== newName && oldName !== 'null' && oldName !== 'Customer') {
        await database.ref(`user_permissions/${oldName}`).remove();
    }
    
    // Disable input
    const nameInput = document.getElementById('userNameInput');
    if (nameInput) {
        nameInput.readOnly = true;
        nameInput.style.backgroundColor = 'rgba(0,0,0,0.5)';
    }
    
    // Disable tombol
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.5';
        saveBtn.style.cursor = 'not-allowed';
    }
    
    showNotification('✅ Nama berhasil diganti!', 'success');
    
    setTimeout(() => {
        window.location.href = 'rayy-store.com.html';
    }, 1500);
}

// Update nama di semua database
async function updateDatabaseName(oldName, newName) {
    if (!oldName || oldName === newName) return;
    if (oldName === 'Customer' || oldName === 'null' || oldName === 'Guest') return;
    
    console.log(`🔄 Mengupdate nama dari "${oldName}" menjadi "${newName}"`);
    
    try {
        // Update di sewa_orders
        const snapshot = await database.ref('sewa_orders').once('value');
        if (snapshot.exists()) {
            const updates = [];
            snapshot.forEach(child => {
                const order = child.val();
                if (order.buyerName === oldName) {
                    updates.push(database.ref(`sewa_orders/${child.key}`).update({ buyerName: newName }));
                }
                if (order.username === oldName) {
                    updates.push(database.ref(`sewa_orders/${child.key}`).update({ username: newName }));
                }
            });
            await Promise.all(updates);
            console.log(`✅ Updated ${updates.length} records in sewa_orders`);
        }
    } catch(e) {
        console.error('Error update database:', e);
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

// Logout
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        const cart = localStorage.getItem('cart');
        const userName = localStorage.getItem('userName');
        localStorage.clear();
        if (cart) localStorage.setItem('cart', cart);
        if (userName && userName !== 'Customer') localStorage.setItem('userName', userName);
        window.location.href = 'rayy-store.com.html';
    }
}

// Load data saat halaman dimuat
loadUserData();