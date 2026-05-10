// ========== ANIME ZONE PAGE SCRIPT - LENGKAP ==========

const searchMenus = [
    { name: "Anime Search", desc: "Cari anime berdasarkan judul", icon: "fa-search", cmd: "animesearch", needQuery: true, queryFields: [{ name: "q", label: "Judul Anime", type: "text", required: true, placeholder: "Masukkan judul anime..." }], api: "https://api.skylow.web.id/api/anime/animesearch" },
    { name: "AniDB Search", desc: "Cari anime di AniDB", icon: "fa-database", cmd: "anidb", needQuery: true, queryFields: [{ name: "q", label: "Kata Kunci", type: "text", required: true, placeholder: "Masukkan kata kunci..." }], api: "https://api.skylow.web.id/api/anime/anidb" }
];

const imageMenus = [
    { name: "Avatar", desc: "Random avatar anime", icon: "fa-user-circle", cmd: "avatar", needQuery: false, api: "https://api.skylow.web.id/api/anime/avatar", responseType: "image" },
    { name: "Chitoge", desc: "Random Chitoge", icon: "fa-female", cmd: "chitoge", needQuery: false, api: "https://api.skylow.web.id/api/anime/chitoge", responseType: "image" },
    { name: "Cuddle", desc: "Random cuddle", icon: "fa-heart", cmd: "cuddle", needQuery: false, api: "https://api.skylow.web.id/api/anime/cuddle", responseType: "image" },
    { name: "Deidara", desc: "Random Deidara", icon: "fa-mask", cmd: "deidara", needQuery: false, api: "https://api.skylow.web.id/api/anime/deidara", responseType: "image" },
    { name: "Erza", desc: "Random Erza", icon: "fa-crown", cmd: "erza", needQuery: false, api: "https://api.skylow.web.id/api/anime/erza", responseType: "image" },
    { name: "Feed", desc: "Random feed", icon: "fa-image", cmd: "feed", needQuery: false, api: "https://api.skylow.web.id/api/anime/feed", responseType: "image" },
    { name: "Fox Girl", desc: "Random fox girl", icon: "fa-fox", cmd: "fox_girl", needQuery: false, api: "https://api.skylow.web.id/api/anime/fox_girl", responseType: "image" },
    { name: "Gecg", desc: "Random gecg", icon: "fa-smile", cmd: "gecg", needQuery: false, api: "https://api.skylow.web.id/api/anime/gecg", responseType: "image" },
    { name: "Gremory", desc: "Random Gremory", icon: "fa-demon", cmd: "gremory", needQuery: false, api: "https://api.skylow.web.id/api/anime/gremory", responseType: "image" },
    { name: "Hestia", desc: "Random Hestia", icon: "fa-goddess", cmd: "hestia", needQuery: false, api: "https://api.skylow.web.id/api/anime/hestia", responseType: "image" },
    { name: "Hinata", desc: "Random Hinata", icon: "fa-user-ninja", cmd: "hinata", needQuery: false, api: "https://api.skylow.web.id/api/anime/hinata", responseType: "image" },
    { name: "Hitorigottoh", desc: "Random Hitorigottoh", icon: "fa-music", cmd: "hitorigottoh", needQuery: false, api: "https://api.skylow.web.id/api/anime/hitorigottoh", responseType: "image" },
    { name: "Hug", desc: "Random hug", icon: "fa-hand-peace", cmd: "hug", needQuery: false, api: "https://api.skylow.web.id/api/anime/hug", responseType: "image" },
    { name: "Inori", desc: "Random Inori", icon: "fa-star", cmd: "inori", needQuery: false, api: "https://api.skylow.web.id/api/anime/inori", responseType: "image" },
    { name: "Isuzu", desc: "Random Isuzu", icon: "fa-car", cmd: "isuzu", needQuery: false, api: "https://api.skylow.web.id/api/anime/isuzu", responseType: "image" },
    { name: "Itachi", desc: "Random Itachi", icon: "fa-eye", cmd: "itachi", needQuery: false, api: "https://api.skylow.web.id/api/anime/itachi", responseType: "image" },
    { name: "Itori", desc: "Random Itori", icon: "fa-book", cmd: "itori", needQuery: false, api: "https://api.skylow.web.id/api/anime/itori", responseType: "image" },
    { name: "Kagura", desc: "Random Kagura", icon: "fa-umbrella", cmd: "kagura", needQuery: false, api: "https://api.skylow.web.id/api/anime/kagura", responseType: "image" },
    { name: "Kiss", desc: "Random kiss", icon: "fa-kiss", cmd: "kiss", needQuery: false, api: "https://api.skylow.web.id/api/anime/kiss", responseType: "image" },
    { name: "Madara", desc: "Random Madara", icon: "fa-mask", cmd: "madara", needQuery: false, api: "https://api.skylow.web.id/api/anime/madara", responseType: "image" },
    { name: "Mikasa", desc: "Random Mikasa", icon: "fa-fighter-jet", cmd: "mikasa", needQuery: false, api: "https://api.skylow.web.id/api/anime/mikasa", responseType: "image" },
    { name: "Minato", desc: "Random Minato", icon: "fa-bolt", cmd: "minato", needQuery: false, api: "https://api.skylow.web.id/api/anime/minato", responseType: "image" },
    { name: "Naruto", desc: "Random Naruto", icon: "fa-user-ninja", cmd: "naruto", needQuery: false, api: "https://api.skylow.web.id/api/anime/naruto", responseType: "image" },
    { name: "Neko Anime", desc: "Random neko", icon: "fa-cat", cmd: "nekoanime", needQuery: false, api: "https://api.skylow.web.id/api/anime/nekoanime", responseType: "image" },
    { name: "Natsukawa", desc: "Random Natsukawa", icon: "fa-leaf", cmd: "natsukawa", needQuery: false, api: "https://api.skylow.web.id/api/anime/natsukawa", responseType: "image" },
    { name: "Nezuko", desc: "Random Nezuko", icon: "fa-mask", cmd: "nezuko", needQuery: false, api: "https://api.skylow.web.id/api/anime/nezuko", responseType: "image" },
    { name: "Nishimiya", desc: "Random Nishimiya", icon: "fa-deaf", cmd: "nishimiya", needQuery: false, api: "https://api.skylow.web.id/api/anime/nishimiya", responseType: "image" },
    { name: "One Piece", desc: "Random One Piece", icon: "fa-ship", cmd: "onepiece", needQuery: false, api: "https://api.skylow.web.id/api/anime/onepiece", responseType: "image" },
    { name: "Yuki", desc: "Random Yuki", icon: "fa-snowflake", cmd: "yuki", needQuery: false, api: "https://api.skylow.web.id/api/anime/yuki", responseType: "image" }
];

