// ========== MAKER ZONE PAGE SCRIPT - LENGKAP ==========

// Menu definitions with query fields (LENGKAP)

// 1. DOKUMEN & KTP
const documentMenus = [
    { 
        name: "Fake KTP", desc: "Buat KTP palsu", icon: "fa-id-card", cmd: "ektp", 
        api: "https://api.skylow.web.id/api/maker/ektp",
        fields: [
            { name: "nik", label: "Nomor NIK", type: "text", required: true, placeholder: "16 digit NIK" },
            { name: "nama", label: "Nama Lengkap", type: "text", required: true, placeholder: "Nama sesuai KTP" },
            { name: "pas_photo", label: "URL Foto Pas", type: "url", required: true, placeholder: "https://example.com/foto.jpg" },
            { name: "provinsi", label: "Provinsi", type: "text", required: true, placeholder: "Jawa Barat" },
            { name: "kota", label: "Kota/Kabupaten", type: "text", required: true, placeholder: "Bandung" },
            { name: "ttl", label: "Tempat, Tanggal Lahir", type: "text", required: true, placeholder: "Bandung, 01-01-1990" },
            { name: "jenis_kelamin", label: "Jenis Kelamin", type: "select", required: true, options: ["Laki-laki", "Perempuan"] },
            { name: "golongan_darah", label: "Golongan Darah", type: "select", required: true, options: ["A", "B", "AB", "O"] },
            { name: "alamat", label: "Alamat", type: "textarea", required: true, placeholder: "Jl. Contoh No. 123" },
            { name: "rt/rw", label: "RT/RW", type: "text", required: true, placeholder: "001/002" },
            { name: "kel/desa", label: "Kelurahan/Desa", type: "text", required: true, placeholder: "Kelurahan Contoh" },
            { name: "kecamatan", label: "Kecamatan", type: "text", required: true, placeholder: "Kecamatan Contoh" },
            { name: "agama", label: "Agama", type: "select", required: true, options: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"] },
            { name: "status", label: "Status Perkawinan", type: "select", required: true, options: ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"] },
            { name: "pekerjaan", label: "Pekerjaan", type: "text", required: true, placeholder: "Karyawan Swasta" },
            { name: "kewarganegaraan", label: "Kewarganegaraan", type: "text", required: true, placeholder: "WNI" },
            { name: "masa_berlaku", label: "Masa Berlaku", type: "text", required: true, placeholder: "Seumur Hidup" },
            { name: "terbuat", label: "Tanggal Pembuatan", type: "text", required: true, placeholder: "01-01-2024" }
        ]
    }
];

// 2. FAKE SOSIAL MEDIA
const socialMenus = [
    {
        name: "Fake Group", desc: "Buat screenshot grup WA", icon: "fa-users", cmd: "fakegroup",
        api: "https://api.skylow.web.id/api/maker/fakegroup",
        fields: [
            { name: "image", label: "URL Gambar Profil Grup", type: "url", required: true, placeholder: "https://example.com/group.jpg" },
            { name: "name", label: "Nama Grup", type: "text", required: true, placeholder: "Nama grup Anda" },
            { name: "members", label: "Jumlah Anggota", type: "text", required: true, placeholder: "100" },
            { name: "desc", label: "Deskripsi Grup", type: "textarea", required: false, placeholder: "Deskripsi grup..." },
            { name: "date", label: "Tanggal Dibuat", type: "text", required: false, placeholder: "01 Januari 2024" }
        ]
    },
    {
        name: "Fake Channel", desc: "Buat screenshot channel YouTube", icon: "fa-tv", cmd: "fakech2",
        api: "https://api.skylow.web.id/api/maker/fakech2",
        fields: [
            { name: "image", label: "URL Gambar Profil Channel", type: "url", required: true, placeholder: "https://example.com/channel.jpg" },
            { name: "name", label: "Nama Channel", type: "text", required: true, placeholder: "Nama channel Anda" },
            { name: "followers", label: "Jumlah Pengikut", type: "text", required: true, placeholder: "1000000" },
            { name: "desc", label: "Deskripsi Channel", type: "textarea", required: false, placeholder: "Deskripsi channel..." },
            { name: "date", label: "Tanggal Dibuat", type: "text", required: false, placeholder: "01 Januari 2020" },
            { name: "reach", label: "Akun Dijangkau", type: "text", required: false, placeholder: "10M" },
            { name: "clean", label: "Pengikut Bersih", type: "text", required: false, placeholder: "5M" }
        ]
    },
    {
        name: "Fake DANA", desc: "Buat screenshot saldo DANA", icon: "fa-money-bill", cmd: "fakedana",
        api: "https://api.skylow.web.id/api/maker/fakedana",
        fields: [
            { name: "text", label: "Nominal Saldo", type: "text", required: true, placeholder: "10000000" }
        ]
    },
    {
        name: "Afinitas ML", desc: "Buat kartu afinitas ML", icon: "fa-gamepad", cmd: "afinitasml",
        api: "https://api.skylow.web.id/api/maker/afinitasml",
        fields: [
            { name: "image", label: "URL Gambar Profil", type: "url", required: true, placeholder: "https://example.com/profil.jpg" },
            { name: "bg", label: "Nomor Background (1-6)", type: "select", required: true, options: ["1", "2", "3", "4", "5", "6"] }
        ]
    },
    {
        name: "Gura Template", desc: "Template gambar Gura", icon: "fa-fish", cmd: "gura",
        api: "https://api.skylow.web.id/api/maker/gura",
        fields: [
            { name: "image", label: "URL Gambar", type: "url", required: true, placeholder: "https://example.com/gambar.jpg" }
        ]
    }
];

// 3. BRAT STYLE GENERATOR (LENGKAP 19 MENU)
const bratMenus = [
    { name: "Brat Menhera", desc: "Style Menhera", icon: "fa-crown", cmd: "bratmenhera", api: "https://api.skylow.web.id/api/maker/bratmenhera", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Naruto", desc: "Style Naruto", icon: "fa-user-ninja", cmd: "bratnaruto", api: "https://api.skylow.web.id/api/maker/bratnaruto", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Doraemon", desc: "Style Doraemon", icon: "fa-robot", cmd: "bratdoraemon", api: "https://api.skylow.web.id/api/maker/bratdoraemon", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Mafia", desc: "Style Mafia", icon: "fa-user-secret", cmd: "bratmafia", api: "https://api.skylow.web.id/api/maker/bratmafia", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Itachi", desc: "Style Itachi", icon: "fa-eye", cmd: "bratitachi", api: "https://api.skylow.web.id/api/maker/bratitachi", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Upin", desc: "Style Upin", icon: "fa-child", cmd: "bratupin", api: "https://api.skylow.web.id/api/maker/bratupin", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Anime", desc: "Style Anime", icon: "fa-tv", cmd: "bratanime", api: "https://api.skylow.web.id/api/maker/bratanime", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Nezuko", desc: "Style Nezuko", icon: "fa-mask", cmd: "bratnezuko", api: "https://api.skylow.web.id/api/maker/bratnezuko", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Patrick", desc: "Style Patrick", icon: "fa-star", cmd: "bratpatrick", api: "https://api.skylow.web.id/api/maker/bratpatrick", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Qiqi", desc: "Style Qiqi", icon: "fa-heart", cmd: "bratqiqi", api: "https://api.skylow.web.id/api/maker/bratqiqi", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Ruromiya", desc: "Style Ruromiya", icon: "fa-cat", cmd: "bratruromiya", api: "https://api.skylow.web.id/api/maker/bratruromiya", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Squidward", desc: "Style Squidward", icon: "fa-music", cmd: "bratsquidward", api: "https://api.skylow.web.id/api/maker/bratsquidward", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Anime 2", desc: "Style Anime 2", icon: "fa-dragon", cmd: "bratanime2", api: "https://api.skylow.web.id/api/maker/bratanime2", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Anime 3", desc: "Style Anime 3", icon: "fa-feather", cmd: "bratanime3", api: "https://api.skylow.web.id/api/maker/bratanime3", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Bahlil", desc: "Style Bahlil", icon: "fa-user-tie", cmd: "bratbahlil", api: "https://api.skylow.web.id/api/maker/bratbahlil", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Cewe 2", desc: "Style Cewe", icon: "fa-female", cmd: "bratcewe2", api: "https://api.skylow.web.id/api/maker/bratcewe2", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Gura", desc: "Style Gura", icon: "fa-fish", cmd: "bratgura", api: "https://api.skylow.web.id/api/maker/bratgura", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Chika", desc: "Style Chika", icon: "fa-smile", cmd: "bratchika", api: "https://api.skylow.web.id/api/maker/bratchika", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] },
    { name: "Brat Kobato", desc: "Style Kobato", icon: "fa-dove", cmd: "bratkobato", api: "https://api.skylow.web.id/api/maker/bratkobato", fields: [{ name: "text", label: "Teks", type: "text", required: true, placeholder: "Masukkan teks..." }] }
];

// 4. GAMING
const gamingMenus = [
    {
        name: "Fake FF Card", desc: "Buat kartu FF", icon: "fa-gamepad", cmd: "fakeff",
        api: "https://api.skylow.web.id/api/maker/fakeff",
        fields: [
            { name: "text", label: "Nama Pemain", type: "text", required: true, placeholder: "Username FF" },
            { name: "bg", label: "Background", type: "text", required: true, placeholder: "1-10" }
        ]
    },
    {
        name: "Profile FF", desc: "Buat profil FF", icon: "fa-id-card", cmd: "profileff",
        api: "https://api.skylow.web.id/api/maker/profileff",
        fields: [
            { name: "nickname", label: "Nickname", type: "text", required: true, placeholder: "Nickname FF" },
            { name: "guild", label: "Guild", type: "text", required: true, placeholder: "Nama Guild" },
            { name: "bg", label: "Background (1-10)", type: "text", required: true, placeholder: "1" }
        ]
    },
    {
        name: "Fake Dev Card", desc: "Buat kartu developer", icon: "fa-code", cmd: "fakedev",
        api: "https://api.skylow.web.id/api/maker/fakedev",
        fields: [
            { name: "text", label: "Nama Developer", type: "text", required: true, placeholder: "Nama developer" },
            { name: "image", label: "URL Gambar", type: "url", required: true, placeholder: "https://example.com/foto.jpg" },
            { name: "verified", label: "Verified", type: "select", required: true, options: ["true", "false"] }
        ]
    }
];

let currentMenu = null;

// Load theme
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

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
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

function showLoading(show) {
    let loader = document.getElementById('loadingOverlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.className = 'loading-overlay';
        loader.innerHTML = '<div class="spinner"></div><p>Memproses...</p>';
        document.body.appendChild(loader);
    }
    if (show) loader.classList.add('show');
    else loader.classList.remove('show');
}

function renderMenus() {
    renderGrid('documentGrid', documentMenus);
    renderGrid('socialGrid', socialMenus);
    renderGrid('bratGrid', bratMenus);
    renderGrid('gamingGrid', gamingMenus);
    
    console.log(`✅ Maker Zone loaded: ${documentMenus.length + socialMenus.length + bratMenus.length + gamingMenus.length} tools available`);
}

function renderGrid(containerId, menus) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = menus.map((menu, idx) => `
        <div class="menu-card" data-cmd="${menu.cmd}" style="animation-delay: ${0.02 * idx}s">
            <i class="fas ${menu.icon}"></i>
            <div class="menu-name">${escapeHtml(menu.name)}</div>
            <div class="menu-desc">${escapeHtml(menu.desc)}</div>
            <div class="query-badge"><i class="fas fa-keyboard"></i> ${menu.fields.length} Input</div>
        </div>
    `).join('');
    
    document.querySelectorAll(`#${containerId} .menu-card`).forEach((card, idx) => {
        card.onclick = () => openMenuByData(menus[idx]);
    });
}

function openMenuByData(menu) {
    currentMenu = menu;
    showQueryModal(menu);
}

function showQueryModal(menu) {
    const modal = document.getElementById('queryModal');
    const modalTitle = document.getElementById('modalTitle');
    const queryFields = document.getElementById('queryFields');
    
    modalTitle.innerText = `${menu.name} - Masukkan Data`;
    
    queryFields.innerHTML = menu.fields.map(field => `
        <div class="query-field">
            <label>${escapeHtml(field.label)} ${field.required ? '*' : ''}</label>
            ${field.type === 'textarea' ? 
                `<textarea id="field_${field.name}" placeholder="${escapeHtml(field.placeholder || '')}" ${field.required ? 'required' : ''}></textarea>` :
            field.type === 'select' ?
                `<select id="field_${field.name}" ${field.required ? 'required' : ''}>
                    ${field.options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
                </select>` :
                `<input type="${field.type}" id="field_${field.name}" placeholder="${escapeHtml(field.placeholder || '')}" ${field.required ? 'required' : ''}>`
            }
            <small>${field.placeholder || ''}</small>
        </div>
    `).join('');
    
    modal.style.display = 'flex';
    
    const submitBtn = document.getElementById('submitQueryBtn');
    submitBtn.onclick = () => {
        const params = {};
        let isValid = true;
        
        for (const field of menu.fields) {
            const value = document.getElementById(`field_${field.name}`).value.trim();
            if (field.required && !value) {
                showToast(`Mohon isi ${field.label}`);
                isValid = false;
                break;
            }
            if (value) {
                params[field.name] = encodeURIComponent(value);
            }
        }
        
        if (isValid) {
            closeQueryModal();
            executeMakerApi(menu, params);
        }
    };
}

function closeQueryModal() {
    document.getElementById('queryModal').style.display = 'none';
}

async function executeMakerApi(menu, params) {
    showLoading(true);
    
    let url = `${menu.api}?${Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')}`;
    
    try {
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('image')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            showResult('image', blobUrl, menu.name);
        } else if (contentType && contentType.includes('video')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            showResult('video', blobUrl, menu.name);
        } else {
            const text = await response.text();
            if (text.startsWith('{') || text.startsWith('[')) {
                try {
                    const json = JSON.parse(text);
                    showResult('json', json, menu.name);
                } catch {
                    showResult('text', text, menu.name);
                }
            } else {
                showResult('text', text, menu.name);
            }
        }
    } catch (error) {
        showToast(`Error: ${error.message}`);
        showResult('error', error.message, menu.name);
    } finally {
        showLoading(false);
    }
}

function showResult(type, data, title) {
    const resultArea = document.getElementById('resultArea');
    resultArea.style.display = 'block';
    
    let html = `<h3 style="margin-bottom: 12px;"><i class="fas fa-${type === 'image' ? 'image' : 'file-alt'}"></i> ${escapeHtml(title)}</h3>`;
    
    if (type === 'image') {
        html += `
            <div class="preview-container">
                <img src="${data}" class="result-image" onclick="window.open('${data}', '_blank')">
                <div>
                    <button class="btn-download" onclick="downloadMedia('${data}', 'image')"><i class="fas fa-download"></i> Download Gambar</button>
                    <button class="btn-download" onclick="window.open('${data}', '_blank')"><i class="fas fa-external-link-alt"></i> Buka Baru</button>
                    <button class="btn-download copy-btn" onclick="copyToClipboard('${data}')"><i class="fas fa-copy"></i> Copy URL</button>
                </div>
            </div>
        `;
    } else if (type === 'video') {
        html += `
            <div class="preview-container">
                <video src="${data}" class="result-video" controls></video>
                <div>
                    <button class="btn-download" onclick="downloadMedia('${data}', 'video')"><i class="fas fa-download"></i> Download Video</button>
                    <button class="btn-download" onclick="window.open('${data}', '_blank')"><i class="fas fa-external-link-alt"></i> Buka Baru</button>
                </div>
            </div>
        `;
    } else if (type === 'json') {
        html += `<pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 16px; overflow-x: auto; font-size: 0.7rem;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    } else if (type === 'text') {
        html += `<div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 16px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data)}</div>`;
    } else if (type === 'error') {
        html += `<div style="background: rgba(255,68,68,0.2); padding: 16px; border-radius: 16px; color: #ff6666;">❌ Error: ${escapeHtml(data)}</div>`;
    }
    
    resultArea.innerHTML = html;
    resultArea.scrollIntoView({ behavior: 'smooth' });
}

async function downloadMedia(url, type) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `download_${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        showToast('Download dimulai!');
    } catch (err) {
        showToast('Gagal download: ' + err.message);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('URL berhasil disalin!');
    }).catch(() => {
        showToast('Gagal menyalin');
    });
}

// ========== GO BACK - SIMPAN STATE MUSIC SEBELUM PINDAH ==========
function goBack() {
    if (window.GlobalMusic && window.GlobalMusic.saveState) {
        window.GlobalMusic.saveState();
    }
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease';
    setTimeout(() => {
        window.location.href = 'tools.html';
    }, 200);
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupScrollToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderMenus();
    setupScrollToTop();
    console.log('🔧 Maker Zone siap!');
});

window.goBack = goBack;
window.scrollToTop = scrollToTop;