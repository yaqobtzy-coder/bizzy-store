import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase, ref, get, set, push, remove, onValue, update } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBUHSGJ2Yaet7ue1x8WLcHn6LI627SINqg",
    authDomain: "rayy-digital-store.firebaseapp.com",
    databaseURL: "https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rayy-digital-store",
    storageBucket: "rayy-digital-store.firebasestorage.app",
    messagingSenderId: "537690791174",
    appId: "1:537690791174:web:c29f7cdfcae0506b6e1287"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let adminId = localStorage.getItem("bizzy_userId");
let adminUsername = localStorage.getItem("bizzy_username");

function showToast(msg) {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showLoading() { document.getElementById("loadingOverlay").classList.add("show"); }
function hideLoading() { document.getElementById("loadingOverlay").classList.remove("show"); }

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function openBot() {
    window.open('https://t.me/BizzyImpactBot', '_blank');
}

// ==================== BOT CONFIG FUNCTIONS ====================
async function loadBotConfig() {
    const botConfigRef = ref(db, 'bizzy_settings/bot_config');
    const snapshot = await get(botConfigRef);
    const config = snapshot.val();
    
    if (config) {
        document.getElementById('botOnlineToggle').checked = config.online || false;
        document.getElementById('botStatusTextConfig').innerText = config.online ? 'Online' : 'Offline';
        document.getElementById('botUsername').value = config.username || 'BizzyImpactBot';
        document.getElementById('botLink').value = config.link || 'https://t.me/BizzyImpactBot';
        
        const dot = document.getElementById('botStatusDot');
        if (config.online) {
            dot.className = 'status-dot online';
            document.getElementById('botStatusText').innerHTML = '<i class="fab fa-telegram"></i> Bot Online';
        } else {
            dot.className = 'status-dot offline';
            document.getElementById('botStatusText').innerHTML = '<i class="fab fa-telegram"></i> Bot Offline';
        }
    }
}

async function saveBotConfig() {
    const config = {
        online: document.getElementById('botOnlineToggle').checked,
        username: document.getElementById('botUsername').value.trim(),
        link: document.getElementById('botLink').value.trim(),
        updatedAt: new Date().toISOString()
    };
    
    await set(ref(db, 'bizzy_settings/bot_config'), config);
    showToast("✅ Konfigurasi bot disimpan!");
    loadBotConfig();
}

async function sendBroadcast() {
    const message = document.getElementById('broadcastMessage').value.trim();
    if (!message) {
        showToast("Masukkan pesan broadcast!");
        return;
    }
    
    showLoading();
    try {
        await push(ref(db, 'bizzy_broadcasts'), {
            message: message,
            sender: adminUsername || 'Admin',
            timestamp: Date.now(),
            sent: false
        });
        showToast("✅ Broadcast dikirim! Bot akan memprosesnya.");
        document.getElementById('broadcastMessage').value = '';
    } catch (error) {
        showToast("❌ Gagal mengirim broadcast!");
    } finally {
        hideLoading();
    }
}

// ==================== CUSTOM THEME FUNCTIONS ====================
async function loadTheme() {
    const themeRef = ref(db, 'bizzy_settings/theme');
    const snapshot = await get(themeRef);
    const theme = snapshot.val();
    
    if (theme) {
        document.getElementById('primaryColor').value = theme.primaryColor || '#1e88e5';
        document.getElementById('primaryDark').value = theme.primaryDark || '#0d47a1';
        document.getElementById('accentColor').value = theme.accentColor || '#ffd700';
        document.getElementById('accentDark').value = theme.accentDark || '#ff8c00';
        applyThemeToPage({
            primaryColor: theme.primaryColor || '#1e88e5',
            primaryDark: theme.primaryDark || '#0d47a1',
            primaryLight: theme.primaryLight || '#42a5f5',
            accentColor: theme.accentColor || '#ffd700',
            accentDark: theme.accentDark || '#ff8c00'
        });
    } else {
        document.getElementById('primaryColor').value = '#1e88e5';
        document.getElementById('primaryDark').value = '#0d47a1';
        document.getElementById('accentColor').value = '#ffd700';
        document.getElementById('accentDark').value = '#ff8c00';
        applyThemeToPage({
            primaryColor: '#1e88e5',
            primaryDark: '#0d47a1',
            primaryLight: '#42a5f5',
            accentColor: '#ffd700',
            accentDark: '#ff8c00'
        });
    }
    updatePreview();
}

function applyThemeToPage(theme) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--primary-dark', theme.primaryDark);
    root.style.setProperty('--primary-light', theme.primaryLight || '#42a5f5');
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-dark', theme.accentDark);
}

