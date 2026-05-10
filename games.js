// ========== GAMES ZONE PAGE SCRIPT - DENGAN API & FALLBACK ==========

// Konfigurasi Game
const gamesConfig = [
    { id: "asahotak", name: "Asah Otak", desc: "Tingkatkan ketajaman otakmu", icon: "fa-brain", gameType: "quiz", api: "https://api.skylow.web.id/api/games/asahotak" },
    { id: "islamicquiz", name: "Islamic Quiz", desc: "Uji pengetahuan Islammu", icon: "fa-mosque", gameType: "answer", api: "https://api.skylow.web.id/api/games/islamicquiz" },
    { id: "siapakahaku", name: "Siapakah Aku?", desc: "Tebak tokoh dari deskripsi", icon: "fa-question-circle", gameType: "answer", api: "https://api.skylow.web.id/api/games/siapakahaku" },
    { id: "susunkata", name: "Susun Kata", desc: "Susun huruf jadi kata", icon: "fa-font", gameType: "answer", api: "https://api.skylow.web.id/api/games/susunkata" },
    { id: "tebakkimia", name: "Tebak Kimia", desc: "Tebak unsur kimia", icon: "fa-flask", gameType: "answer", api: "https://api.skylow.web.id/api/games/tebakkimia" },
    { id: "tebaklirik", name: "Tebak Lirik", desc: "Tebak lagu dari lirik", icon: "fa-music", gameType: "answer", api: "https://api.skylow.web.id/api/games/tebaklirik" },
    { id: "tebaktebakan", name: "Tebak-tebakan", desc: "Tebakan lucu dan seru", icon: "fa-smile-wink", gameType: "answer", api: "https://api.skylow.web.id/api/games/tebaktebakan" },
    { id: "tekateki", name: "Teka-teki", desc: "Pecahkan teka-teki", icon: "fa-puzzle-piece", gameType: "answer", api: "https://api.skylow.web.id/api/games/tekateki" }
];

