// ========================================
// NEWS.COM.JS - RAYY STORE
// ========================================

// Set date badge
const dateBadge = document.getElementById('dateBadge');
if (dateBadge) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateBadge.innerHTML = `<i class="far fa-calendar-alt"></i> ${new Date().toLocaleDateString('id-ID', options)}`;
}

// Navigation functions
function goToStore() {
    window.location.href = 'rayy-store.com.html';
}

function goToHistory() {
    window.location.href = 'history.html';
}

function goToActiveSewa() {
    window.location.href = 'active-sewa.html';
}

function goToPanel() {
    window.location.href = 'buy-panel.html';
}

function goToVouchers() {
    window.location.href = 'vouchers.html';
}

function checkStatus() {
    showToast('Menghubungi server... Silakan tunggu');
    setTimeout(() => {
        showToast('Masih dalam masa maintenance. Mohon bersabar! 🙏');
    }, 1500);
}

function showToast(msg) {
    let existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Animate cards
const cards = document.querySelectorAll('.update-card');
cards.forEach((card, index) => {
    card.style.animationDelay = `${0.1 + (index % 5) * 0.1}s`;
});

// Load stats from Firebase
function loadStats() {
    if (typeof database !== 'undefined') {
        database.ref('products').once('value', (snapshot) => {
            let count = 0;
            snapshot.forEach(typeSnapshot => {
                typeSnapshot.forEach(() => { count++; });
            });
            console.log(`📦 Total produk: ${count}`);
        });
        
        // Load active sewa count
        database.ref('sewa_orders').once('value', (snapshot) => {
            let activeCount = 0;
            if(snapshot.exists()){
                snapshot.forEach(child => {
                    const order = child.val();
                    if(order.status === 'active' && order.expiredAt > Date.now()){
                        activeCount++;
                    }
                });
            }
            console.log(`✅ Sewa aktif: ${activeCount}`);
        });
    }
}

// Set body class
document.body.classList.remove('dark');
document.body.classList.add('light');

// Initialize
setTimeout(() => {
    loadStats();
}, 500);