const dateBadge = document.getElementById('dateBadge');
if (dateBadge) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateBadge.innerHTML = `<i class="far fa-calendar-alt"></i> ${new Date().toLocaleDateString('id-ID', options)}`;
}

function goToTools() {
    window.location.href = 'tools.html';
}

function goToStore() {
    window.location.href = 'rayy-store.com.html';
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

const cards = document.querySelectorAll('.update-card');
cards.forEach((card, index) => {
    card.style.animationDelay = `${0.1 + (index % 5) * 0.1}s`;
});

function loadStats() {
    if (typeof database !== 'undefined') {
        database.ref('products').once('value', (snapshot) => {
            let count = 0;
            snapshot.forEach(typeSnapshot => {
                typeSnapshot.forEach(() => { count++; });
            });
        });
    }
}

document.body.classList.remove('dark');
document.body.classList.add('light');

setTimeout(() => {
    loadStats();
}, 500);