const infoMenus = [
    { name: "Anime Info", desc: "Info detail anime", icon: "fa-info-circle", cmd: "animeinfo", needQuery: true, queryFields: [{ name: "q", label: "Judul Anime", type: "text", required: true, placeholder: "Masukkan judul anime..." }], api: "https://api.skylow.web.id/api/anime/animeinfo", responseType: "json" },
    { name: "Animestory WA", desc: "Cerita anime untuk WA", icon: "fa-whatsapp", cmd: "animestorywa", needQuery: false, api: "https://api.skylow.web.id/api/anime/animestorywa", responseType: "text" }
];

let currentMenu = null;

function loadTheme() {
    const savedTheme = localStorage.getItem('bizzy_theme_mode');
    if (savedTheme === 'dark') { document.body.classList.add('dark'); document.body.classList.remove('light'); }
    else if (savedTheme === 'light') { document.body.classList.add('light'); document.body.classList.remove('dark'); }
    else { document.body.classList.add('dark'); document.body.classList.remove('light'); }
}

function escapeHtml(str) { if (!str) return ''; return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }

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
        loader.innerHTML = '<div class="spinner"></div><p>Memuat data...</p>';
        document.body.appendChild(loader);
    }
    if (show) loader.classList.add('show');
    else loader.classList.remove('show');
}

function renderMenus() {
    renderGrid('searchMenusGrid', searchMenus);
    renderGrid('imageMenusGrid', imageMenus);
    renderGrid('infoMenusGrid', infoMenus);
    console.log(`✅ Anime Zone loaded: ${searchMenus.length} search, ${imageMenus.length} images, ${infoMenus.length} info menus`);
}

function renderGrid(containerId, menus) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = menus.map(menu => `<div class="menu-card" data-cmd="${menu.cmd}"><i class="fas ${menu.icon}"></i><div class="menu-name">${escapeHtml(menu.name)}</div><div class="menu-desc">${escapeHtml(menu.desc)}</div>${menu.needQuery ? '<div class="query-badge"><i class="fas fa-keyboard"></i> Butuh Input</div>' : ''}</div>`).join('');
    document.querySelectorAll(`#${containerId} .menu-card`).forEach((card, idx) => { card.onclick = () => openMenuByData(menus[idx]); });
}

function openMenuByData(menu) { currentMenu = menu; if (menu.needQuery) showQueryModal(menu); else executeApiCall(menu); }