// DATA FALLBACK (Jika API gagal atau kurang dari 10 soal)
const fallbackData = {
    asahotak: [
        { question: "Presiden pertama Amerika Serikat?", answer: "Washington" },
        { question: "Ibu kota Indonesia?", answer: "Jakarta" },
        { question: "Siapa presiden pertama Indonesia?", answer: "Soekarno" },
        { question: "Apa nama benua terbesar?", answer: "Asia" },
        { question: "Gunung tertinggi di dunia?", answer: "Everest" },
        { question: "Lambang negara Indonesia?", answer: "Garuda" },
        { question: "Semboyan negara Indonesia?", answer: "Bhinneka Tunggal Ika" },
        { question: "Hari Kemerdekaan Indonesia?", answer: "17 Agustus" },
        { question: "Sungai terpanjang di dunia?", answer: "Nil" },
        { question: "Planet terdekat dengan matahari?", answer: "Merkurius" }
    ],
    islamicquiz: [
        { question: "Perang antara Ali bin Abi Thalib dan Muawiyah?", answer: "Siffin" },
        { question: "Nabi yang diberikan mukjizat membelah lautan?", answer: "Musa" },
        { question: "Surat pertama dalam Al-Quran?", answer: "Al-Fatihah" },
        { question: "Jumlah rukun Islam?", answer: "5" },
        { question: "Jumlah rukun Iman?", answer: "6" },
        { question: "Nabi terakhir dalam Islam?", answer: "Muhammad" },
        { question: "Kitab suci umat Islam?", answer: "Al-Quran" },
        { question: "Tempat suci umat Islam di Mekkah?", answer: "Ka'bah" },
        { question: "Malaikat yang menyampaikan wahyu?", answer: "Jibril" },
        { question: "Puasa wajib di bulan?", answer: "Ramadhan" }
    ],
    siapakahaku: [
        { question: "Aku terbuat dari kain. Bentukku bermacam-macam, aku untuk menutupi jendela.", answer: "Tirai" },
        { question: "Aku digunakan untuk menulis, aku memiliki tinta.", answer: "Pulpen" },
        { question: "Aku digunakan untuk membersihkan lantai.", answer: "Sapu" },
        { question: "Aku tempat untuk menyimpan makanan dingin.", answer: "Kulkas" },
        { question: "Aku digunakan untuk memasak nasi.", answer: "Rice Cooker" },
        { question: "Aku digunakan untuk melihat waktu.", answer: "Jam" },
        { question: "Aku digunakan untuk duduk.", answer: "Kursi" },
        { question: "Aku digunakan untuk tidur.", answer: "Kasur" },
        { question: "Aku digunakan untuk membawa barang.", answer: "Tas" },
        { question: "Aku digunakan untuk menghubungi orang jauh.", answer: "Telepon" }
    ],
    susunkata: [
        { scrambled: "T-U-B-A", answer: "Batu", hint: "Benda keras" },
        { scrambled: "A-J-R-U-M", answer: "Jarum", hint: "Benda tajam" },
        { scrambled: "K-U-R-S-I", answer: "Kursi", hint: "Tempat duduk" },
        { scrambled: "M-E-J-A", answer: "Meja", hint: "Tempat letak barang" },
        { scrambled: "B-U-K-U", answer: "Buku", hint: "Bacaan" },
        { scrambled: "P-E-N-S-I-L", answer: "Pensil", hint: "Alat tulis" },
        { scrambled: "S-E-K-O-L-A-H", answer: "Sekolah", hint: "Tempat belajar" },
        { scrambled: "G-U-R-U", answer: "Guru", hint: "Pengajar" },
        { scrambled: "D-O-K-T-E-R", answer: "Dokter", hint: "Pengobat" },
        { scrambled: "P-O-L-I-S-I", answer: "Polisi", hint: "Penjaga keamanan" }
    ],
    tebakkimia: [
        { element: "Gadolinium", symbol: "Gd" },
        { element: "Hidrogen", symbol: "H" },
        { element: "Helium", symbol: "He" },
        { element: "Litium", symbol: "Li" },
        { element: "Berilium", symbol: "Be" },
        { element: "Bor", symbol: "B" },
        { element: "Karbon", symbol: "C" },
        { element: "Nitrogen", symbol: "N" },
        { element: "Oksigen", symbol: "O" },
        { element: "Fluor", symbol: "F" }
    ],
    tebaklirik: [
        { lyric: "Kupetik bintang, untuk kau simpan... sebagai pengingat teman, juga sebagai ______ semua tantangan", answer: "Jawaban" },
        { lyric: "Seperti **** yang kau lupakan, aku tetap setia menunggumu", answer: "Rindu" },
        { lyric: "Takkan ada hari tanpa dirimu, kau adalah ______ hidupku", answer: "Cahaya" },
        { lyric: "Ku kan menjagamu, di setiap ______ malam", answer: "Hembusan" },
        { lyric: "Takkan lelah aku menanti, sampai ______ kita bertemu lagi", answer: "Nanti" },
        { lyric: "Ku kan selalu ada untukmu, di setiap ______ yang kau lalui", answer: "Langkah" },
        { lyric: "Kau adalah ______ indah dalam hidupku", answer: "Cerita" },
        { lyric: "Takkan pernah ku lupakan, semua ______ bersamamu", answer: "Kenangan" },
        { lyric: "Ku kan terbang tinggi, melebihi ______", answer: "Langit" },
        { lyric: "Jangan pernah menyerah, karena ______ selalu di ujung jalan", answer: "Cahaya" }
    ],
    tebaktebakan: [
        { question: "Kota apa yang rasanya pahit?", answer: "Pare pare" },
        { question: "Hewan apa yang tidak pernah basah?", answer: "Ikan" },
        { question: "Buah apa yang bisa buat senyum?", answer: "Semangka" },
        { question: "Kota apa yang ada di tengah laut?", answer: "Kota Tua" },
        { question: "Makanan apa yang suka melihat ke atas?", answer: "Kue" },
        { question: "Minuman apa yang selalu mengantuk?", answer: "Kopi" },
        { question: "Benda apa yang bisa berenang di darat?", answer: "Kapal" },
        { question: "Hewan apa yang bisa terbang tanpa sayap?", answer: "Waktu" },
        { question: "Buah apa yang punya mata?", answer: "Matahari" },
        { question: "Kota apa yang paling dingin?", answer: "London" }
    ],
    tekateki: [
        { question: "Raja apa yang hobinya terbang?", answer: "Rajawali" },
        { question: "Apa yang bisa naik tapi tidak bisa turun?", answer: "Umur" },
        { question: "Apa yang selalu ada di depan tapi tak pernah terlihat?", answer: "Masa depan" },
        { question: "Apa yang bisa dipatahkan tanpa disentuh?", answer: "Janji" },
        { question: "Apa yang semakin diisi semakin ringan?", answer: "Balon" },
        { question: "Apa yang bisa berjalan tanpa kaki?", answer: "Jam" },
        { question: "Apa yang bisa berbicara tanpa mulut?", answer: "Telepon" },
        { question: "Apa yang bisa terbang tanpa sayap?", answer: "Waktu" },
        { question: "Apa yang bisa membersihkan tanpa air?", answer: "Penghapus" },
        { question: "Apa yang bisa dimasak tapi tidak bisa dimakan?", answer: "Telur asin" }
    ]
};