function updatePreview() {
    const primary = document.getElementById('primaryColor').value;
    const primaryDark = document.getElementById('primaryDark').value;
    const accent = document.getElementById('accentColor').value;
    
    const preview = document.getElementById('themePreview');
    if (preview) {
        preview.innerHTML = `
            <p style="margin-bottom: 10px;">Preview:</p>
            <span class="preview-btn" style="background: linear-gradient(95deg, ${primary}, ${primaryDark});">Tombol Utama</span>
            <span class="preview-accent" style="background: ${accent};">Tombol Aksen</span>
        `;
    }
}

document.getElementById('saveThemeBtn')?.addEventListener('click', async () => {
    const themeData = {
        primaryColor: document.getElementById('primaryColor').value,
        primaryDark: document.getElementById('primaryDark').value,
        primaryLight: '#42a5f5',
        accentColor: document.getElementById('accentColor').value,
        accentDark: document.getElementById('accentDark').value,
        updatedAt: new Date().toISOString()
    };
    
    await set(ref(db, 'bizzy_settings/theme'), themeData);
    applyThemeToPage(themeData);
    showToast("✅ Tema berhasil disimpan!");
});

document.getElementById('resetThemeBtn')?.addEventListener('click', async () => {
    const defaultTheme = {
        primaryColor: '#1e88e5',
        primaryDark: '#0d47a1',
        primaryLight: '#42a5f5',
        accentColor: '#ffd700',
        accentDark: '#ff8c00',
        updatedAt: new Date().toISOString()
    };
    await set(ref(db, 'bizzy_settings/theme'), defaultTheme);
    document.getElementById('primaryColor').value = '#1e88e5';
    document.getElementById('primaryDark').value = '#0d47a1';
    document.getElementById('accentColor').value = '#ffd700';
    document.getElementById('accentDark').value = '#ff8c00';
    applyThemeToPage(defaultTheme);
    updatePreview();
    showToast("✅ Tema direset ke default!");
});

document.getElementById('primaryColor')?.addEventListener('input', updatePreview);
document.getElementById('primaryDark')?.addEventListener('input', updatePreview);
document.getElementById('accentColor')?.addEventListener('input', updatePreview);
document.getElementById('accentDark')?.addEventListener('input', updatePreview);

document.getElementById('saveBotConfigBtn')?.addEventListener('click', saveBotConfig);
document.getElementById('sendBroadcastBtn')?.addEventListener('click', sendBroadcast);
document.getElementById('botOnlineToggle')?.addEventListener('change', () => {
    document.getElementById('botStatusTextConfig').innerText = document.getElementById('botOnlineToggle').checked ? 'Online' : 'Offline';
});

// ==================== VIDEO LOADING (BARU) ====================
async function loadLoadingVideoUrl() {
    const loadingVideoRef = ref(db, 'bizzy_settings/loading_video_url');
    const snapshot = await get(loadingVideoRef);
    const videoUrl = snapshot.val();
    if (videoUrl) {
        document.getElementById('loadingVideoUrl').value = videoUrl;
        const previewVideo = document.getElementById('previewLoadingVideo');
        const sourceElement = previewVideo.querySelector('source');
        if (sourceElement) {
            sourceElement.src = videoUrl;
            previewVideo.load();
        }
    } else {
        document.getElementById('loadingVideoUrl').value = 'https://o.uguu.se/hbSphLyQ.mp4';
    }
}

