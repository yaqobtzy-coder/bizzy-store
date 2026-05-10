// ========== TOOLS PAGE SCRIPT ==========

// Load theme dari localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('bizzy_theme_mode');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
    } else if (savedTheme === 'light') {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
    } else {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
    }
}

// Simpan theme
function saveTheme(mode) {
    localStorage.setItem('bizzy_theme_mode', mode);
}

// Toggle theme
function toggleTheme() {
    if (document.body.classList.contains('dark')) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        saveTheme('light');
        showToast('🌞 Mode Terang diaktifkan');
    } else {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        saveTheme('dark');
        showToast('🌙 Mode Gelap diaktifkan');
    }
}

// ========== NAVIGASI - LAGU TIDAK PERNAH BERHENTI ==========
function goToPage(page) {
    // SIMPAN STATE MUSIC SEBELUM PINDAH
    if (window.GlobalMusic && window.GlobalMusic.saveState) {
        window.GlobalMusic.saveState();
    }
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease';
    
    setTimeout(() => {
        window.location.href = page;
    }, 200);
}

function goBackToTools() {
    if (window.GlobalMusic && window.GlobalMusic.saveState) {
        window.GlobalMusic.saveState();
    }
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease';
    setTimeout(() => {
        window.location.href = 'tools.html';
    }, 200);
}

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setupHoverEffect() {
    const cards = document.querySelectorAll('.menu-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--x', `${x}%`);
            card.style.setProperty('--y', `${y}%`);
        });
        
        card.addEventListener('click', () => {
            const page = card.getAttribute('data-page');
            if (page) goToPage(page);
        });
    });
}

function setupScrollToTop() {
    const btn = document.createElement('div');
    btn.className = 'scroll-to-top';
    btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 45px;
        height: 45px;
        background: #ffd700;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999;
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(btn);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.style.opacity = '1';
            btn.style.transform = 'scale(1)';
        } else {
            btn.style.opacity = '0';
            btn.style.transform = 'scale(0)';
        }
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Update waktu yang ditampilkan
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.innerHTML = now.toLocaleDateString('id-ID', options) + ' | ' + now.toLocaleTimeString('id-ID');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    setupHoverEffect();
    setupScrollToTop();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    setTimeout(() => {
        showToast('🎧 Selamat datang di Bizzy Tools Zone!', 'success');
    }, 500);
    
    console.log('✅ Tools Zone siap! Music player persistent di background.');
});

window.goToPage = goToPage;
window.goBackToTools = goBackToTools;
window.showToast = showToast;
window.toggleTheme = toggleTheme;
window.loadTheme = loadTheme;