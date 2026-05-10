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

// ========== LOAD UPDATE INFO DARI FIREBASE ==========
async function loadUpdateInfo() {
    try {
        const response = await fetch(`https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app/bizzy_settings/update_info.json`);
        const data = await response.json();
        
        const container = document.getElementById('updateInfoContainer');
        if (container && data && data.content) {
            container.style.display = 'block';
            const dateStr = data.date ? new Date(data.date).toLocaleDateString('id-ID') : '';
            const versionStr = data.version ? `v${data.version}` : '';
            
            container.innerHTML = `
                <div class="update-card">
                    <div class="update-header">
                        <i class="fas fa-newspaper"></i>
                        <span class="update-title">${escapeHtml(data.title || 'Update Terbaru')}</span>
                        ${versionStr ? `<span class="update-version">${escapeHtml(versionStr)}</span>` : ''}
                        ${dateStr ? `<span class="update-date"><i class="fas fa-calendar"></i> ${dateStr}</span>` : ''}
                    </div>
                    <div class="update-content">${escapeHtml(data.content).replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }
    } catch(e) {
        console.log('Gagal load update info:', e);
    }
}

// ========== LOAD README DARI FIREBASE ==========
async function loadReadme() {
    try {
        const response = await fetch(`https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app/bizzy_settings/readme.json`);
        const data = await response.json();
        
        const container = document.getElementById('readmeContainer');
        if (container && data && data.enabled && data.content) {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="readme-card">
                    <div class="readme-title">
                        <i class="fas fa-book-open"></i>
                        ${escapeHtml(data.title || '📖 Panduan Penggunaan Bizzy Tools Zone')}
                    </div>
                    <div class="readme-content">${escapeHtml(data.content).replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }
    } catch(e) {
        console.log('Gagal load readme:', e);
    }
}

// ========== LOAD POPUP DARI FIREBASE ==========
async function loadPopup() {
    try {
        const response = await fetch(`https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app/bizzy_settings/popup.json`);
        const data = await response.json();
        
        // Cek apakah popup sudah ditutup sebelumnya
        const popupClosed = localStorage.getItem('popup_closed');
        const popupClosedTime = localStorage.getItem('popup_closed_time');
        
        // Jika sudah ditutup dalam 1 jam, jangan tampilkan
        if (popupClosed && popupClosedTime) {
            const closedTime = parseInt(popupClosedTime);
            const now = Date.now();
            if (now - closedTime < 3600000) { // 1 jam
                return;
            }
        }
        
        const modal = document.getElementById('popupModal');
        if (modal && data && data.enabled) {
            // Set thumbnail
            const thumbImg = document.getElementById('popupThumb');
            if (thumbImg && data.thumbnail) {
                thumbImg.src = data.thumbnail;
                thumbImg.onerror = () => { thumbImg.src = 'https://via.placeholder.com/300x180?text=Bizzy+Tools'; };
            }
            
            // Set teks
            const popupText = document.getElementById('popupText');
            if (popupText) {
                popupText.innerHTML = escapeHtml(data.text || '').replace(/\n/g, '<br>');
            }
            
            // Set tombol 1
            const btn1 = document.getElementById('popupBtn1');
            if (btn1) {
                btn1.innerHTML = `<i class="fas ${data.btn1Icon || 'fa-check'}"></i> ${escapeHtml(data.btn1Text || 'OK')}`;
                window.popupBtn1Action = data.btn1Action || 'close';
                window.popupBtn1Url = data.btn1Url || '';
            }
            
            // Set tombol 2
            const btn2 = document.getElementById('popupBtn2');
            if (btn2 && data.btn2Text) {
                btn2.style.display = 'flex';
                btn2.innerHTML = `<i class="fas ${data.btn2Icon || 'fa-external-link-alt'}"></i> ${escapeHtml(data.btn2Text)}`;
                window.popupBtn2Action = data.btn2Action || 'link';
                window.popupBtn2Url = data.btn2Url || '';
            } else if (btn2) {
                btn2.style.display = 'none';
            }
            
            // Tampilkan modal
            modal.style.display = 'flex';
            
            // Reset checkbox
            const dontShowCheckbox = document.getElementById('dontShowAgain');
            if (dontShowCheckbox) {
                dontShowCheckbox.checked = false;
            }
        }
    } catch(e) {
        console.log('Gagal load popup:', e);
    }
}

// ========== FUNGSI UNTUK POPUP ==========
function closePopup() {
    const modal = document.getElementById('popupModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Cek apakah user ingin tidak menampilkan lagi
        const dontShow = document.getElementById('dontShowAgain');
        if (dontShow && dontShow.checked) {
            localStorage.setItem('popup_closed', 'true');
            localStorage.setItem('popup_closed_time', Date.now().toString());
        }
    }
}

function handlePopupBtn1() {
    const action = window.popupBtn1Action;
    const url = window.popupBtn1Url;
    
    if (action === 'link' && url) {
        window.open(url, '_blank');
        closePopup();
    } else {
        closePopup();
    }
}

function handlePopupBtn2() {
    const action = window.popupBtn2Action;
    const url = window.popupBtn2Url;
    
    if (action === 'link' && url) {
        window.open(url, '_blank');
    }
    closePopup();
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    setupHoverEffect();
    setupScrollToTop();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load data dari Firebase
    loadUpdateInfo();
    loadReadme();
    loadPopup();
    
    setTimeout(() => {
        showToast('🎧 Selamat datang di Bizzy Tools Zone!', 'success');
    }, 500);
    
    console.log('✅ Tools Zone siap! Music player persistent di background.');
    console.log('✅ Popup, Update Info, Readme siap dikelola dari Admin Panel!');
});

// Expose functions ke global
window.goToPage = goToPage;
window.goBackToTools = goBackToTools;
window.showToast = showToast;
window.toggleTheme = toggleTheme;
window.loadTheme = loadTheme;
window.closePopup = closePopup;
window.handlePopupBtn1 = handlePopupBtn1;
window.handlePopupBtn2 = handlePopupBtn2;