document.getElementById('saveLoadingVideoBtn')?.addEventListener('click', async () => {
    const videoUrl = document.getElementById('loadingVideoUrl').value.trim();
    if (!videoUrl) {
        showToast("Masukkan URL video loading!");
        return;
    }
    await set(ref(db, 'bizzy_settings/loading_video_url'), videoUrl);
    showToast("✅ Video Loading URL disimpan! Akan tampil saat buka website.");
    loadLoadingVideoUrl();
});

// ==================== OWNERS (MANAJEMEN ADMIN) ====================
let currentOwners = [];

async function loadOwners() {
    const ownersRef = ref(db, 'bizzy_settings/owners');
    const snapshot = await get(ownersRef);
    const owners = snapshot.val();
    const container = document.getElementById('ownersList');
    
    if (!owners || Object.keys(owners).length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;">Belum ada owner selain admin utama</div>';
        return;
    }
    
    currentOwners = Object.entries(owners);
    let html = '';
    for (const [userId, ownerData] of currentOwners) {
        html += `
            <div class="owner-item">
                <div>
                    <div class="owner-name"><i class="fas fa-crown"></i> ${escapeHtml(ownerData.username)}</div>
                    <div style="font-size:0.7rem; opacity:0.6;">User ID: ${userId.substring(0, 12)}...</div>
                </div>
                <button class="btn-danger" onclick="removeOwner('${userId}')">Hapus Akses</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

window.removeOwner = async function(userId) {
    if (confirm("Hapus akses admin untuk user ini?")) {
        await remove(ref(db, `bizzy_settings/owners/${userId}`));
        showToast("✅ Akses admin dihapus!");
        loadOwners();
    }
};

document.getElementById('addOwnerBtn')?.addEventListener('click', async () => {
    const username = document.getElementById('ownerUsername').value.trim();
    if (!username) {
        showToast("Masukkan username!");
        return;
    }
    
    showLoading();
    try {
        const usersRef = ref(db, 'bizzy_users');
        const snapshot = await get(usersRef);
        const users = snapshot.val();
        
        let foundUserId = null;
        let foundUsername = null;
        
        for (const [id, user] of Object.entries(users)) {
            if (user.username.toLowerCase() === username.toLowerCase()) {
                foundUserId = id;
                foundUsername = user.username;
                break;
            }
        }
        
        if (!foundUserId) {
            showToast("Username tidak ditemukan!");
            hideLoading();
            return;
        }
        
        await set(ref(db, `bizzy_settings/owners/${foundUserId}`), {
            username: foundUsername,
            addedBy: adminUsername,
            addedAt: new Date().toISOString()
        });
        
        showToast(`✅ ${foundUsername} sekarang menjadi owner/admin!`);
        document.getElementById('ownerUsername').value = '';
        loadOwners();
    } catch (error) {
        showToast("Error: " + error.message);
    } finally {
        hideLoading();
    }
});

// ==================== CATEGORIES (MANAJEMEN KATEGORI) ====================
async function loadCategories() {
    const categoriesRef = ref(db, 'bizzy_settings/categories');
    const snapshot = await get(categoriesRef);
    const categories = snapshot.val();
    const container = document.getElementById('categoriesList');
    const categorySelect = document.getElementById('productCategory');
    
    if (!categories || Object.keys(categories).length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;">Belum ada kategori. Silakan tambah kategori terlebih dahulu.</div>';
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Belum ada kategori</option>';
        }
        return;
    }
    
    let html = '';
    let categoryOptions = '<option value="">Pilih Kategori</option>';
    
    for (const [id, category] of Object.entries(categories)) {
        html += `
            <div class="category-item">
                <div>
                    <div class="category-name"><i class="fas ${category.icon || 'fa-folder'}"></i> ${escapeHtml(category.name)}</div>
                    <div style="font-size:0.7rem; opacity:0.6;">ID: ${id.substring(0, 8)}...</div>
                </div>
                <button class="btn-danger" onclick="deleteCategory('${id}')">Hapus</button>
            </div>
        `;
        categoryOptions += `<option value="${id}">${escapeHtml(category.name)}</option>`;
    }
    
    container.innerHTML = html;
    if (categorySelect) {
        categorySelect.innerHTML = categoryOptions;
    }
}

window.deleteCategory = async function(categoryId) {
    if (confirm("Hapus kategori ini? Semua produk dalam kategori ini juga akan terhapus!")) {
        // Hapus semua produk dalam kategori ini
        const productsRef = ref(db, 'bizzy_settings/products');
        const snapshot = await get(productsRef);
        const products = snapshot.val();
        if (products) {
            for (const [prodId, product] of Object.entries(products)) {
                if (product.categoryId === categoryId) {
                    await remove(ref(db, `bizzy_settings/products/${prodId}`));
                }
            }
        }
        await remove(ref(db, `bizzy_settings/categories/${categoryId}`));
        showToast("Kategori dan produk di dalamnya dihapus!");
        loadCategories();
        loadProducts();
    }
};

document.getElementById('addCategoryBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('categoryName').value.trim();
    const icon = document.getElementById('categoryIcon').value.trim();
    
    if (!name) {
        showToast("Masukkan nama kategori!");
        return;
    }
    
    await push(ref(db, 'bizzy_settings/categories'), {
        name: name,
        icon: icon || 'fa-box',
        createdAt: new Date().toISOString(),
        createdBy: adminUsername
    });
    
    showToast(`✅ Kategori "${name}" ditambahkan!`);
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryIcon').value = 'fa-box';
    loadCategories();
});

// ==================== PRODUCTS (MANAJEMEN PRODUK) ====================
async function loadProducts() {
    const productsRef = ref(db, 'bizzy_settings/products');
    const snapshot = await get(productsRef);
    const products = snapshot.val();
    const container = document.getElementById('productsList');
    
    // Load categories untuk mapping
    const categoriesRef = ref(db, 'bizzy_settings/categories');
    const categoriesSnap = await get(categoriesRef);
    const categories = categoriesSnap.val() || {};
    
    if (!products || Object.keys(products).length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;">Belum ada produk. Silakan tambah produk.</div>';
        return;
    }
    
    let html = '';
    for (const [id, product] of Object.entries(products)) {
        const categoryName = categories[product.categoryId]?.name || 'Kategori tidak ditemukan';
        html += `
            <div class="product-item">
                <div style="flex:1;">
                    <div class="product-name"><i class="fas fa-box"></i> ${escapeHtml(product.name)}</div>
                    <div class="product-price">Rp ${(product.price || 0).toLocaleString()}</div>
                    <div class="product-category-badge"><i class="fas fa-folder"></i> ${escapeHtml(categoryName)}</div>
                    ${product.desc ? `<div style="font-size:0.7rem; opacity:0.6;">${escapeHtml(product.desc)}</div>` : ''}
                </div>
                <button class="btn-danger" onclick="deleteProduct('${id}')">Hapus</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

window.deleteProduct = async function(productId) {
    if (confirm("Hapus produk ini?")) {
        await remove(ref(db, `bizzy_settings/products/${productId}`));
        showToast("Produk dihapus!");
        loadProducts();
    }
};

document.getElementById('addProductBtn')?.addEventListener('click', async () => {
    const categoryId = document.getElementById('productCategory').value;
    const name = document.getElementById('productName').value.trim();
    const price = parseInt(document.getElementById('productPrice').value);
    const desc = document.getElementById('productDesc').value.trim();
    
    if (!categoryId) {
        showToast("Pilih kategori terlebih dahulu!");
        return;
    }
    if (!name) {
        showToast("Masukkan nama produk!");
        return;
    }
    if (!price || price <= 0) {
        showToast("Masukkan harga yang valid!");
        return;
    }
    
    await push(ref(db, 'bizzy_settings/products'), {
        categoryId: categoryId,
        name: name,
        price: price,
        desc: desc || '',
        createdAt: new Date().toISOString(),
        createdBy: adminUsername
    });
    
    showToast(`✅ Produk "${name}" ditambahkan!`);
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDesc').value = '';
    loadProducts();
});

// Cek akses admin
async function checkAdminAccess() {
    if (!adminId) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;"><i class="fas fa-lock" style="font-size:4rem;"></i><h2>Akses Ditolak!</h2><p>Silakan login sebagai admin terlebih dahulu di web utama.</p><a href="index.html" style="color:var(--primary-color);">Kembali ke Beranda</a></div>';
        return false;
    }
    
    const userRef = ref(db, `bizzy_users/${adminId}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    
    // Cek apakah user adalah owner (admin)
    const ownersRef = ref(db, 'bizzy_settings/owners');
    const ownersSnap = await get(ownersRef);
    const owners = ownersSnap.val() || {};
    const isOwner = owners[adminId] !== undefined;
    
    if (!userData || (userData.username !== 'admin' && userData.username !== 'bizzyadmin' && userData.username !== 'Rayy' && userData.username !== 'Jogi' && !isOwner)) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;"><i class="fas fa-lock" style="font-size:4rem;"></i><h2>Akses Ditolak!</h2><p>Hanya admin yang bisa mengakses panel ini.</p><a href="index.html" style="color:var(--primary-color);">Kembali ke Beranda</a></div>';
        return false;
    }
    return true;
}

// ==================== STATISTIK ====================
async function updateStats() {
    const ordersRef = ref(db, 'bizzy_orders');
    const snapshot = await get(ordersRef);
    const orders = snapshot.val();
    
    let pending = 0, processing = 0, completed = 0, total = 0;
    if (orders) {
        const values = Object.values(orders);
        total = values.length;
        pending = values.filter(o => o.status === 'pending').length;
        processing = values.filter(o => o.status === 'processing').length;
        completed = values.filter(o => o.status === 'completed').length;
    }
    
    const usersRef = ref(db, 'bizzy_users');
    const usersSnap = await get(usersRef);
    const totalUsers = usersSnap.val() ? Object.keys(usersSnap.val()).length : 0;
    
    document.getElementById('totalPending').innerText = pending;
    document.getElementById('totalProcessing').innerText = processing;
    document.getElementById('totalCompleted').innerText = completed;
    document.getElementById('totalOrders').innerText = total;
    document.getElementById('totalUsers').innerText = totalUsers;
}

// ==================== ORDERS ====================
function loadOrders() {
    onValue(ref(db, 'bizzy_orders'), (snapshot) => {
        const orders = snapshot.val();
        const container = document.getElementById('ordersList');
        
        if (!orders) {
            container.innerHTML = '<div style="text-align:center;padding:40px;">Belum ada pesanan</div>';
            updateStats();
            return;
        }
        
        const ordersArray = Object.entries(orders).sort((a,b) => new Date(b[1].createdAt) - new Date(a[1].createdAt));
        
        let html = '';
        for (const [id, order] of ordersArray) {
            let statusClass = '';
            let statusBadge = '';
            
            if (order.status === 'pending') {
                statusClass = 'pending';
                statusBadge = '<span class="status-badge status-pending">⏳ PENDING</span>';
            } else if (order.status === 'processing') {
                statusClass = 'processing';
                statusBadge = '<span class="status-badge status-processing">⚙️ PROCESSING</span>';
            } else if (order.status === 'completed') {
                statusClass = 'completed';
                statusBadge = '<span class="status-badge status-completed">✅ COMPLETED</span>';
            } else {
                statusClass = 'cancelled';
                statusBadge = '<span class="status-badge status-cancelled">❌ CANCELLED</span>';
            }
            
            html += `
                <div class="order-card ${statusClass}">
                    <div class="order-header">
                        <strong>${escapeHtml(order.username)}</strong>
                        ${statusBadge}
                    </div>
                    <div class="order-details">
                        📦 Produk: ${escapeHtml(order.productName)}<br>
                        💰 Total: Rp ${order.productPrice?.toLocaleString() || 0}<br>
                        🎫 Antrian: ${order.queueNumber || '-'}<br>
                        🔑 Login Method: ${escapeHtml(order.loginMethod || '-')}<br>
                        📧 Email/User: ${escapeHtml(order.loginEmail || '-')}<br>
                        🔑 Password: ${escapeHtml(order.loginPassword || '****')}<br>
                        📱 WA: ${escapeHtml(order.phoneNumber || '-')}<br>
                        🔗 Bukti TF: <a href="${escapeHtml(order.proofLink || '#')}" target="_blank" style="color:var(--primary-color);">Lihat Bukti</a><br>
                        📝 Catatan: ${escapeHtml(order.notes || '-')}<br>
                        📅 Dibuat: ${new Date(order.createdAt).toLocaleString()}
                    </div>
                    <div class="btn-group">
                        ${order.status === 'pending' ? `<button class="btn-success" onclick="updateOrderStatus('${id}', 'processing')">✅ ACC & Proses</button>` : ''}
                        ${order.status === 'processing' ? `<button class="btn-success" onclick="updateOrderStatus('${id}', 'completed')">✅ Selesai</button>` : ''}
                        ${order.status === 'pending' || order.status === 'processing' ? `<button class="btn-danger" onclick="updateOrderStatus('${id}', 'cancelled')">❌ Tolak/Batal</button>` : ''}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
        updateStats();
    });
}

