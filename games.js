// ========== GAMES ZONE PAGE SCRIPT - SUPER SMOOTH & LENGKAP ==========

// 8 GAMES LENGKAP
const games = [
    { name: "Asah Otak", desc: "Tingkatkan ketajaman otakmu", icon: "fa-brain", cmd: "asahotak", needQuery: false, api: "https://api.skylow.web.id/api/games/asahotak", gameType: "quiz" },
    { name: "Islamic Quiz", desc: "Uji pengetahuan Islammu", icon: "fa-mosque", cmd: "islamicquiz", needQuery: false, api: "https://api.skylow.web.id/api/games/islamicquiz", gameType: "quiz" },
    { name: "Siapakah Aku?", desc: "Tebak tokoh dari deskripsi", icon: "fa-question-circle", cmd: "siapakahaku", needQuery: false, api: "https://api.skylow.web.id/api/games/siapakahaku", gameType: "answer" },
    { name: "Susun Kata", desc: "Susun huruf jadi kata", icon: "fa-font", cmd: "susunkata", needQuery: false, api: "https://api.skylow.web.id/api/games/susunkata", gameType: "answer" },
    { name: "Tebak Kimia", desc: "Tebak unsur kimia", icon: "fa-flask", cmd: "tebakkimia", needQuery: false, api: "https://api.skylow.web.id/api/games/tebakkimia", gameType: "answer" },
    { name: "Tebak Lirik", desc: "Tebak lagu dari lirik", icon: "fa-music", cmd: "tebaklirik", needQuery: false, api: "https://api.skylow.web.id/api/games/tebaklirik", gameType: "answer" },
    { name: "Tebak-tebakan", desc: "Tebakan lucu dan seru", icon: "fa-smile-wink", cmd: "tebaktebakan", needQuery: false, api: "https://api.skylow.web.id/api/games/tebaktebakan", gameType: "answer" },
    { name: "Teka-teki", desc: "Pecahkan teka-teki", icon: "fa-puzzle-piece", cmd: "tekateki", needQuery: false, api: "https://api.skylow.web.id/api/games/tekateki", gameType: "answer" }
];

let currentGame = null;
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

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
    const loader = document.getElementById('loadingOverlay');
    if (show) loader.classList.add('show');
    else loader.classList.remove('show');
}

function renderGames() {
    const container = document.getElementById('gamesGrid');
    if (!container) return;
    
    container.innerHTML = games.map((game, idx) => `
        <div class="menu-card" data-cmd="${game.cmd}" style="animation-delay: ${0.05 * idx}s">
            <i class="fas ${game.icon}"></i>
            <div class="menu-name">${escapeHtml(game.name)}</div>
            <div class="menu-desc">${escapeHtml(game.desc)}</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.menu-card').forEach(card => {
        const cmd = card.getAttribute('data-cmd');
        const game = games.find(g => g.cmd === cmd);
        if (game) {
            card.onclick = () => startGame(game);
        }
    });
    
    console.log(`✅ Games Zone loaded: ${games.length} games available`);
}

async function startGame(game) {
    currentGame = game;
    currentIndex = 0;
    score = 0;
    await fetchQuestions(game);
}

async function fetchQuestions(game) {
    showLoading(true);
    
    try {
        const response = await fetch(game.api);
        const data = await response.json();
        
        if (data.status && data.result) {
            if (game.gameType === "quiz") {
                currentQuestions = parseQuizData(data.result);
                showQuizQuestion();
            } else {
                currentQuestions = parseAnswerData(data.result);
                showAnswerQuestion();
            }
        } else {
            showToast("Gagal memuat soal! Silakan coba lagi.");
            showResult('error', "Gagal memuat soal", game.name);
        }
    } catch (error) {
        console.error(error);
        showToast(`Error: ${error.message}`);
        showResult('error', error.message, game.name);
    } finally {
        showLoading(false);
    }
}

function parseQuizData(data) {
    if (Array.isArray(data)) {
        return data.map(item => ({
            question: item.question || item.soal || item.pertanyaan,
            options: item.options || item.pilihan || item.choices,
            answer: item.answer || item.jawaban
        }));
    } else if (data.question) {
        return [{
            question: data.question,
            options: data.options,
            answer: data.answer
        }];
    }
    return [{
        question: "Apa ibu kota Indonesia?",
        options: ["Jakarta", "Surabaya", "Bandung", "Medan"],
        answer: "Jakarta"
    }, {
        question: "Siapa presiden pertama Indonesia?",
        options: ["Soeharto", "Soekarno", "BJ Habibie", "Megawati"],
        answer: "Soekarno"
    }, {
        question: "Apa nama benua terbesar di dunia?",
        options: ["Afrika", "Amerika", "Asia", "Eropa"],
        answer: "Asia"
    }];
}

function parseAnswerData(data) {
    if (Array.isArray(data)) {
        return data.map(item => ({
            question: item.question || item.soal || item.pertanyaan,
            answer: item.answer || item.jawaban
        }));
    } else if (data.question) {
        return [{
            question: data.question,
            answer: data.answer
        }];
    }
    return [{
        question: "Apa warna bendera Indonesia?",
        answer: "Merah Putih"
    }, {
        question: "Apa nama ibukota Jepang?",
        answer: "Tokyo"
    }, {
        question: "Siapa penemu lampu pijar?",
        answer: "Thomas Edison"
    }];
}

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
            <div class="quiz-question">
                <strong>📝 Soal ${currentIndex + 1}/${currentQuestions.length}</strong><br><br>
                ${escapeHtml(q.question)}
            </div>
            ${optionsHtml}
            <div id="quizFeedback"></div>
            <div id="quizNextBtn"></div>
        </div>
        <div class="quiz-score">
            🎯 Score: ${score}/${currentIndex}
        </div>
    `;
}

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
}

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
            <div class="quiz-question">
                <strong>📝 Soal ${currentIndex + 1}/${currentQuestions.length}</strong><br><br>
                ${escapeHtml(q.question)}
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderGames();
    console.log('🎮 Games Zone siap! Total 8 games tersedia');
});