function showQueryModal(menu) {
    const modal = document.getElementById('queryModal');
    const modalTitle = document.getElementById('modalTitle');
    const queryFields = document.getElementById('queryFields');
    modalTitle.innerText = `${menu.name} - Masukkan Data`;
    queryFields.innerHTML = menu.queryFields.map(field => `<div class="query-field"><label>${escapeHtml(field.label)} ${field.required ? '*' : ''}</label>${field.type === 'textarea' ? `<textarea id="field_${field.name}" placeholder="${escapeHtml(field.placeholder || '')}" ${field.required ? 'required' : ''}></textarea>` : `<input type="${field.type}" id="field_${field.name}" placeholder="${escapeHtml(field.placeholder || '')}" ${field.required ? 'required' : ''}>`}</div>`).join('');
    modal.style.display = 'flex';
    const submitBtn = document.getElementById('submitQueryBtn');
    submitBtn.onclick = () => {
        const params = {};
        let isValid = true;
        menu.queryFields.forEach(field => {
            const value = document.getElementById(`field_${field.name}`).value.trim();
            if (field.required && !value) { showToast(`Mohon isi ${field.label}`); isValid = false; }
            params[field.name] = encodeURIComponent(value);
        });
        if (isValid) { closeQueryModal(); executeApiCall(menu, params); }
    };
}

function closeQueryModal() { document.getElementById('queryModal').style.display = 'none'; }

async function executeApiCall(menu, params = {}) {
    showLoading(true);
    let url = menu.api;
    if (Object.keys(params).length > 0) url = `${menu.api}?${Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')}`;
    try {
        const response = await fetch(url);
        if (menu.responseType === 'image') { const blob = await response.blob(); const blobUrl = URL.createObjectURL(blob); showResult('image', blobUrl, menu.name); }
        else if (menu.responseType === 'json' || menu.cmd === 'animeinfo' || menu.cmd === 'animesearch' || menu.cmd === 'anidb') { const data = await response.json(); showResult('json', data, menu.name); }
        else { const text = await response.text(); showResult('text', text, menu.name); }
    } catch (error) { showToast(`Error: ${error.message}`); showResult('error', error.message, menu.name); }
    finally { showLoading(false); }
}

function showResult(type, data, title) {
    const resultArea = document.getElementById('resultArea');
    resultArea.style.display = 'block';
    let html = `<h3 style="margin-bottom: 12px;"><i class="fas fa-${type === 'image' ? 'image' : 'file-alt'}"></i> ${escapeHtml(title)}</h3>`;
    if (type === 'image') {
        html += `<img src="${data}" class="result-image" onclick="window.open('${data}', '_blank')"><div><button class="btn-download" onclick="downloadMedia('${data}', 'image')"><i class="fas fa-download"></i> Download Gambar</button><button class="btn-download" onclick="window.open('${data}', '_blank')"><i class="fas fa-external-link-alt"></i> Buka Baru</button></div>`;
    } else if (type === 'json') {
        if (data.result) {
            if (Array.isArray(data.result)) {
                html += `<div style="max-height: 400px; overflow-y: auto;">`;
                data.result.slice(0, 10).forEach(item => {
                    html += `<div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; margin-bottom: 8px;"><strong>${escapeHtml(item.title || item.name || 'Item')}</strong>${item.image ? `<div><img src="${item.image}" style="max-width: 100px; border-radius: 8px; margin-top: 8px;"></div>` : ''}${item.synopsis ? `<div style="font-size: 0.75rem; margin-top: 4px;">${escapeHtml(item.synopsis.substring(0, 200))}...</div>` : ''}</div>`;
                });
                html += `</div>`;
            } else { html += `<pre style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 16px; overflow-x: auto; font-size: 0.7rem;">${escapeHtml(JSON.stringify(data.result, null, 2))}</pre>`; }
        } else { html += `<pre style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 16px; overflow-x: auto; font-size: 0.7rem;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`; }
    } else if (type === 'text') { html += `<div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 16px; line-height: 1.6;">${escapeHtml(data)}</div>`; }
    else if (type === 'error') { html += `<div style="background: rgba(255,68,68,0.2); padding: 16px; border-radius: 16px; color: #ff6666;">❌ Error: ${escapeHtml(data)}</div>`; }
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
    } catch (err) { showToast('Gagal download: ' + err.message); }
}

// ========== GO BACK - SIMPAN STATE MUSIC SEBELUM PINDAH ==========
function goBack() {
    if (window.GlobalMusic && window.GlobalMusic.saveState) { 
        window.GlobalMusic.saveState(); 
    }
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease';
    setTimeout(() => { window.location.href = 'tools.html'; }, 200);
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function setupScrollToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => { if (window.scrollY > 300) btn.classList.add('visible'); else btn.classList.remove('visible'); });
}

document.addEventListener('DOMContentLoaded', () => { loadTheme(); renderMenus(); setupScrollToTop(); console.log(`📊 Anime Zone siap! Total ${imageMenus.length} menu gambar anime tersedia`); });

window.goBack = goBack;
window.scrollToTop = scrollToTop;