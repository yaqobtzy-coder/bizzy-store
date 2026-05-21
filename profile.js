// Load user data
function loadUserData() {
    const savedName = localStorage.getItem('userName');
    const joinDate = localStorage.getItem('joinDate');
    
    if (savedName) {
        document.getElementById('displayName').textContent = savedName;
        document.getElementById('userNameInput').value = savedName;
    } else {
        document.getElementById('displayName').textContent = 'Customer';
    }
    
    if (joinDate) {
        document.getElementById('joinDate').textContent = joinDate;
    } else {
        const date = new Date().getFullYear().toString();
        document.getElementById('joinDate').textContent = date;
        localStorage.setItem('joinDate', date);
    }
    
    document.getElementById('userEmail').textContent = localStorage.getItem('userEmail') || 'customer@rayystore.com';
}

// Save name
function saveName() {
    const newName = document.getElementById('userNameInput').value.trim();
    
    if (!newName) {
        alert('Masukkan nama Anda!');
        return;
    }
    
    localStorage.setItem('userName', newName);
    document.getElementById('displayName').textContent = newName;
    
    const notif = document.createElement('div');
    notif.className = 'notification success';
    notif.innerHTML = '<i class="fas fa-check-circle"></i> Nama berhasil diubah!';
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #00f2fe, #4facfe);
        color: white;
        padding: 12px 20px;
        border-radius: 40px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
}

// Logout
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        const cart = localStorage.getItem('cart');
        localStorage.clear();
        if (cart) localStorage.setItem('cart', cart);
        window.location.href = 'rayy-store.com.html';
    }
}

// Animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

loadUserData();