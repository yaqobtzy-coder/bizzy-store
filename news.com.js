// ========================================
// NEWS.COM.JS - RAYY STORE
// Updated with Live Chat & Customer Service News
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

function goToLiveChat() {
    window.location.href = 'live-chat.html';
}

function goToCS() {
    window.location.href = 'cs-chat.html';
}

function checkStatus() {
    showToast('Menghubungi server... Silakan tunggu');
    setTimeout(() => {
        showToast('Masih dalam masa maintenance. Mohon bersabar! 🙏');
    }, 1500);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Animate cards
const cards = document.querySelectorAll('.update-card, .chat-preview-card');
cards.forEach((card, index) => {
    card.style.animationDelay = `${0.1 + (index % 5) * 0.1}s`;
});

// Load stats from Firebase
function loadStats() {
    if (typeof database !== 'undefined') {
        // Load total products
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
        
        // Load live chat messages count
        database.ref('live_chat_messages').once('value', (snapshot) => {
            let messageCount = 0;
            if(snapshot.exists()){
                snapshot.forEach(child => {
                    messageCount++;
                });
            }
            console.log(`💬 Total pesan live chat: ${messageCount}`);
        });
        
        // Load CS sessions count
        database.ref('cs_chat_sessions').once('value', (snapshot) => {
            let sessionCount = 0;
            if(snapshot.exists()){
                snapshot.forEach(() => {
                    sessionCount++;
                });
            }
            console.log(`🎧 Total sesi CS: ${sessionCount}`);
        });
    }
}

// Set body class
document.body.classList.remove('dark');
document.body.classList.add('light');

// Add animation to timeline items
const timelineItems = document.querySelectorAll('.timeline-item');
timelineItems.forEach((item, index) => {
    item.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s both`;
});

// Initialize
setTimeout(() => {
    loadStats();
}, 500);

// Export functions to global
window.goToStore = goToStore;
window.goToHistory = goToHistory;
window.goToActiveSewa = goToActiveSewa;
window.goToPanel = goToPanel;
window.goToVouchers = goToVouchers;
window.goToLiveChat = goToLiveChat;
window.goToCS = goToCS;
window.checkStatus = checkStatus;
window.showToast = showToast;