window.updateOrderStatus = async function(orderId, status) {
    if (confirm(`Ubah status pesanan menjadi ${status.toUpperCase()}?`)) {
        await update(ref(db, `bizzy_orders/${orderId}`), { 
            status: status, 
            updatedAt: new Date().toISOString(),
            processedBy: adminUsername || 'admin'
        });
        showToast(`✅ Status pesanan diubah menjadi ${status.toUpperCase()}`);
        
        try {
            await push(ref(db, 'bizzy_bot_notifications'), {
                type: 'status_update',
                orderId: orderId,
                status: status,
                timestamp: Date.now()
            });
        } catch(e) {}
    }
};

// ==================== SCHEDULE ====================
async function loadSchedule() {
    const statusRef = ref(db, 'bizzy_settings/web_status');
    const snapshot = await get(statusRef);
    const data = snapshot.val() || {};
    
    document.getElementById('closeTime').value = data.closeHour ? `${data.closeHour.toString().padStart(2,'0')}:${(data.closeMinute || 0).toString().padStart(2,'0')}` : '23:00';
    document.getElementById('openTime').value = data.openHour ? `${data.openHour.toString().padStart(2,'0')}:${(data.openMinute || 0).toString().padStart(2,'0')}` : '08:00';
    document.getElementById('manualCloseToggle').checked = data.manualClosed || false;
    document.getElementById('manualCloseStatus').innerText = data.manualClosed ? '🔴 Tutup Manual (Web Tertutup)' : '✅ Normal (Jadwal Otomatis)';
    
    if (data.closeHour && data.openHour) {
        document.getElementById('scheduleStatus').innerHTML = `🕐 Web akan tutup otomatis pukul ${data.closeHour.toString().padStart(2,'0')}:${(data.closeMinute || 0).toString().padStart(2,'0')} WIB dan buka pukul ${data.openHour.toString().padStart(2,'0')}:${(data.openMinute || 0).toString().padStart(2,'0')} WIB`;
    }
}

