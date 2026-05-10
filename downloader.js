// ========== DOWNLOADER MP3/MP4/IMAGE - BIZZY ==========

let currentPlatform = 'tiktok';
let currentType = 'video';
let isLoading = false;

// API Endpoints
const API_URLS = {
    tiktok: 'https://api-faa.my.id/faa/tiktok',
    youtube: 'https://api-faa.my.id/faa/aio',
    instagram: 'https://api-faa.my.id/faa/aio',
    facebook: 'https://api-faa.my.id/faa/aio',
    twitter: 'https://api-faa.my.id/faa/aio',
    pinterest: 'https://api-faa.my.id/faa/aio'
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

// ========== TIKTOK PROCESSOR (Support Image) ==========
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
        downloadUrl = result.data || result.alternatives?.selected || result.alternatives?.sd;
        filename = `${result.title || 'video'}_${Date.now()}.mp4`;
    } else if (currentType === 'audio') {
        downloadUrl = result.music_info?.url;
        filename = `${result.music_info?.title || 'audio'}_${Date.now()}.mp3`;
    } else {
        // MODE GAMBAR - ambil thumbnail/cover
        downloadUrl = result.cover || result.author?.avatar || result.thumbnail;
        filename = `${result.title || 'image'}_${Date.now()}.jpg`;
    }
    
    if (!downloadUrl) {
        throw new Error('URL tidak ditemukan');
    }
    
    return {
        title: result.title || result.music_info?.title || 'TikTok Media',
        author: result.author?.nickname || result.author?.username || 'Unknown',
        thumbnail: result.cover || result.author?.avatar,
        duration: result.duration,
        downloadUrl: downloadUrl,
        filename: filename,
        stats: result.stats,
        type: currentType
    };
}

// ========== INSTAGRAM PROCESSOR (Support Image) ==========
async function processInstagram(url) {
    const response = await fetch(`${API_URLS.instagram}?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (!data.status || !data.result) {
        throw new Error('Gagal memproses link Instagram');
    }
    
    const result = data.result;
    let downloadUrl = '';
    let filename = '';
    let imageUrls = [];
    
    if (currentType === 'video') {
        downloadUrl = result.video_url || result.download_url;
        filename = `${result.title || 'video'}_${Date.now()}.mp4`;
    } else if (currentType === 'audio') {
        downloadUrl = result.audio_url || result.music_url;
        filename = `${result.title || 'audio'}_${Date.now()}.mp3`;
    } else {
        // MODE GAMBAR - ambil gambar dari Instagram (carousel support)
        if (result.images && result.images.length > 0) {
            imageUrls = result.images;
            downloadUrl = imageUrls[0];
        } else if (result.image_url) {
            downloadUrl = result.image_url;
        } else if (result.thumbnail) {
            downloadUrl = result.thumbnail;
        }
        filename = `instagram_${Date.now()}.jpg`;
    }
    
    if (!downloadUrl && imageUrls.length === 0) {
        throw new Error('URL tidak ditemukan');
    }
    
    return {
        title: result.title || 'Instagram Media',
        author: result.author?.username || result.owner || 'Unknown',
        thumbnail: result.thumbnail || result.image_url,
        downloadUrl: downloadUrl,
        filename: filename,
        imageUrls: imageUrls,
        type: currentType,
        isCarousel: imageUrls.length > 1
    };
}

// ========== OTHER PLATFORM PROCESSOR ==========
async function processOtherPlatform(url) {
    const response = await fetch(`${API_URLS.youtube}?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (!data.status || !data.result) {
        throw new Error('Gagal memproses link');
    }
    
    const result = data.result;
    let downloadUrl = '';
    let filename = '';
    let imageUrls = [];
    
    if (currentType === 'video') {
        if (result.download_url) {
            downloadUrl = result.download_url;
        } else if (result.alternative_urls && result.alternative_urls.length > 0) {
            downloadUrl = result.alternative_urls[0];
        }
        filename = `${result.title || 'video'}_${Date.now()}.mp4`;
    } else if (currentType === 'audio') {
        if (result.music_info?.url) {
            downloadUrl = result.music_info.url;
        } else if (result.download_url && result.title) {
            downloadUrl = result.download_url;
        }
        filename = `${result.title || 'audio'}_${Date.now()}.mp3`;
    } else {
        // MODE GAMBAR
        if (result.images && result.images.length > 0) {
            imageUrls = result.images;
            downloadUrl = imageUrls[0];
        } else if (result.image_url) {
            downloadUrl = result.image_url;
        } else if (result.thumbnail) {
            downloadUrl = result.thumbnail;
        }
        filename = `image_${Date.now()}.jpg`;
    }
    
    if (!downloadUrl && imageUrls.length === 0) {
        throw new Error('URL tidak ditemukan');
    }
    
    return {
        title: result.title || 'Media',
        author: result.author?.username || result.creator || 'Unknown',
        thumbnail: result.thumbnail || 'https://via.placeholder.com/100x100?text=📷',
        duration: result.duration,
        downloadUrl: downloadUrl,
        filename: filename,
        imageUrls: imageUrls,
        type: currentType,
        isCarousel: imageUrls.length > 1
    };
}

// ========== MAIN PROCESS ==========
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
        } else if (currentPlatform === 'instagram') {
            result = await processInstagram(url);
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

// ========== SHOW RESULT (Support Image & Carousel) ==========
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
    
    let typeIcon = '';
    let typeText = '';
    
    if (currentType === 'video') {
        typeIcon = 'fa-video';
        typeText = 'Download Video (MP4)';
    } else if (currentType === 'audio') {
        typeIcon = 'fa-music';
        typeText = 'Download Audio (MP3)';
    } else {
        typeIcon = 'fa-image';
        typeText = 'Download Gambar (JPG/PNG)';
    }
    
    // Untuk carousel (multiple images)
    let carouselHtml = '';
    if (data.isCarousel && data.imageUrls && data.imageUrls.length > 1) {
        carouselHtml = `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,215,0,0.2);">
                <p style="font-size: 0.7rem; margin-bottom: 10px;"><i class="fas fa-images"></i> ${data.imageUrls.length} Gambar ditemukan:</p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${data.imageUrls.map((imgUrl, idx) => `
                        <button class="dl-btn" onclick="downloadMedia('${imgUrl}', 'image_${idx+1}_${Date.now()}.jpg')">
                            <i class="fas fa-image"></i> Gambar ${idx+1}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
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
            ${!data.isCarousel ? `
                <button class="dl-btn dl-btn-primary" onclick="downloadMedia('${data.downloadUrl}', '${data.filename}')">
                    <i class="fas ${typeIcon}"></i> ${typeText}
                </button>
            ` : ''}
            <button class="dl-btn" onclick="window.open('${data.downloadUrl}', '_blank')">
                <i class="fas fa-external-link-alt"></i> Buka di Browser
            </button>
            <button class="dl-btn" onclick="copyToClipboard('${data.downloadUrl}')">
                <i class="fas fa-copy"></i> Copy URL
            </button>
        </div>
        ${carouselHtml}
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
            console.log(`Platform changed to: ${currentPlatform}`);
        });
    });
    
    // Type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.getAttribute('data-type');
            console.log(`Type changed to: ${currentType}`);
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

// Expose functions to global
window.downloadMedia = downloadMedia;
window.copyToClipboard = copyToClipboard;
window.goBack = goBack;