// Variabel Global
let currentGame = null;
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let isLoading = false;

// ========== UTILITIES ==========
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

function scrollToBottom() {
    const resultArea = document.getElementById('resultArea');
    if (resultArea) resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========== RENDER GAME MENU ==========
function renderGames() {
    const container = document.getElementById('gamesGrid');
    if (!container) return;
    
    container.innerHTML = gamesConfig.map((game, idx) => `
        <div class="menu-card" data-game-id="${game.id}" style="animation-delay: ${0.05 * idx}s">
            <i class="fas ${game.icon}"></i>
            <div class="menu-name">${escapeHtml(game.name)}</div>
            <div class="menu-desc">${escapeHtml(game.desc)}</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.getAttribute('data-game-id');
            const game = gamesConfig.find(g => g.id === gameId);
            if (game) startGame(game);
        });
    });
    
    console.log(`✅ Games Zone loaded: ${gamesConfig.length} games available`);
}

// ========== MULAI GAME ==========
async function startGame(game) {
    currentGame = game;
    currentIndex = 0;
    score = 0;
    await fetchQuestions(game);
}

// ========== AMBIL SOAL DARI API (10 Soal per Game) ==========
async function fetchQuestions(game) {
    showLoading(true);
    
    try {
        let questions = [];
        
        // Coba ambil 10 soal dari API (panggil berulang)
        for (let i = 0; i < 10; i++) {
            try {
                const response = await fetch(game.api);
                const data = await response.json();
                
                if (data.status && data.result) {
                    let q = null;
                    
                    // Parse berdasarkan tipe game
                    if (game.gameType === "quiz") {
                        q = {
                            question: data.result.question,
                            answer: data.result.answer,
                            options: getRandomOptions(data.result.answer)
                        };
                    } else if (game.id === "susunkata") {
                        q = {
                            question: `Susun kata: ${data.result.scrambled || '???'}`,
                            answer: data.result.answer,
                            hint: data.result.type || 'Tebak kata'
                        };
                    } else if (game.id === "tebakkimia") {
                        q = {
                            question: `Unsur kimia: ${data.result.element || '???'}`,
                            answer: data.result.symbol,
                            hint: `Simbol dari ${data.result.element}`
                        };
                    } else {
                        q = {
                            question: data.result.question || data.result.lyrics || `Soal ${i+1}`,
                            answer: data.result.answer
                        };
                    }
                    
                    if (q && q.question && q.answer) {
                        questions.push(q);
                    }
                }
            } catch(e) {
                console.log(`Gagal ambil soal ke-${i+1}:`, e);
            }
            
            // Delay kecil agar tidak overload API
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Jika kurang dari 5 soal, gunakan fallback
        if (questions.length < 5) {
            console.log(`Menggunakan fallback untuk ${game.name}`);
            questions = getFallbackQuestions(game);
        }
        
        // Batasi jadi 10 soal
        currentQuestions = questions.slice(0, 10);
        
        if (currentQuestions.length === 0) {
            showToast("Gagal memuat soal! Silakan coba lagi.", "error");
            showResult('error', "Gagal memuat soal", game.name);
        } else {
            showQuizQuestion();
        }
        
    } catch (error) {
        console.error(error);
        // Gunakan fallback jika API error total
        currentQuestions = getFallbackQuestions(game);
        if (currentQuestions.length > 0) {
            showToast("Menggunakan data lokal karena koneksi bermasalah", "info");
            showQuizQuestion();
        } else {
            showToast(`Error: ${error.message}`, "error");
            showResult('error', error.message, game.name);
        }
    } finally {
        showLoading(false);
    }
}

// ========== GET FALLBACK QUESTIONS ==========
function getFallbackQuestions(game) {
    const fallback = fallbackData[game.id] || [];
    
    if (game.gameType === "quiz") {
        return fallback.map(item => ({
            question: item.question,
            answer: item.answer,
            options: getRandomOptions(item.answer)
        }));
    } else if (game.id === "susunkata") {
        return fallback.map(item => ({
            question: `Susun kata: ${item.scrambled}`,
            answer: item.answer,
            hint: item.hint
        }));
    } else if (game.id === "tebakkimia") {
        return fallback.map(item => ({
            question: `Unsur kimia: ${item.element}`,
            answer: item.symbol,
            hint: `Simbol dari ${item.element}`
        }));
    } else {
        return fallback.map(item => ({
            question: item.question || item.lyric || `Soal`,
            answer: item.answer
        }));
    }
}

// ========== GET RANDOM OPTIONS UNTUK QUIZ ==========
function getRandomOptions(correctAnswer) {
    const defaultOptions = [
        "Jakarta", "Surabaya", "Bandung", "Medan",
        "Soekarno", "Soeharto", "Habibie", "Megawati",
        "Asia", "Afrika", "Eropa", "Amerika",
        "Everest", "Kilimanjaro", "Fuji", "Elbrus"
    ];
    
    // Filter unik
    let options = [correctAnswer];
    while (options.length < 4) {
        const randomOpt = defaultOptions[Math.floor(Math.random() * defaultOptions.length)];
        if (!options.includes(randomOpt)) {
            options.push(randomOpt);
        }
    }
    // Acak urutan
    return options.sort(() => Math.random() - 0.5);
}

// ========== TAMPILKAN SOAL (QUIZ) ==========
function showQuizQuestion() {
    if (currentIndex >= currentQuestions.length) {
        showQuizResult();
        return;
    }
    
    const q = currentQuestions[currentIndex];
    const resultArea = document.getElementById('resultArea');
    resultArea.style.display = 'block';
    
    let optionsHtml = '';
    if (q.options && Array.isArray(q.options)) {
        optionsHtml = `<div class="quiz-options">` + 
            q.options.map((opt, idx) => `
                <div class="quiz-option" onclick="checkQuizAnswer('${escapeHtml(opt)}', '${escapeHtml(q.answer)}')">
                    ${String.fromCharCode(65 + idx)}. ${escapeHtml(opt)}
                </div>
            `).join('') + 
        `</div>`;
    }
    
    resultArea.innerHTML = `
        <div class="quiz-card">
            <div class="quiz-header">
                <span class="quiz-game-title"><i class="fas ${currentGame.icon}"></i> ${escapeHtml(currentGame.name)}</span>
                <span class="quiz-progress">${currentIndex + 1}/${currentQuestions.length}</span>
            </div>
            <div class="quiz-question">
                ${escapeHtml(q.question)}
                ${q.hint ? `<div class="quiz-hint"><i class="fas fa-lightbulb"></i> Petunjuk: ${escapeHtml(q.hint)}</div>` : ''}
            </div>
            ${optionsHtml}
            <div id="quizFeedback"></div>
            <div id="quizNextBtn"></div>
        </div>
        <div class="quiz-score">
            🎯 Score: ${score}/${currentIndex}
        </div>
    `;
    
    scrollToBottom();
}

// ========== CEK JAWABAN QUIZ ==========
function checkQuizAnswer(selected, correct) {
    const feedbackDiv = document.getElementById('quizFeedback');
    const options = document.querySelectorAll('.quiz-option');
    
    options.forEach(opt => opt.style.pointerEvents = 'none');
    
    options.forEach(opt => {
        if (opt.innerText.includes(correct)) {
            opt.classList.add('correct');
        }
    });
    
    const isCorrect = selected === correct;
    
    if (isCorrect) {
        score++;
        feedbackDiv.innerHTML = `<div class="quiz-feedback correct">✅ Benar! +1 poin</div>`;
    } else {
        feedbackDiv.innerHTML = `<div class="quiz-feedback wrong">❌ Salah! Jawaban: ${escapeHtml(correct)}</div>`;
    }
    
    document.querySelector('.quiz-score').innerHTML = `🎯 Score: ${score}/${currentIndex + 1}`;
    
    document.getElementById('quizNextBtn').innerHTML = `
        <button class="btn-primary" onclick="nextQuizQuestion()">
            ${currentIndex + 1 >= currentQuestions.length ? '🏆 Lihat Hasil' : '➡️ Soal Selanjutnya'}
        </button>
    `;
}

function nextQuizQuestion() {
    currentIndex++;
    showQuizQuestion();
}

function showQuizResult() {
    const resultArea = document.getElementById('resultArea');
    const percentage = (score / currentQuestions.length) * 100;
    let message = '';
    let emoji = '';
    
    if (percentage >= 90) {
        message = '🏆 LUAR BIASA! Kamu benar-benar jenius!';
        emoji = '🌟';
    } else if (percentage >= 70) {
        message = '🎉 HEBAT! Pengetahuanmu sangat baik!';
        emoji = '📚';
    } else if (percentage >= 50) {
        message = '👍 BAGUS! Terus belajar dan tingkatkan!';
        emoji = '💪';
    } else if (percentage >= 30) {
        message = '📖 Cukup, coba lagi pasti bisa lebih baik!';
        emoji = '🎯';
    } else {
        message = '💪 Jangan menyerah! Belajar lagi yuk!';
        emoji = '🔥';
    }
    
    resultArea.innerHTML = `
        <div class="quiz-card">
            <div style="text-align: center;">
                <i class="fas fa-trophy" style="font-size: 3rem; color: #ffd700;"></i>
                <h3 style="margin-top: 12px;">Game Selesai! ${emoji}</h3>
                <div class="quiz-score" style="margin-top: 16px;">
                    <div style="font-size: 2rem; font-weight: bold;">${score}/${currentQuestions.length}</div>
                    <div>${Math.round(percentage)}%</div>
                </div>
                <p style="margin-top: 16px;">${message}</p>
                <button class="btn-primary" onclick="restartGame()" style="margin-top: 16px;">🔄 Main Lagi</button>
                <button class="btn-secondary" onclick="clearResult()">📋 Kembali ke Menu</button>
            </div>
        </div>
    `;
    
    scrollToBottom();
}

// ========== TAMPILKAN SOAL JAWABAN SINGKAT ==========
function showAnswerQuestion() {
    if (currentIndex >= currentQuestions.length) {
        showAnswerResult();
        return;
    }
    
    const q = currentQuestions[currentIndex];
    const resultArea = document.getElementById('resultArea');
    resultArea.style.display = 'block';
    
    resultArea.innerHTML = `
        <div class="quiz-card">
            <div class="quiz-header">
                <span class="quiz-game-title"><i class="fas ${currentGame.icon}"></i> ${escapeHtml(currentGame.name)}</span>
                <span class="quiz-progress">${currentIndex + 1}/${currentQuestions.length}</span>
            </div>
            <div class="quiz-question">
                ${escapeHtml(q.question)}
                ${q.hint ? `<div class="quiz-hint"><i class="fas fa-lightbulb"></i> Petunjuk: ${escapeHtml(q.hint)}</div>` : ''}
            </div>
            <div class="answer-input-area">
                <input type="text" id="answerInput" placeholder="Ketik jawabanmu..." autocomplete="off">
                <button class="btn-primary" style="width: auto; margin-top: 0;" onclick="checkAnswer('${escapeHtml(q.answer)}')">
                    <i class="fas fa-paper-plane"></i> Jawab
                </button>
            </div>
            <div id="answerFeedback"></div>
            <div class="quiz-score">
                🎯 Score: ${score}/${currentIndex}
            </div>
        </div>
    `;
    
    const input = document.getElementById('answerInput');
    if (input) {
        input.focus();
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAnswer(q.answer);
            }
        });
    }
    
    scrollToBottom();
}

function checkAnswer(correctAnswer) {
    const input = document.getElementById('answerInput');
    const userAnswer = input.value.trim().toLowerCase();
    const feedbackDiv = document.getElementById('answerFeedback');
    
    const isCorrect = userAnswer === correctAnswer.toLowerCase();
    
    if (isCorrect) {
        score++;
        feedbackDiv.innerHTML = `<div class="quiz-feedback correct">✅ Benar! +1 poin</div>`;
    } else {
        feedbackDiv.innerHTML = `<div class="quiz-feedback wrong">❌ Salah! Jawaban: ${escapeHtml(correctAnswer)}</div>`;
    }
    
    input.disabled = true;
    const jawabBtn = document.querySelector('.answer-input-area button');
    if (jawabBtn) jawabBtn.disabled = true;
    
    document.querySelector('.quiz-score').innerHTML = `🎯 Score: ${score}/${currentIndex + 1}`;
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-primary';
    nextBtn.innerHTML = currentIndex + 1 >= currentQuestions.length ? '🏆 Lihat Hasil' : '➡️ Soal Selanjutnya';
    nextBtn.onclick = () => {
        if (currentIndex + 1 >= currentQuestions.length) {
            showAnswerResult();
        } else {
            currentIndex++;
            showAnswerQuestion();
        }
    };
    document.querySelector('.quiz-card').appendChild(nextBtn);
}

function showAnswerResult() {
    const resultArea = document.getElementById('resultArea');
    const percentage = (score / currentQuestions.length) * 100;
    let message = '';
    let emoji = '';
    
    if (percentage >= 90) {
        message = '🏆 HEBAT! Kamu sangat pintar!';
        emoji = '🌟';
    } else if (percentage >= 70) {
        message = '🎉 KERJA BAGUS! Terus belajar!';
        emoji = '📚';
    } else if (percentage >= 50) {
        message = '👍 BAGUS! Lumayan, tingkatkan lagi!';
        emoji = '💪';
    } else if (percentage >= 30) {
        message = '📖 Cukup, coba lagi ya!';
        emoji = '🎯';
    } else {
        message = '💪 Tetap semangat! Coba lagi!';
        emoji = '🔥';
    }
    
    resultArea.innerHTML = `
        <div class="quiz-card">
            <div style="text-align: center;">
                <i class="fas fa-trophy" style="font-size: 3rem; color: #ffd700;"></i>
                <h3 style="margin-top: 12px;">Game Selesai! ${emoji}</h3>
                <div class="quiz-score" style="margin-top: 16px;">
                    <div style="font-size: 2rem; font-weight: bold;">${score}/${currentQuestions.length}</div>
                    <div>${Math.round(percentage)}%</div>
                </div>
                <p style="margin-top: 16px;">${message}</p>
                <button class="btn-primary" onclick="restartGame()" style="margin-top: 16px;">🔄 Main Lagi</button>
                <button class="btn-secondary" onclick="clearResult()">📋 Kembali ke Menu</button>
            </div>
        </div>
    `;
    
    scrollToBottom();
}

function restartGame() {
    fetchQuestions(currentGame);
}

function clearResult() {
    const resultArea = document.getElementById('resultArea');
    if (resultArea) resultArea.style.display = 'none';
    currentGame = null;
    currentQuestions = [];
    currentIndex = 0;
    score = 0;
}

function showResult(type, data, title) {
    const resultArea = document.getElementById('resultArea');
    resultArea.style.display = 'block';
    
    let html = `<h3 style="margin-bottom: 12px;"><i class="fas fa-info-circle"></i> ${escapeHtml(title)}</h3>`;
    
    if (type === 'error') {
        html += `<div style="background: rgba(255, 68, 68, 0.2); padding: 16px; border-radius: 16px; color: #ff6666;">❌ Error: ${escapeHtml(data)}</div>`;
        html += `<button class="btn-secondary" onclick="clearResult()" style="margin-top: 12px;">Kembali</button>`;
    }
    
    resultArea.innerHTML = html;
}

// ========== GO BACK ==========
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

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderGames();
    console.log('🎮 Games Zone siap! 8 games tersedia dengan API + fallback data');
});

// Expose functions ke global
window.checkQuizAnswer = checkQuizAnswer;
window.nextQuizQuestion = nextQuizQuestion;
window.checkAnswer = checkAnswer;
window.restartGame = restartGame;
window.clearResult = clearResult;
window.goBack = goBack;