document.getElementById('saveScheduleBtn')?.addEventListener('click', async () => {
    const closeTime = document.getElementById('closeTime').value;
    const openTime = document.getElementById('openTime').value;
    const manualClosed = document.getElementById('manualCloseToggle').checked;
    
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    const [openHour, openMinute] = openTime.split(':').map(Number);
    
    const scheduleData = {
        closeHour: closeHour,
        closeMinute: closeMinute,
        openHour: openHour,
        openMinute: openMinute,
        manualClosed: manualClosed,
        updatedAt: new Date().toISOString()
    };
    
    await set(ref(db, 'bizzy_settings/web_status'), scheduleData);
    showToast("✅ Jadwal operasional disimpan!");
    loadSchedule();
});

// ==================== VIDEO BACKGROUND ====================
async function loadVideoUrl() {
    const videoRef = ref(db, 'bizzy_settings/video_url');
    const snapshot = await get(videoRef);
    const videoUrl = snapshot.val();
    if (videoUrl) {
        document.getElementById('videoUrl').value = videoUrl;
        const previewVideo = document.getElementById('previewVideo');
        const sourceElement = previewVideo.querySelector('source');
        if (sourceElement) {
            sourceElement.src = videoUrl;
            previewVideo.load();
        }
    }
}

document.getElementById('saveVideoBtn')?.addEventListener('click', async () => {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    if (!videoUrl) {
        showToast("Masukkan URL video!");
        return;
    }
    await set(ref(db, 'bizzy_settings/video_url'), videoUrl);
    showToast("✅ Video URL disimpan!");
    loadVideoUrl();
});

