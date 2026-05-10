// ========== MUSIC PAGE SCRIPT ==========

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

// Global variables
let playHistory = [];

// DOM Elements
const nowPlayingCard = document.getElementById('nowPlayingCard');
const nowPlayingThumb = document.getElementById('nowPlayingThumb');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const nowPlayingArtist = document.getElementById('nowPlayingArtist');
const playPauseBtn = document.getElementById('playPauseBtnMain');
const stopBtn = document.getElementById('stopMusicBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeUpBtn = document.getElementById('volumeUpBtn');
const volumeDownBtn = document.getElementById('volumeDownBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsList = document.getElementById('resultsList');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Helper Functions
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Load play history
function loadPlayHistory() {
    const saved = localStorage.getItem('bizzy_play_history');
    if (saved) {
        try {
            playHistory = JSON.parse(saved);
            if (playHistory.length > 0) {
                renderHistory();
                if (clearHistoryBtn) clearHistoryBtn.style.display = 'flex';
            }
        } catch(e) {
            console.log('Error loading history');
        }
    }
}

function saveToHistory(track) {
    if (!track || !track.title) return;
    
    playHistory = playHistory.filter(t => t.url !== track.url);
    playHistory.unshift({
        title: track.title,
        url: track.url,
        thumbnail: track.thumbnail,
        artist: track.artist,
        timestamp: new Date().toISOString()
    });
    if (playHistory.length > 20) playHistory = playHistory.slice(0, 20);
    
    localStorage.setItem('bizzy_play_history', JSON.stringify(playHistory));
    renderHistory();
    if (clearHistoryBtn) clearHistoryBtn.style.display = 'flex';
}

function renderHistory() {
    if (!historyList) return;
    
    if (playHistory.length === 0) {
        historySection.style.display = 'none';
        if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    historyList.innerHTML = playHistory.map((track, index) => `
        <div class="history-item" onclick="playFromHistory(${index})">
            <img src="${escapeHtml(track.thumbnail || 'https://via.placeholder.com/35x35?text=🎵')}" class="history-item-thumb" onerror="this.src='https://via.placeholder.com/35x35?text=🎵'">
            <div class="history-item-info">
                <div class="history-item-title">${escapeHtml(track.title.substring(0, 40))}${track.title.length > 40 ? '...' : ''}</div>
                <div class="history-item-artist">${escapeHtml(track.artist || 'Unknown Artist')}</div>
            </div>
            <i class="fas fa-play-circle" style="color: #ffd700; opacity: 0.6;"></i>
        </div>
    `).join('');
}

function playFromHistory(index) {
    const track = playHistory[index];
    if (track && track.url) {
        playMusic(track.title, track.url, track.thumbnail, track.artist);
    }
}

function clearPlayHistory() {
    if (confirm('Hapus semua riwayat putar?')) {
        playHistory = [];
        localStorage.removeItem('bizzy_play_history');
        renderHistory();
        showToast('Riwayat putar telah dihapus');
        if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
    }
}

// Search Music from API
async function searchMusic(query) {
    if (!query.trim()) {
        resultsList.innerHTML = '<div class="empty-message"><i class="fas fa-exclamation-triangle"></i> Masukkan judul lagu</div>';
        return;
    }

    resultsList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-pulse"></i> Mencari lagu...</div>';

    try {
        const response = await fetch(`https://api-faa.my.id/faa/ytplay?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.status && data.result) {
            const r = data.result;
            const durationFormatted = r.duration_timestamp || formatDuration(r.duration);
            
            resultsList.innerHTML = `
                <div class="result-item" 
                     data-title="${escapeHtml(r.title)}" 
                     data-url="${r.mp3}" 
                     data-thumb="${r.thumbnail}" 
                     data-artist="${escapeHtml(r.author)}">
                    <img src="${r.thumbnail}" class="result-thumb" onerror="this.src='https://via.placeholder.com/55x55?text=🎵'">
                    <div class="result-info">
                        <div class="result-title">${escapeHtml(r.title)}</div>
                        <div class="result-artist">${escapeHtml(r.author)}</div>
                        <div class="result-duration">⏱️ ${durationFormatted}</div>
                    </div>
                </div>
            `;
            
            const resultItem = document.querySelector('.result-item');
            if (resultItem) {
                resultItem.addEventListener('click', function() {
                    const title = this.getAttribute('data-title');
                    const url = this.getAttribute('data-url');
                    const thumb = this.getAttribute('data-thumb');
                    const artist = this.getAttribute('data-artist');
                    playMusic(title, url, thumb, artist);
                });
            }
        } else {
            resultsList.innerHTML = '<div class="empty-message"><i class="fas fa-music-slash"></i> Lagu tidak ditemukan, coba kata kunci lain</div>';
        }
    } catch (error) {
        console.error(error);
        resultsList.innerHTML = '<div class="empty-message"><i class="fas fa-wifi"></i> Error koneksi, coba lagi nanti</div>';
        showToast('⚠️ Gagal mengambil data dari server');
    }
}

// Play Music - Sync dengan GlobalMusic
function playMusic(title, url, thumbnail, artist) {
    if (!url || url === 'undefined') {
        showToast('❌ URL lagu tidak valid');
        return;
    }

    if (window.GlobalMusic && window.GlobalMusic.play) {
        window.GlobalMusic.play(title, url, thumbnail, artist);
        saveToHistory({ title, url, thumbnail, artist });
        showToast(`🎵 Memutar: ${title}`);
    } else {
        showToast('⚠️ Music player tidak tersedia');
    }
    
    updateNowPlayingUI();
}

// Update UI Now Playing dari GlobalMusic
function updateNowPlayingUI() {
    if (window.GlobalMusic) {
        const track = window.GlobalMusic.getCurrentTrack();
        const playing = window.GlobalMusic.isPlaying();
        
        if (track) {
            nowPlayingCard.style.display = 'block';
            nowPlayingThumb.src = track.thumbnail || 'https://via.placeholder.com/70x70?text=🎵';
            nowPlayingTitle.innerText = track.title || 'Unknown Title';
            nowPlayingArtist.innerText = track.artist || 'Unknown Artist';
            playPauseBtn.innerHTML = playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        } else {
            nowPlayingCard.style.display = 'none';
        }
    }
}

// Toggle Play/Pause
function togglePlayPause() {
    if (window.GlobalMusic) {
        if (window.GlobalMusic.isPlaying()) {
            window.GlobalMusic.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            window.GlobalMusic.resume();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    } else {
        showToast('Pilih lagu terlebih dahulu');
    }
}

// Stop Music
function stopMusic() {
    if (window.GlobalMusic) {
        window.GlobalMusic.stop();
    }
    nowPlayingCard.style.display = 'none';
    showToast('⏹️ Musik dihentikan');
}

// Volume Control
function setVolume(value) {
    const vol = Math.min(1, Math.max(0, value / 100));
    if (window.GlobalMusic && window.GlobalMusic.setVolume) {
        window.GlobalMusic.setVolume(value);
    }
    volumeSlider.value = value;
    localStorage.setItem('bizzy_music_volume', vol);
}

function volumeUp() {
    let newVol = Math.min(100, (volumeSlider.valueAsNumber || 70) + 10);
    setVolume(newVol);
}

function volumeDown() {
    let newVol = Math.max(0, (volumeSlider.valueAsNumber || 70) - 10);
    setVolume(newVol);
}

// ========== KEMBALI KE HALAMAN UTAMA - SIMPAN STATE MUSIC ==========
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

// Event Listeners
function initEventListeners() {
    searchBtn.addEventListener('click', () => {
        searchMusic(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchMusic(searchInput.value);
        }
    });

    playPauseBtn.addEventListener('click', togglePlayPause);
    stopBtn.addEventListener('click', stopMusic);
    volumeUpBtn.addEventListener('click', volumeUp);
    volumeDownBtn.addEventListener('click', volumeDown);
    volumeSlider.addEventListener('input', (e) => setVolume(parseInt(e.target.value)));
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearPlayHistory);
    }
    
    setInterval(() => {
        updateNowPlayingUI();
    }, 1000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initEventListeners();
    loadPlayHistory();
    
    setTimeout(() => {
        updateNowPlayingUI();
        console.log('🎵 Music Player siap - terhubung dengan Dynamic Island');
    }, 500);
    
    setTimeout(() => {
        showToast('🎧 Selamat datang di Bizzy Music! Cari lagu favoritmu.');
    }, 1000);
});

window.playFromHistory = playFromHistory;
window.goBackToTools = goBackToTools;