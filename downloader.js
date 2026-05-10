// ========== DOWNLOADER MP3/MP4 - BIZZY ==========

let currentPlatform = 'tiktok';
let currentType = 'video';
let isLoading = false;

// API Endpoints
const API_URLS = {
    tiktok: 'https://api-faa.my.id/faa/tiktok',
    youtube: 'https://api-faa.my.id/faa/aio',
    instagram: 'https://api-faa.my.id/faa/aio',
    facebook: 'https://api-faa.my.id/faa/aio',
    twitter: 'https://api-faa.my.id/faa/aio'
};

// Load theme from localStorage
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

function showToast(msg, type = 'info') {
    let existing = document.querySelector('.toast');
    if (existing) existing.remove();
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showLoading(show) {
    const loader = document.getElementById('loadingOverlay');
    if (show) loader.classList.add('show');
    else loader.classList.remove('show');
}

function formatBytes(bytes) {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    if (typeof seconds === 'string') return seconds;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

async function downloadMedia(url, filename) {
    try {
        showToast('Memulai download...', 'info');
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        showToast('Download selesai!', 'success');
    } catch (err) {
        showToast('Gagal download: ' + err.message, 'error');
        window.open(url, '_blank');
    }
}

async function processTikTok(url) {
    const response = await fetch(`${API_URLS.tiktok}?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (!data.status || !data.result) {
        throw new Error('Gagal memproses link TikTok');
    }
    
    const result = data.result;
    let downloadUrl = '';
    let filename = '';
    
    if (currentType === 'video') {
        // Ambil video tanpa watermark
        downloadUrl = result.data || result.alternatives?.selected || result.alternatives?.sd;
        filename = `${result.title || 'video'}_${Date.now()}.mp4`;
    } else {
        // Ambil audio/music
        downloadUrl = result.music_info?.url;
        filename = `${result.music_info?.title || 'audio'}_${Date.now()}.mp3`;
    }
    
    if (!downloadUrl) {
        throw new Error('URL download tidak ditemukan');
    }
    
    return {
        title: result.title || result.music_info?.title || 'TikTok Video',
        author: result.author?.nickname || result.author?.username || 'Unknown',
        thumbnail: result.cover || result.author?.avatar,
        duration: result.duration,
        downloadUrl: downloadUrl,
        filename: filename,
        stats: result.stats,
        type: currentType
    };
}

async function processOtherPlatform(url) {
    const response = await fetch(`${API_URLS.youtube}?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (!data.status || !data.result) {
        throw new Error('Gagal memproses link');
    }
    
    const result = data.result;
    let downloadUrl = '';
    let filename = '';
    
    if (currentType === 'video') {
        // Cari video dengan kualitas terbaik
        if (result.download_url) {
            downloadUrl = result.download_url;
        } else if (result.alternative_urls && result.alternative_urls.length > 0) {
            downloadUrl = result.alternative_urls[0];
        }
        filename = `${result.title || 'video'}_${Date.now()}.mp4`;
    } else {
        // Cari audio
        if (result.music_info?.url) {
            downloadUrl = result.music_info.url;
        } else if (result.download_url && result.title) {
            downloadUrl = result.download_url;
        }
        filename = `${result.title || 'audio'}_${Date.now()}.mp3`;
    }
    
    if (!downloadUrl) {
        throw new Error('URL download tidak ditemukan');
    }
    
    return {
        title: result.title || 'Media',
        author: result.author?.username || result.creator || 'Unknown',
        thumbnail: result.thumbnail || 'https://via.placeholder.com/100x100?text=🎵',
        duration: result.duration,
        downloadUrl: downloadUrl,
        filename: filename,
        type: currentType
    };
}

async function processDownload() {
    if (isLoading) {
        showToast('Tunggu proses sebelumnya selesai');
        return;
    }
    
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('Masukkan link terlebih dahulu!');
        return;
    }
    
    isLoading = true;
    showLoading(true);
    
    try {
        let result;
        
        if (currentPlatform === 'tiktok') {
            result = await processTikTok(url);
        } else {
            result = await processOtherPlatform(url);
        }
        
        showResult(result);
        
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Gagal memproses link', 'error');
        document.getElementById('resultArea').style.display = 'none';
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

function showResult(data) {
    const resultArea = document.getElementById('resultArea');
    
    let statsHtml = '';
    if (data.stats) {
        statsHtml = `
            <div class="stats-grid">
                ${data.stats.views ? `<div class="stat-item"><i class="fas fa-eye"></i> ${data.stats.views}</div>` : ''}
                ${data.stats.likes ? `<div class="stat-item"><i class="fas fa-heart"></i> ${data.stats.likes}</div>` : ''}
                ${data.stats.comment ? `<div class="stat-item"><i class="fas fa-comment"></i> ${data.stats.comment}</div>` : ''}
                ${data.stats.share ? `<div class="stat-item"><i class="fas fa-share"></i> ${data.stats.share}</div>` : ''}
            </div>
        `;
    }
    
    const typeIcon = currentType === 'video' ? 'fa-video' : 'fa-music';
    const typeText = currentType === 'video' ? 'Download Video (MP4)' : 'Download Audio (MP3)';
    
    resultArea.innerHTML = `
        <div class="result-header">
            ${data.thumbnail ? `<img src="${data.thumbnail}" class="result-thumbnail" onerror="this.src='https://via.placeholder.com/100x100?text=🎵'">` : ''}
            <div class="result-info">
                <div class="result-title">${escapeHtml(data.title.substring(0, 100))}${data.title.length > 100 ? '...' : ''}</div>
                <div class="result-author">
                    <i class="fas fa-user"></i> ${escapeHtml(data.author)}
                    ${data.duration ? `<span class="result-duration"><i class="fas fa-clock"></i> ${data.duration}</span>` : ''}
                </div>
                ${statsHtml}
            </div>
        </div>
        <div class="download-buttons">
            <button class="dl-btn dl-btn-primary" onclick="downloadMedia('${data.downloadUrl}', '${data.filename}')">
                <i class="fas ${typeIcon}"></i> ${typeText}
            </button>
            <button class="dl-btn" onclick="window.open('${data.downloadUrl}', '_blank')">
                <i class="fas fa-external-link-alt"></i> Buka di Browser
            </button>
            <button class="dl-btn" onclick="copyToClipboard('${data.downloadUrl}')">
                <i class="fas fa-copy"></i> Copy URL
            </button>
        </div>
    `;
    
    resultArea.style.display = 'block';
    resultArea.scrollIntoView({ behavior: 'smooth' });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('URL berhasil disalin!', 'success');
    }).catch(() => {
        showToast('Gagal menyalin URL');
    });
}

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

// Initialize event listeners
function init() {
    loadTheme();
    
    // Platform buttons
    document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPlatform = btn.getAttribute('data-platform');
        });
    });
    
    // Type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.getAttribute('data-type');
        });
    });
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', processDownload);
    
    // Enter key
    document.getElementById('urlInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processDownload();
    });
    
    console.log('🎵 Downloader siap! Platform:', currentPlatform, 'Type:', currentType);
}

document.addEventListener('DOMContentLoaded', init);