// ==================== SLIDERS ====================
function loadSliders() {
    onValue(ref(db, 'bizzy_settings/slides'), (snapshot) => {
        const slides = snapshot.val();
        const container = document.getElementById('slidesList');
        
        if (!slides) {
            container.innerHTML = '<div style="text-align:center;padding:20px;">Belum ada slide</div>';
            return;
        }
        
        const slidesArray = Object.entries(slides);
        let html = '';
        for (const [id, slide] of slidesArray) {
            html += `
                <div class="slide-item">
                    <img src="${escapeHtml(slide.imageUrl)}" class="slide-preview" onerror="this.src='https://via.placeholder.com/60x40?text=Error'">
                    <div style="flex:1; word-break:break-all;">${escapeHtml(slide.imageUrl.substring(0, 50))}...</div>
                    <button class="btn-danger" onclick="deleteSlide('${id}')">Hapus</button>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

window.deleteSlide = async function(id) {
    if (confirm("Hapus slide ini?")) {
        await remove(ref(db, `bizzy_settings/slides/${id}`));
        showToast("Slide dihapus!");
    }
};

document.getElementById('addSlideBtn')?.addEventListener('click', async () => {
    const imageUrl = document.getElementById('slideImageUrl').value.trim();
    if (!imageUrl) {
        showToast("Masukkan URL gambar!");
        return;
    }
    await push(ref(db, 'bizzy_settings/slides'), { imageUrl, createdAt: Date.now() });
    showToast("Slide ditambahkan!");
    document.getElementById('slideImageUrl').value = '';
});

// ==================== USERS ====================
function loadUsers() {
    onValue(ref(db, 'bizzy_users'), (snapshot) => {
        const users = snapshot.val();
        const container = document.getElementById('usersList');
        
        if (!users) {
            container.innerHTML = '<div style="text-align:center;padding:20px;">Belum ada user</div>';
            return;
        }
        
        const usersArray = Object.entries(users);
        let html = '<div style="overflow-x:auto;">';
        html += '<table style="width:100%; border-collapse:collapse;">';
        html += '<tr style="border-bottom:1px solid rgba(30,136,229,0.3);"><th style="padding:10px; text-align:left;">Username</th><th style="padding:10px; text-align:left;">User ID</th><th style="padding:10px; text-align:left;">Bergabung</th><th style="padding:10px; text-align:left;">Telegram</th></tr>';
        
        for (const [id, user] of usersArray) {
            html += `
                <tr style="border-bottom:1px solid rgba(0,0,0,0.05);">
                    <td style="padding:10px;">${escapeHtml(user.username)}</td>
                    <td style="padding:10px;"><code>${id.substring(0, 12)}...</code></td>
                    <td style="padding:10px;">${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style="padding:10px;">${user.telegramId ? '<i class="fas fa-check-circle" style="color:#28a745;"></i> Terhubung' : '<i class="fas fa-times-circle" style="color:#dc3545;"></i> Belum'}</td>
                </tr>
            `;
        }
        html += '</table></div>';
        container.innerHTML = html;
    });
}

// ==================== INIT ====================
async function init() {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;
    
    await loadTheme();
    await loadBotConfig();
    await loadLoadingVideoUrl();
    initTabs();
    loadOrders();
    loadSchedule();
    loadVideoUrl();
    loadSliders();
    loadUsers();
    loadOwners();
    loadCategories();
    loadProducts();
    updateStats();
}

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.getElementById(`tab-${btn.getAttribute('data-tab')}`).classList.add('active');
        });
    });
}

window.openBot = openBot;
window.removeOwner = removeOwner;
window.deleteCategory = deleteCategory;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.deleteSlide = deleteSlide;

init();