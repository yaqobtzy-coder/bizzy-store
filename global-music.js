// ========== GLOBAL MUSIC PLAYER - PERSISTENT ==========
// Dynamic Island - RESIZABLE + INTEGRASI CHAT
// FIX: MUSIK TETAP BERJALAN SAAT PINDAH HALAMAN

(function() {
    if (window.__globalMusicInitialized) return;
    window.__globalMusicInitialized = true;

    console.log('🎵 Global Music Player - PERSISTENT VERSION');

    let audio = null;
    let currentTrack = null;
    let isPlaying = false;
    let islandElement = null;
    let currentSize = 85;
    
    // KEY untuk localStorage
    const MUSIC_STATE_KEY = 'bizzy_music_persistent_state';
    const MUSIC_TIME_KEY = 'bizzy_music_current_time';
    
    // Ukuran dasar
    const BASE_SIZE = {
        padding: '8px 10px',
        thumbSize: '28px',
        titleFont: '0.65rem',
        artistFont: '0.5rem',
        btnSize: '26px',
        btnFont: '0.7rem',
        navPadding: '4px 8px',
        navFont: '0.55rem',
        progressHeight: '3px',
        minWidth: '160px',
        borderRadius: '16px'
    };

    // ========== AUDIO GLOBAL ==========
    function getOrCreateAudio() {
        if (window.__globalAudio && window.__globalAudio.src) {
            audio = window.__globalAudio;
            console.log('🎵 Menggunakan audio element existing');
        } else {
            audio = new Audio();
            window.__globalAudio = audio;
            console.log('🎵 Membuat audio element baru');
        }
        
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('timeupdate', updateProgress);
        
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('timeupdate', updateProgress);
        
        return audio;
    }
    
    function handlePlay() { 
        isPlaying = true; 
        updateUI(); 
        saveState();
        startTimeSaving();
    }
    
    function handlePause() { 
        isPlaying = false; 
        updateUI(); 
        saveState();
        stopTimeSaving();
    }
    
    function handleEnded() { 
        isPlaying = false; 
        updateUI(); 
        saveState();
        stopTimeSaving();
    }
    
    let timeSaveInterval = null;
    
    function startTimeSaving() {
        if (timeSaveInterval) clearInterval(timeSaveInterval);
        timeSaveInterval = setInterval(() => {
            if (audio && audio.currentTime) {
                localStorage.setItem(MUSIC_TIME_KEY, audio.currentTime.toString());
            }
        }, 1000);
    }
    
    function stopTimeSaving() {
        if (timeSaveInterval) {
            clearInterval(timeSaveInterval);
            timeSaveInterval = null;
        }
    }

    // ========== STYLES ==========
    function injectStyles() {
        if (document.getElementById('dynamic-island-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'dynamic-island-styles';
        style.textContent = `
            .dynamic-island {
                position: fixed !important;
                z-index: 99999 !important;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(16px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border: 1px solid #ffd700;
                cursor: grab;
                user-select: none;
                transition: all 0.1s ease;
                touch-action: none;
            }
            .dynamic-island:active { cursor: grabbing; }
            .dynamic-island.dragging { opacity: 0.85; cursor: grabbing; }
            .dynamic-island.minimized .island-info,
            .dynamic-island.minimized .island-progress,
            .dynamic-island.minimized .island-controls-row,
            .dynamic-island.minimized .island-nav-buttons,
            .dynamic-island.minimized .resize-controls,
            .dynamic-island.minimized .chat-integration { display: none; }
            .dynamic-island.minimized { padding: 6px 10px !important; min-width: auto !important; }
            
            .dynamic-island.playing {
                animation: islandPulse 2s infinite;
            }
            @keyframes islandPulse {
                0% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 rgba(255,215,0,0.4); }
                50% { box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,215,0,0.2); }
                100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 rgba(255,215,0,0); }
            }
            
            .island-top-row {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 6px;
            }
            .island-thumb {
                border-radius: 8px;
                object-fit: cover;
                transition: all 0.1s ease;
            }
            .island-info { flex: 1; overflow: hidden; }
            .island-title {
                font-weight: 700;
                color: #ffd700;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                transition: all 0.1s ease;
            }
            .island-artist {
                opacity: 0.7;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                transition: all 0.1s ease;
            }
            .island-progress {
                background: rgba(255,255,255,0.2);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 8px;
                transition: all 0.1s ease;
            }
            .island-progress-fill {
                width: 0%;
                height: 100%;
                background: #ffd700;
                transition: width 0.1s linear;
            }
            .island-controls-row {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-bottom: 8px;
            }
            .island-btn {
                background: rgba(255,215,0,0.2);
                border: none;
                border-radius: 50%;
                cursor: pointer;
                color: #ffd700;
                transition: 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .island-btn:hover {
                background: #ffd700;
                color: #1a1a1a;
                transform: scale(1.05);
            }
            
            .chat-integration {
                display: flex;
                gap: 6px;
                margin-bottom: 8px;
                justify-content: center;
            }
            .chat-share-btn {
                background: rgba(30,136,229,0.2);
                border: none;
                padding: 4px 8px;
                border-radius: 16px;
                cursor: pointer;
                color: #ffd700;
                font-size: 0.55rem;
                transition: 0.2s;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .chat-share-btn:hover {
                background: #ffd700;
                color: #1a1a1a;
                transform: scale(1.02);
            }
            
            .resize-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-top: 8px;
                padding-top: 6px;
                border-top: 1px solid rgba(255,215,0,0.2);
            }
            .resize-btn {
                background: rgba(255,215,0,0.15);
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                color: #ffd700;
                font-size: 0.8rem;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: 0.2s;
            }
            .resize-btn:hover {
                background: #ffd700;
                color: #1a1a2e;
                transform: scale(1.05);
            }
            .resize-value {
                font-size: 0.55rem;
                color: #ffd700;
                background: rgba(0,0,0,0.5);
                padding: 2px 6px;
                border-radius: 12px;
                min-width: 45px;
                text-align: center;
            }
            .resize-slider {
                width: 80px;
                height: 3px;
                -webkit-appearance: none;
                background: rgba(255,215,0,0.3);
                border-radius: 3px;
                outline: none;
            }
            .resize-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #ffd700;
                cursor: pointer;
            }
            
            .island-nav-buttons {
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding-top: 6px;
                border-top: 1px solid rgba(255,215,0,0.2);
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }
            .dynamic-island:not(.minimized) .island-nav-buttons {
                max-height: 200px;
            }
            .island-nav-btn {
                background: rgba(255,215,0,0.12);
                border: none;
                border-radius: 16px;
                cursor: pointer;
                color: #ffd700;
                transition: 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
                width: 100%;
                font-weight: 500;
            }
            .island-nav-btn i { width: 14px; }
            .island-nav-btn:hover {
                background: #ffd700;
                color: #1a1a2e;
                transform: translateX(3px);
            }
            .island-expand-btn {
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 50%;
                cursor: pointer;
                color: #ffd700;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: 0.2s;
            }
            .island-expand-btn:hover {
                background: rgba(255,215,0,0.3);
                transform: scale(1.05);
            }
            .island-expand-btn i {
                transition: transform 0.3s ease;
            }
            .dynamic-island:not(.minimized) .island-expand-btn i {
                transform: rotate(90deg);
            }
            
            body.light .dynamic-island {
                background: rgba(255,255,255,0.95);
                border-color: #1e88e5;
            }
            body.light .island-title { color: #0d47a1; }
            body.light .island-btn { background: rgba(30,136,229,0.15); color: #0d47a1; }
            body.light .island-nav-btn { background: rgba(30,136,229,0.1); color: #0d47a1; }
        `;
        document.head.appendChild(style);
    }

    // ========== RESIZE ==========
    function applySize(percent) {
        if (!islandElement) return;
        
        const scale = percent / 100;
        
        islandElement.style.padding = `calc(${BASE_SIZE.padding} * ${scale})`;
        islandElement.style.borderRadius = `calc(${BASE_SIZE.borderRadius} * ${scale})`;
        islandElement.style.minWidth = `calc(${BASE_SIZE.minWidth} * ${scale})`;
        
        const thumb = document.querySelector('.island-thumb');
        if (thumb) {
            thumb.style.width = `calc(${BASE_SIZE.thumbSize} * ${scale})`;
            thumb.style.height = `calc(${BASE_SIZE.thumbSize} * ${scale})`;
        }
        
        const title = document.querySelector('.island-title');
        const artist = document.querySelector('.island-artist');
        if (title) title.style.fontSize = `calc(${BASE_SIZE.titleFont} * ${scale})`;
        if (artist) artist.style.fontSize = `calc(${BASE_SIZE.artistFont} * ${scale})`;
        
        const btns = document.querySelectorAll('.island-btn');
        btns.forEach(btn => {
            btn.style.width = `calc(${BASE_SIZE.btnSize} * ${scale})`;
            btn.style.height = `calc(${BASE_SIZE.btnSize} * ${scale})`;
            btn.style.fontSize = `calc(${BASE_SIZE.btnFont} * ${scale})`;
        });
        
        const navBtns = document.querySelectorAll('.island-nav-btn');
        navBtns.forEach(btn => {
            btn.style.padding = `calc(${BASE_SIZE.navPadding} * ${scale})`;
            btn.style.fontSize = `calc(${BASE_SIZE.navFont} * ${scale})`;
        });
        
        const progress = document.querySelector('.island-progress');
        if (progress) progress.style.height = `calc(${BASE_SIZE.progressHeight} * ${scale})`;
        
        currentSize = percent;
        localStorage.setItem('island_size', currentSize);
        
        const slider = document.getElementById('resizeSlider');
        const valueDisplay = document.getElementById('resizeValue');
        if (slider) slider.value = percent;
        if (valueDisplay) valueDisplay.innerText = percent + '%';
    }
    
    function increaseSize() {
        if (currentSize < 200) applySize(currentSize + 10);
    }
    
    function decreaseSize() {
        if (currentSize > 50) applySize(currentSize - 10);
    }
    
    function loadSize() {
        const saved = localStorage.getItem('island_size');
        if (saved) {
            currentSize = parseInt(saved);
            applySize(currentSize);
        } else {
            applySize(85);
        }
    }

    // ========== POSITION ==========
    function savePosition(left, top) {
        localStorage.setItem('island_left', left);
        localStorage.setItem('island_top', top);
    }
    
    function loadPosition() {
        const left = localStorage.getItem('island_left');
        const top = localStorage.getItem('island_top');
        if (left && top) {
            return { left: parseInt(left), top: parseInt(top) };
        }
        return { left: window.innerWidth - 180, top: window.innerHeight - 220 };
    }
    
    function applyPosition() {
        if (!islandElement) return;
        const pos = loadPosition();
        islandElement.style.left = pos.left + 'px';
        islandElement.style.top = pos.top + 'px';
        islandElement.style.right = 'auto';
        islandElement.style.bottom = 'auto';
    }

    // ========== SHARE TO CHAT ==========
    async function shareToChat() {
        if (!currentTrack) {
            showToastTemporary('Tidak ada lagu yang sedang diputar');
            return;
        }
        
        const musicMessage = `🎵 **Now Playing:** ${currentTrack.title} - ${currentTrack.artist || 'Unknown Artist'} 🎧`;
        
        if (window.sendChatMessage) {
            window.sendChatMessage(musicMessage);
            showToastTemporary('Lagu dibagikan ke chat!', 'success');
        } else if (window.database) {
            try {
                const currentUser = localStorage.getItem('chat_username');
                if (currentUser && window.database) {
                    await window.database.ref('chat/messages').push({
                        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                        userId: 'music_bot',
                        username: currentUser,
                        text: musicMessage,
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        type: 'music_share'
                    });
                    showToastTemporary('Lagu dibagikan ke chat!', 'success');
                }
            } catch(e) {
                showToastTemporary('Buka halaman chat untuk share lagu');
            }
        } else {
            showToastTemporary('Buka halaman chat untuk share lagu');
        }
    }
    
    function showToastTemporary(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'music-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: #ffd700;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 100000;
            backdrop-filter: blur(10px);
            border: 1px solid #ffd700;
            white-space: nowrap;
        `;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // ========== CREATE ISLAND ==========
    function createIsland() {
        if (islandElement) return;
        
        islandElement = document.createElement('div');
        islandElement.className = 'dynamic-island minimized';
        islandElement.id = 'dynamicIsland';
        islandElement.innerHTML = `
            <div class="island-top-row">
                <img class="island-thumb" id="islandThumb" src="https://via.placeholder.com/28x28?text=🎵">
                <div class="island-info">
                    <div class="island-title" id="islandTitle">Tidak ada lagu</div>
                    <div class="island-artist" id="islandArtist">-</div>
                </div>
                <button class="island-expand-btn" id="islandExpandBtn"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="island-progress" id="islandProgress">
                <div class="island-progress-fill" id="islandProgressFill"></div>
            </div>
            <div class="chat-integration">
                <button class="chat-share-btn" id="shareToChatBtn"><i class="fas fa-share-alt"></i> Share ke Chat</button>
            </div>
            <div class="island-controls-row">
                <button class="island-btn" id="islandPlayBtn"><i class="fas fa-play"></i></button>
                <button class="island-btn" id="islandStopBtn"><i class="fas fa-stop"></i></button>
            </div>
            <div class="resize-controls" id="resizeControls">
                <button class="resize-btn" id="resizeMinus"><i class="fas fa-minus"></i></button>
                <input type="range" class="resize-slider" id="resizeSlider" min="50" max="200" step="5" value="85">
                <button class="resize-btn" id="resizePlus"><i class="fas fa-plus"></i></button>
                <span class="resize-value" id="resizeValue">85%</span>
            </div>
            <div class="island-nav-buttons" id="islandNavButtons">
                <button class="island-nav-btn" id="navToTools"><i class="fas fa-crown"></i> Tools</button>
                <button class="island-nav-btn" id="navToMusic"><i class="fas fa-music"></i> Music</button>
                <button class="island-nav-btn" id="navToAnime"><i class="fas fa-tv"></i> Anime</button>
                <button class="island-nav-btn" id="navToChat"><i class="fas fa-comments"></i> Chat</button>
                <button class="island-nav-btn" id="navToGames"><i class="fas fa-gamepad"></i> Games</button>
                <button class="island-nav-btn" id="navToMaker"><i class="fas fa-magic"></i> Maker</button>
            </div>
        `;
        document.body.appendChild(islandElement);
        
        window.islandThumb = document.getElementById('islandThumb');
        window.islandTitle = document.getElementById('islandTitle');
        window.islandArtist = document.getElementById('islandArtist');
        window.islandProgressFill = document.getElementById('islandProgressFill');
        
        // DRAG & DROP
        let isDraggingFlag = false;
        let dragOffsetX = 0, dragOffsetY = 0;
        
        function startDrag(e) {
            if (e.target.closest('.island-btn') || 
                e.target.closest('.island-nav-btn') || 
                e.target.closest('.island-expand-btn') ||
                e.target.closest('.resize-controls') ||
                e.target.closest('.chat-integration')) {
                return;
            }
            e.preventDefault();
            isDraggingFlag = true;
            islandElement.classList.add('dragging');
            
            let clientX, clientY;
            if (e.type === 'mousedown') {
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            const rect = islandElement.getBoundingClientRect();
            dragOffsetX = clientX - rect.left;
            dragOffsetY = clientY - rect.top;
        }
        
        function onDrag(e) {
            if (!isDraggingFlag) return;
            e.preventDefault();
            
            let clientX, clientY;
            if (e.type === 'mousemove') {
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            
            let newLeft = clientX - dragOffsetX;
            let newTop = clientY - dragOffsetY;
            const maxX = window.innerWidth - islandElement.offsetWidth;
            const maxY = window.innerHeight - islandElement.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            
            islandElement.style.left = newLeft + 'px';
            islandElement.style.top = newTop + 'px';
        }
        
        function stopDrag() {
            if (isDraggingFlag) {
                isDraggingFlag = false;
                islandElement.classList.remove('dragging');
                const left = parseFloat(islandElement.style.left);
                const top = parseFloat(islandElement.style.top);
                if (!isNaN(left) && !isNaN(top)) savePosition(left, top);
            }
        }
        
        islandElement.addEventListener('mousedown', startDrag);
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopDrag);
        islandElement.addEventListener('touchstart', startDrag, { passive: false });
        window.addEventListener('touchmove', onDrag, { passive: false });
        window.addEventListener('touchend', stopDrag);
        
        // RESIZE
        document.getElementById('resizeMinus').addEventListener('click', (e) => { e.stopPropagation(); decreaseSize(); });
        document.getElementById('resizePlus').addEventListener('click', (e) => { e.stopPropagation(); increaseSize(); });
        document.getElementById('resizeSlider').addEventListener('input', (e) => { e.stopPropagation(); applySize(parseInt(e.target.value)); });
        
        // SHARE TO CHAT
        document.getElementById('shareToChatBtn').addEventListener('click', (e) => { e.stopPropagation(); shareToChat(); });
        
        // MUSIC CONTROLS
        document.getElementById('islandPlayBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio && !audio.paused) audio.pause();
            else if (currentTrack) audio.play();
        });
        
        document.getElementById('islandStopBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                currentTrack = null;
                isPlaying = false;
                updateUI();
                saveState();
                localStorage.removeItem(MUSIC_STATE_KEY);
                localStorage.removeItem(MUSIC_TIME_KEY);
            }
        });
        
        document.getElementById('islandExpandBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            islandElement.classList.toggle('minimized');
        });
        
        // NAVIGATION
        document.getElementById('navToTools').addEventListener('click', (e) => { e.stopPropagation(); goToPage('tools.html'); });
        document.getElementById('navToMusic').addEventListener('click', (e) => { e.stopPropagation(); goToPage('music.html'); });
        document.getElementById('navToAnime').addEventListener('click', (e) => { e.stopPropagation(); goToPage('anime.html'); });
        document.getElementById('navToChat').addEventListener('click', (e) => { e.stopPropagation(); goToPage('chat.html'); });
        document.getElementById('navToGames').addEventListener('click', (e) => { e.stopPropagation(); goToPage('games.html'); });
        document.getElementById('navToMaker').addEventListener('click', (e) => { e.stopPropagation(); goToPage('maker.html'); });
        
        applyPosition();
        loadSize();
    }
    
    function goToPage(page) {
        saveState();
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.2s';
        setTimeout(() => { window.location.href = page; }, 200);
    }
    
    function updateUI() {
        if (!islandElement) return;
        if (currentTrack) {
            if (window.islandThumb) window.islandThumb.src = currentTrack.thumbnail || 'https://via.placeholder.com/28x28?text=🎵';
            if (window.islandTitle) window.islandTitle.innerText = currentTrack.title || '-';
            if (window.islandArtist) window.islandArtist.innerText = currentTrack.artist || '-';
        }
        if (isPlaying) islandElement.classList.add('playing');
        else islandElement.classList.remove('playing');
    }
    
    function updateProgress() {
        if (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0 && window.islandProgressFill) {
            window.islandProgressFill.style.width = (audio.currentTime / audio.duration) * 100 + '%';
        }
    }
    
    function saveState() {
        if (currentTrack && audio) {
            const state = {
                title: currentTrack.title,
                url: currentTrack.url,
                thumbnail: currentTrack.thumbnail,
                artist: currentTrack.artist,
                currentTime: audio.currentTime || 0,
                isPlaying: !audio.paused
            };
            localStorage.setItem(MUSIC_STATE_KEY, JSON.stringify(state));
            console.log('💾 State musik disimpan:', currentTrack.title, 'time:', audio.currentTime);
        }
    }
    
    function restoreState() {
        let saved = localStorage.getItem(MUSIC_STATE_KEY);
        if (!saved) return;
        
        try {
            const state = JSON.parse(saved);
            if (state.url && state.url !== 'undefined' && state.url !== 'null') {
                currentTrack = {
                    title: state.title,
                    url: state.url,
                    thumbnail: state.thumbnail,
                    artist: state.artist
                };
                
                const audioElem = getOrCreateAudio();
                
                if (audioElem.src !== state.url) {
                    audioElem.src = state.url;
                    audioElem.load();
                }
                
                audioElem.currentTime = state.currentTime || 0;
                
                if (state.isPlaying) {
                    audioElem.play().then(() => {
                        isPlaying = true;
                        updateUI();
                        console.log('🎵 Musik dilanjutkan:', currentTrack.title);
                    }).catch(e => console.log('Auto-play blocked:', e));
                } else {
                    isPlaying = false;
                }
                
                updateUI();
                console.log('🎵 State musik dipulihkan:', currentTrack.title);
            }
        } catch(e) {
            console.log('Gagal restore state:', e);
        }
    }
    
    // INITIALIZATION
    function init() {
        injectStyles();
        createIsland();
        getOrCreateAudio();
        restoreState();
        
        setInterval(() => {
            if (audio && audio.currentTime) {
                updateProgress();
            }
        }, 100);
        
        setInterval(() => {
            if (currentTrack) saveState();
        }, 3000);
        
        console.log('🎵 Dynamic Island PERSISTENT siap - Musik TIDAK BERHENTI saat pindah halaman!');
    }
    
    window.GlobalMusic = {
        play: (title, url, thumbnail, artist) => {
            if (!url || url === 'undefined') return false;
            const audioElem = getOrCreateAudio();
            currentTrack = { title, url, thumbnail, artist };
            audioElem.src = url;
            audioElem.load();
            audioElem.play().then(() => { 
                isPlaying = true; 
                updateUI(); 
                saveState();
            }).catch(e => console.log(e));
            return true;
        },
        pause: () => { if (audio) audio.pause(); },
        resume: () => { if (audio && currentTrack) audio.play(); },
        stop: () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                currentTrack = null;
                isPlaying = false;
                updateUI();
                saveState();
            }
        },
        setVolume: (value) => { if (audio) audio.volume = Math.min(1, Math.max(0, value / 100)); },
        getCurrentTrack: () => currentTrack,
        isPlaying: () => audio && !audio.paused,
        saveState: () => saveState(),
        setSize: (percent) => applySize(percent),
        getSize: () => currentSize,
        shareToChat: shareToChat
    };
    
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();