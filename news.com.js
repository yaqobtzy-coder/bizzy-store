// Set current date
const dateBadge = document.getElementById('dateBadge');
if (dateBadge) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateBadge.innerHTML = `<i class="far fa-calendar-alt"></i> ${new Date().toLocaleDateString('id-ID', options)}`;
}

// Go to tools
function goToTools() {
    window.location.href = 'tools.html';
}

// Go to store
function goToStore() {
    window.location.href = 'rayy-store.com.html';
}

// Check status
function checkStatus() {
    showToast('Menghubungi server... Silakan tunggu');
    
    setTimeout(() => {
        showToast('Masih dalam masa maintenance. Mohon bersabar! 🙏');
    }, 1500);
}

// Show toast message
function showToast(msg) {
    let existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Animation delay for cards
const cards = document.querySelectorAll('.update-card');
cards.forEach((card, index) => {
    card.style.animationDelay = `${0.1 + (index % 5) * 0.1}s`;
});

// Load stats dari Firebase (opsional)
function loadStats() {
    if (typeof database !== 'undefined') {
        // Total produk
        database.ref('products').once('value', (snapshot) => {
            let count = 0;
            snapshot.forEach(typeSnapshot => {
                typeSnapshot.forEach(() => { count++; });
            });
            const statsProducts = document.querySelector('.stat-card .number');
            if (statsProducts && document.querySelector('.stat-card')) {
                // Jika ada element stat-card di HTML (tambahan)
            }
        });
    }
}

// Load theme (light mode default untuk news)
document.body.classList.remove('dark');
document.body.classList.add('light');

// Inisialisasi
setTimeout(() => {
    loadStats();
}, 500);