// ========== RPG GAME - FULL FEATURE WITH FIREBASE (FIXED) ==========

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUHSGJ2Yaet7ue1x8WLcHn6LI627SINqg",
    authDomain: "rayy-digital-store.firebaseapp.com",
    databaseURL: "https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rayy-digital-store",
    storageBucket: "rayy-digital-store.firebasestorage.app",
    messagingSenderId: "537690791174",
    appId: "1:537690791174:web:c29f7cdfcae0506b6e1287"
};

// Initialize Firebase
let database = null;

try {
    if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }
    database = firebase.database();
    console.log('✅ Firebase connected');
} catch (error) {
    console.error('Firebase init error:', error);
}

// Game Variables
let currentUser = null;
let currentUserId = null;
let playerData = null;
let battleState = null;
let battleCooldown = false;
let battleTimer = null;

// Locations Data
const locations = {
    "desa": { name: "Desa Pemula", minLevel: 1, maxLevel: 5, monsters: [1], desc: "Desa kecil yang tenang, tempat awal petualanganmu." },
    "hutan": { name: "Hutan Gelap", minLevel: 3, maxLevel: 8, monsters: [1, 2], desc: "Hutan lebat dengan pepohonan tinggi yang menutupi sinar matahari." },
    "gua": { name: "Gua Naga", minLevel: 8, maxLevel: 15, monsters: [2, 3], desc: "Gua gelap yang konon menjadi sarang makhluk legendaris." },
    "tambang": { name: "Tambang Terbengkalai", minLevel: 5, maxLevel: 20, monsters: [], desc: "Tambang tua yang ditinggalkan, menyimpan berbagai mineral berharga." }
};

// Monsters Data
const monsters = {
    "1": { name: "Goblin", hp: 30, attack: 5, defense: 2, exp: 15, gold: 10, level: 1 },
    "2": { name: "Orc", hp: 50, attack: 8, defense: 4, exp: 25, gold: 20, level: 3 },
    "3": { name: "Naga", hp: 100, attack: 15, defense: 8, exp: 60, gold: 50, level: 10 }
};

// Shop Items
const shopItems = {
    "potion": { name: "Potion", type: "heal", value: 30, price: 10, desc: "Memulihkan 30 HP" },
    "elixir": { name: "Elixir", type: "mana", value: 25, price: 15, desc: "Memulihkan 25 MP" },
    "pedang_besi": { name: "Pedang Besi", type: "weapon", attack: 5, price: 50, desc: "Attack +5" },
    "zirah_kulit": { name: "Zirah Kulit", type: "armor", defense: 3, price: 40, desc: "Defense +3" }
};

// Quests
const quests = {
    "pemburu_goblin": { title: "Pemburu Goblin", desc: "Kalahkan 5 Goblin", target: "Goblin", count: 5, rewardExp: 100, rewardGold: 50 },
    "kolektor_kulit": { title: "Kolektor Kulit", desc: "Kumpulkan 3 Kulit Goblin", target: "kulit_goblin", count: 3, rewardExp: 80, rewardGold: 70 }
};

// ========== DOM ELEMENTS ==========
let loginScreen, gameScreen, usernameInput, loginBtn;

// ========== INITIALIZATION ==========
function init() {
    // Get DOM elements
    loginScreen = document.getElementById('loginScreen');
    gameScreen = document.getElementById('gameScreen');
    usernameInput = document.getElementById('usernameInput');
    loginBtn = document.getElementById('loginBtn');
    
    // Add event listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
        console.log('✅ Login button registered');
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    }
    
    // Load theme
    loadTheme();
    
    // Check saved user
    checkSavedUser();
    
    console.log('✅ RPG Game initialized');
}

// ========== LOGIN SYSTEM ==========
async function login() {
    console.log('Login function called');
    
    if (!database) {
        showToast('Database sedang inisialisasi, coba lagi!', 'error');
        return;
    }
    
    const username = usernameInput ? usernameInput.value.trim() : '';
    
    if (!username) {
        showToast('Masukkan username!', 'error');
        return;
    }
    
    if (username.length < 3) {
        showToast('Minimal 3 karakter!', 'error');
        return;
    }
    
    // Disable button while processing
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Memproses...';
    }
    
    currentUser = username;
    currentUserId = 'rpg_' + username.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    
    // Save to localStorage
    localStorage.setItem('rpg_username', currentUser);
    localStorage.setItem('rpg_userId', currentUserId);
    
    try {
        await loadPlayerData();
    } catch (error) {
        console.error('Login error:', error);
        showToast('Gagal login: ' + error.message, 'error');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-gamepad"></i> Mulai Petualangan';
        }
    }
}

function checkSavedUser() {
    const savedUser = localStorage.getItem('rpg_username');
    const savedUserId = localStorage.getItem('rpg_userId');
    
    console.log('Checking saved user:', savedUser);
    
    if (savedUser && savedUserId && database) {
        currentUser = savedUser;
        currentUserId = savedUserId;
        loadPlayerData();
    }
}

async function loadPlayerData() {
    showToast('Memuat data petualang...', 'info');
    
    try {
        const snapshot = await database.ref(`rpg_players/${currentUserId}`).once('value');
        const data = snapshot.val();
        
        if (data) {
            playerData = data;
            updateUI();
            startGame();
        } else {
            showClassSelection();
        }
    } catch (error) {
        console.error('Error loading player:', error);
        showToast('Gagal memuat data!', 'error');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-gamepad"></i> Mulai Petualangan';
        }
    }
}

function showClassSelection() {
    // Close login screen first
    if (loginScreen) loginScreen.style.display = 'none';
    
    // Remove existing modal if any
    const existingModal = document.getElementById('classModal');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div id="classModal" class="modal" style="display: flex; z-index: 3000;">
            <div class="modal-content" style="max-width: 350px;">
                <div class="modal-header">
                    <h3><i class="fas fa-hat-wizard"></i> Pilih Class</h3>
                    <button class="modal-close" onclick="closeClassModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div class="action-card" onclick="createPlayer('warrior')" style="display: flex; align-items: center; gap: 12px; padding: 12px;">
                            <i class="fas fa-shield-alt" style="font-size: 1.8rem;"></i>
                            <div style="text-align: left;">
                                <strong>Warrior</strong>
                                <small style="display: block;">HP & Defense tinggi</small>
                            </div>
                        </div>
                        <div class="action-card" onclick="createPlayer('mage')" style="display: flex; align-items: center; gap: 12px; padding: 12px;">
                            <i class="fas fa-magic" style="font-size: 1.8rem;"></i>
                            <div style="text-align: left;">
                                <strong>Mage</strong>
                                <small style="display: block;">Magic attack kuat</small>
                            </div>
                        </div>
                        <div class="action-card" onclick="createPlayer('archer')" style="display: flex; align-items: center; gap: 12px; padding: 12px;">
                            <i class="fas fa-bow-arrow" style="font-size: 1.8rem;"></i>
                            <div style="text-align: left;">
                                <strong>Archer</strong>
                                <small style="display: block;">Critical & agility tinggi</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeClassModal() {
    const modal = document.getElementById('classModal');
    if (modal) modal.remove();
    // Go back to login if class not selected
    if (loginScreen) loginScreen.style.display = 'flex';
    if (gameScreen) gameScreen.style.display = 'none';
    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-gamepad"></i> Mulai Petualangan';
    }
}

async function createPlayer(className) {
    closeClassModal();
    
    const classStats = {
        warrior: { hp: 100, mp: 30, attack: 15, defense: 10, agility: 5, skillName: "Rage Slash", skillDesc: "Damage 2.5x, -5 HP, -15 MP" },
        mage: { hp: 60, mp: 100, attack: 20, defense: 5, agility: 8, skillName: "Fireball", skillDesc: "Damage 2x, -20 MP" },
        archer: { hp: 80, mp: 50, attack: 12, defense: 7, agility: 15, skillName: "Precision Shot", skillDesc: "Critical 75%, -15 MP" }
    };
    
    const stats = classStats[className];
    
    playerData = {
        username: currentUser,
        class: className,
        level: 1,
        exp: 0,
        expToNext: 100,
        maxHp: stats.hp,
        hp: stats.hp,
        maxMp: stats.mp,
        mp: stats.mp,
        attack: stats.attack,
        defense: stats.defense,
        agility: stats.agility,
        skillName: stats.skillName,
        skillDesc: stats.skillDesc,
        gold: 50,
        inventory: { "potion": 3 },
        equipment: { weapon: null, armor: null },
        location: "desa",
        lastDaily: 0,
        pvpWins: 0,
        pvpLosses: 0,
        quests: {},
        createdAt: Date.now()
    };
    
    try {
        await database.ref(`rpg_players/${currentUserId}`).set(playerData);
        updateUI();
        startGame();
        showToast(`🎉 Selamat datang, ${className.toUpperCase()}!`, 'success');
    } catch (error) {
        console.error('Error creating player:', error);
        showToast('Gagal membuat karakter!', 'error');
    }
}

function startGame() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (gameScreen) gameScreen.style.display = 'block';
    
    // Re-get DOM elements after game screen shown
    refreshUIData();
    
    updateUI();
    console.log('🎮 Game started for:', currentUser);
}

function refreshUIData() {
    // Re-get DOM elements that might have been recreated
    document.getElementById('headerUsername').innerText = playerData?.username || 'Loading...';
    document.getElementById('headerLevel').innerText = `Lv ${playerData?.level || 1}`;
    document.getElementById('playerName').innerText = playerData?.username || '-';
    document.getElementById('playerClass').innerText = playerData?.class?.toUpperCase() || '-';
    document.getElementById('playerGold').innerText = formatGold(playerData?.gold || 0);
}

function updateUI() {
    if (!playerData) return;
    
    // Header
    const headerUsername = document.getElementById('headerUsername');
    const headerLevel = document.getElementById('headerLevel');
    if (headerUsername) headerUsername.innerText = playerData.username;
    if (headerLevel) headerLevel.innerText = `Lv ${playerData.level}`;
    
    // Stats Card
    const playerName = document.getElementById('playerName');
    const playerClass = document.getElementById('playerClass');
    const playerGold = document.getElementById('playerGold');
    if (playerName) playerName.innerText = playerData.username;
    if (playerClass) playerClass.innerText = playerData.class.toUpperCase();
    if (playerGold) playerGold.innerText = formatGold(playerData.gold);
    
    // HP Bar
    const hpPercent = (playerData.hp / playerData.maxHp) * 100;
    const mpPercent = (playerData.mp / playerData.maxMp) * 100;
    const expPercent = (playerData.exp / playerData.expToNext) * 100;
    
    const hpBar = document.getElementById('hpBar');
    const mpBar = document.getElementById('mpBar');
    const expBar = document.getElementById('expBar');
    if (hpBar) hpBar.style.width = `${Math.max(0, hpPercent)}%`;
    if (mpBar) mpBar.style.width = `${Math.max(0, mpPercent)}%`;
    if (expBar) expBar.style.width = `${Math.max(0, expPercent)}%`;
    
    const hpText = document.getElementById('hpText');
    const mpText = document.getElementById('mpText');
    const expText = document.getElementById('expText');
    if (hpText) hpText.innerText = `${playerData.hp}/${playerData.maxHp}`;
    if (mpText) mpText.innerText = `${playerData.mp}/${playerData.maxMp}`;
    if (expText) expText.innerText = `${playerData.exp}/${playerData.expToNext}`;
    
    const playerAttack = document.getElementById('playerAttack');
    const playerDefense = document.getElementById('playerDefense');
    const playerAgility = document.getElementById('playerAgility');
    const playerPvp = document.getElementById('playerPvp');
    if (playerAttack) playerAttack.innerText = getTotalAttack();
    if (playerDefense) playerDefense.innerText = getTotalDefense();
    if (playerAgility) playerAgility.innerText = playerData.agility;
    if (playerPvp) playerPvp.innerText = `${playerData.pvpWins || 0}/${playerData.pvpLosses || 0}`;
    
    const location = locations[playerData.location] || locations['desa'];
    const currentLocation = document.getElementById('currentLocation');
    const locationDesc = document.getElementById('locationDesc');
    if (currentLocation) currentLocation.innerText = location.name;
    if (locationDesc) locationDesc.innerText = location.desc;
}

function getTotalAttack() {
    let total = playerData.attack;
    if (playerData.equipment?.weapon && shopItems[playerData.equipment.weapon]) {
        total += shopItems[playerData.equipment.weapon].attack || 0;
    }
    return total;
}

function getTotalDefense() {
    let total = playerData.defense;
    if (playerData.equipment?.armor && shopItems[playerData.equipment.armor]) {
        total += shopItems[playerData.equipment.armor].defense || 0;
    }
    return total;
}

function formatGold(amount) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}jt`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}rb`;
    return amount.toString();
}

// ========== EXPLORE & BATTLE ==========
async function explore() {
    if (battleCooldown) {
        showToast('Kamu masih kelelahan! Tunggu sebentar.', 'error');
        return;
    }
    
    const location = locations[playerData.location];
    if (!location.monsters || location.monsters.length === 0) {
        showToast('Tidak ada monster di sini! Coba pindah lokasi.', 'error');
        return;
    }
    
    const monsterId = location.monsters[Math.floor(Math.random() * location.monsters.length)];
    const monster = { ...monsters[monsterId], id: monsterId };
    
    battleState = {
        inBattle: true,
        monster: monster,
        monsterCurrentHp: monster.hp,
        playerCurrentHp: playerData.hp,
        playerCurrentMp: playerData.mp
    };
    
    const battleEnemyName = document.getElementById('battleEnemyName');
    const battleEnemyHp = document.getElementById('battleEnemyHp');
    const battleEnemyHpFill = document.getElementById('battleEnemyHpFill');
    const battlePlayerName = document.getElementById('battlePlayerName');
    const battlePlayerHp = document.getElementById('battlePlayerHp');
    const battlePlayerHpFill = document.getElementById('battlePlayerHpFill');
    const battleLog = document.getElementById('battleLog');
    
    if (battleEnemyName) battleEnemyName.innerText = monster.name;
    if (battleEnemyHp) battleEnemyHp.innerText = `${monster.hp}/${monster.hp}`;
    if (battleEnemyHpFill) battleEnemyHpFill.style.width = '100%';
    if (battlePlayerName) battlePlayerName.innerText = playerData.username;
    if (battlePlayerHp) battlePlayerHp.innerText = `${playerData.hp}/${playerData.maxHp}`;
    if (battlePlayerHpFill) battlePlayerHpFill.style.width = `${(playerData.hp / playerData.maxHp) * 100}%`;
    if (battleLog) battleLog.innerHTML = '<p>⚔️ Pertempuran dimulai! Pilih aksimu.</p>';
    
    const battleModal = document.getElementById('battleModal');
    if (battleModal) battleModal.style.display = 'flex';
    
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) {
        if (playerData.mp < getSkillMpCost()) {
            skillBtn.style.opacity = '0.5';
            skillBtn.disabled = true;
        } else {
            skillBtn.style.opacity = '1';
            skillBtn.disabled = false;
        }
    }
}

function getSkillMpCost() {
    if (playerData.class === 'mage') return 20;
    if (playerData.class === 'archer') return 15;
    return 15;
}

async function battleAttack() {
    if (!battleState) return;
    
    const playerDamage = calculateDamage(getTotalAttack(), battleState.monster.defense);
    battleState.monsterCurrentHp -= playerDamage;
    
    let log = `<p>🗡️ Kamu menyerang ${battleState.monster.name}! Damage: ${playerDamage}</p>`;
    
    if (battleState.monsterCurrentHp <= 0) {
        const battleLog = document.getElementById('battleLog');
        if (battleLog) battleLog.innerHTML += log;
        await battleVictory();
        return;
    }
    
    const monsterDamage = calculateDamage(battleState.monster.attack, getTotalDefense());
    battleState.playerCurrentHp -= monsterDamage;
    
    log += `<p>🛡️ ${battleState.monster.name} menyerang balik! Damage: ${monsterDamage}</p>`;
    
    updateBattleUI();
    const battleLog = document.getElementById('battleLog');
    if (battleLog) {
        battleLog.innerHTML += log;
        battleLog.scrollTop = battleLog.scrollHeight;
    }
    
    if (battleState.playerCurrentHp <= 0) {
        await battleDefeat();
    }
}

async function battleSkill() {
    if (!battleState) return;
    
    const mpCost = getSkillMpCost();
    if (battleState.playerCurrentMp < mpCost) {
        showToast('MP tidak cukup!', 'error');
        return;
    }
    
    battleState.playerCurrentMp -= mpCost;
    let skillDamage = 0;
    let log = `<p>✨ ${playerData.skillName} ✨</p>`;
    
    if (playerData.class === 'warrior') {
        skillDamage = Math.floor(getTotalAttack() * 2.5);
        battleState.playerCurrentHp -= 5;
        log += `<p>💥 RAGE SLASH! Damage: ${skillDamage} ke ${battleState.monster.name}! (-5 HP)</p>`;
    } else if (playerData.class === 'mage') {
        skillDamage = Math.floor(getTotalAttack() * 2);
        log += `<p>🔥 FIREBALL! Damage: ${skillDamage} ke ${battleState.monster.name}!</p>`;
    } else {
        const isCritical = Math.random() < 0.75;
        skillDamage = calculateDamage(getTotalAttack(), battleState.monster.defense);
        if (isCritical) skillDamage *= 2;
        log += `<p>🏹 PRECISION SHOT! Damage: ${skillDamage} ke ${battleState.monster.name}! ${isCritical ? '(Critical!)' : ''}</p>`;
    }
    
    battleState.monsterCurrentHp -= skillDamage;
    
    if (battleState.monsterCurrentHp <= 0) {
        const battleLog = document.getElementById('battleLog');
        if (battleLog) battleLog.innerHTML += log;
        await battleVictory();
        return;
    }
    
    const monsterDamage = calculateDamage(battleState.monster.attack, getTotalDefense());
    battleState.playerCurrentHp -= monsterDamage;
    log += `<p>🛡️ ${battleState.monster.name} menyerang balik! Damage: ${monsterDamage}</p>`;
    
    updateBattleUI();
    const battleLog = document.getElementById('battleLog');
    if (battleLog) {
        battleLog.innerHTML += log;
        battleLog.scrollTop = battleLog.scrollHeight;
    }
    
    if (battleState.playerCurrentHp <= 0) {
        await battleDefeat();
    }
}

function battleUseItem() {
    if (!battleState) return;
    
    if (!playerData.inventory?.potion || playerData.inventory.potion < 1) {
        showToast('Tidak memiliki Potion!', 'error');
        return;
    }
    
    const healAmount = 30;
    battleState.playerCurrentHp = Math.min(playerData.maxHp, battleState.playerCurrentHp + healAmount);
    playerData.inventory.potion--;
    
    let log = `<p>🧪 Menggunakan Potion! HP pulih ${healAmount}!</p>`;
    
    const monsterDamage = calculateDamage(battleState.monster.attack, getTotalDefense());
    battleState.playerCurrentHp -= monsterDamage;
    log += `<p>🛡️ ${battleState.monster.name} menyerang! Damage: ${monsterDamage}</p>`;
    
    updateBattleUI();
    const battleLog = document.getElementById('battleLog');
    if (battleLog) {
        battleLog.innerHTML += log;
        battleLog.scrollTop = battleLog.scrollHeight;
    }
    
    if (battleState.playerCurrentHp <= 0) {
        battleDefeat();
    }
}

async function battleFlee() {
    if (!battleState) return;
    
    const fleeChance = Math.min(0.8, playerData.agility / 100);
    if (Math.random() < fleeChance) {
        showToast('Berhasil kabur!', 'success');
        closeBattleModal();
    } else {
        const monsterDamage = calculateDamage(battleState.monster.attack, getTotalDefense());
        battleState.playerCurrentHp -= monsterDamage;
        updateBattleUI();
        const battleLog = document.getElementById('battleLog');
        if (battleLog) battleLog.innerHTML += `<p>❌ Gagal kabur! ${battleState.monster.name} menyerang! Damage: ${monsterDamage}</p>`;
        
        if (battleState.playerCurrentHp <= 0) {
            await battleDefeat();
        }
    }
}

function calculateDamage(attack, defense) {
    return Math.max(1, Math.floor(attack - defense));
}

function updateBattleUI() {
    const playerHpPercent = (battleState.playerCurrentHp / playerData.maxHp) * 100;
    const enemyHpPercent = (battleState.monsterCurrentHp / battleState.monster.hp) * 100;
    
    const battlePlayerHp = document.getElementById('battlePlayerHp');
    const battlePlayerHpFill = document.getElementById('battlePlayerHpFill');
    const battleEnemyHp = document.getElementById('battleEnemyHp');
    const battleEnemyHpFill = document.getElementById('battleEnemyHpFill');
    
    if (battlePlayerHp) battlePlayerHp.innerText = `${Math.max(0, battleState.playerCurrentHp)}/${playerData.maxHp}`;
    if (battlePlayerHpFill) battlePlayerHpFill.style.width = `${Math.max(0, playerHpPercent)}%`;
    if (battleEnemyHp) battleEnemyHp.innerText = `${Math.max(0, battleState.monsterCurrentHp)}/${battleState.monster.hp}`;
    if (battleEnemyHpFill) battleEnemyHpFill.style.width = `${Math.max(0, enemyHpPercent)}%`;
}

async function battleVictory() {
    const goldReward = battleState.monster.gold;
    const expReward = battleState.monster.exp;
    
    playerData.gold += goldReward;
    playerData.exp += expReward;
    
    let leveledUp = false;
    while (playerData.exp >= playerData.expToNext) {
        playerData.exp -= playerData.expToNext;
        playerData.level++;
        playerData.expToNext = Math.floor(playerData.expToNext * 1.5);
        playerData.maxHp += 10;
        playerData.maxMp += 5;
        playerData.attack += 2;
        playerData.defense += 1;
        playerData.agility += 1;
        leveledUp = true;
    }
    
    playerData.hp = playerData.maxHp;
    playerData.mp = playerData.maxMp;
    
    await savePlayerData();
    
    let log = `<p>🎉 VICTORY! 🎉</p><p>💰 +${goldReward} Gold</p><p>⭐ +${expReward} EXP</p>`;
    if (leveledUp) log += `<p>🎊 LEVEL UP! Sekarang Level ${playerData.level}! 🎊</p>`;
    
    const battleLog = document.getElementById('battleLog');
    if (battleLog) battleLog.innerHTML += log;
    updateUI();
    
    setBattleCooldown();
    
    setTimeout(() => {
        closeBattleModal();
        showToast(`Kemenangan! +${goldReward} Gold, +${expReward} EXP`, 'success');
    }, 2000);
}

async function battleDefeat() {
    playerData.hp = Math.floor(playerData.maxHp / 2);
    const goldLost = Math.floor(playerData.gold * 0.1);
    playerData.gold -= goldLost;
    
    await savePlayerData();
    
    const battleLog = document.getElementById('battleLog');
    if (battleLog) battleLog.innerHTML += `<p>💀 KAMU KALAH! 💀</p><p>💔 HP terisi setengah</p><p>💰 Uang berkurang ${formatGold(goldLost)}</p>`;
    updateUI();
    
    setBattleCooldown();
    
    setTimeout(() => {
        closeBattleModal();
        showToast(`Kalah! Uang berkurang ${formatGold(goldLost)}`, 'error');
    }, 2000);
}

function setBattleCooldown() {
    battleCooldown = true;
    if (battleTimer) clearTimeout(battleTimer);
    battleTimer = setTimeout(() => {
        battleCooldown = false;
        showToast('Kamu sudah pulih! Bisa bertarung lagi.', 'success');
    }, 20000);
}

function closeBattleModal() {
    battleState = null;
    const battleModal = document.getElementById('battleModal');
    if (battleModal) battleModal.style.display = 'none';
}

// ========== INVENTORY ==========
function showInventory() {
    const container = document.getElementById('inventoryList');
    if (!playerData.inventory || Object.keys(playerData.inventory).length === 0) {
        if (container) container.innerHTML = '<div style="text-align:center;padding:20px;">Inventory kosong</div>';
    } else {
        if (container) {
            container.innerHTML = Object.entries(playerData.inventory).map(([itemId, qty]) => {
                const item = shopItems[itemId];
                if (!item) return '';
                return `
                    <div class="inventory-item">
                        <div>
                            <div class="item-name">${item.name}</div>
                            <div class="item-desc">${item.desc || ''}</div>
                        </div>
                        <div class="item-quantity">x${qty}</div>
                        <button class="use-btn" onclick="useItem('${itemId}')">Gunakan</button>
                    </div>
                `;
            }).join('');
        }
    }
    const inventoryModal = document.getElementById('inventoryModal');
    if (inventoryModal) inventoryModal.style.display = 'flex';
}

function useItem(itemId) {
    const item = shopItems[itemId];
    if (!item) return;
    
    if (item.type === 'heal') {
        if (playerData.hp >= playerData.maxHp) {
            showToast('HP sudah penuh!', 'error');
            return;
        }
        playerData.hp = Math.min(playerData.maxHp, playerData.hp + item.value);
        showToast(`❤️ HP pulih ${item.value}!`, 'success');
    } else if (item.type === 'mana') {
        if (playerData.mp >= playerData.maxMp) {
            showToast('MP sudah penuh!', 'error');
            return;
        }
        playerData.mp = Math.min(playerData.maxMp, playerData.mp + item.value);
        showToast(`🔵 MP pulih ${item.value}!`, 'success');
    } else if (item.type === 'weapon') {
        if (playerData.equipment.weapon === itemId) {
            showToast('Sudah memakai senjata ini!', 'error');
            return;
        }
        if (playerData.equipment.weapon) {
            const oldWeapon = playerData.equipment.weapon;
            playerData.inventory[oldWeapon] = (playerData.inventory[oldWeapon] || 0) + 1;
        }
        playerData.equipment.weapon = itemId;
        playerData.inventory[itemId]--;
        showToast(`⚔️ ${item.name} dipasang!`, 'success');
    } else if (item.type === 'armor') {
        if (playerData.equipment.armor === itemId) {
            showToast('Sudah memakai zirah ini!', 'error');
            return;
        }
        if (playerData.equipment.armor) {
            const oldArmor = playerData.equipment.armor;
            playerData.inventory[oldArmor] = (playerData.inventory[oldArmor] || 0) + 1;
        }
        playerData.equipment.armor = itemId;
        playerData.inventory[itemId]--;
        showToast(`🛡️ ${item.name} dipasang!`, 'success');
    }
    
    if (playerData.inventory[itemId] <= 0) delete playerData.inventory[itemId];
    savePlayerData();
    updateUI();
    showInventory();
}

function closeInventoryModal() {
    const inventoryModal = document.getElementById('inventoryModal');
    if (inventoryModal) inventoryModal.style.display = 'none';
}

// ========== SHOP ==========
function showShop() {
    const container = document.getElementById('shopList');
    if (container) {
        container.innerHTML = Object.entries(shopItems).map(([id, item]) => `
            <div class="shop-item">
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.desc || ''}</div>
                </div>
                <div class="item-price">💰 ${item.price}</div>
                <button class="buy-btn" onclick="buyItem('${id}')">Beli</button>
            </div>
        `).join('');
    }
    const shopModal = document.getElementById('shopModal');
    if (shopModal) shopModal.style.display = 'flex';
}

async function buyItem(itemId) {
    const item = shopItems[itemId];
    if (!item) return;
    
    if (playerData.gold < item.price) {
        showToast('Gold tidak cukup!', 'error');
        return;
    }
    
    playerData.gold -= item.price;
    if (!playerData.inventory) playerData.inventory = {};
    playerData.inventory[itemId] = (playerData.inventory[itemId] || 0) + 1;
    
    await savePlayerData();
    updateUI();
    showToast(`✅ Membeli ${item.name}!`, 'success');
    showShop();
}

function closeShopModal() {
    const shopModal = document.getElementById('shopModal');
    if (shopModal) shopModal.style.display = 'none';
}

// ========== QUEST ==========
function showQuest() {
    const container = document.getElementById('questList');
    if (container) {
        container.innerHTML = Object.entries(quests).map(([id, quest]) => `
            <div class="quest-item">
                <div>
                    <div class="item-name">${quest.title}</div>
                    <div class="item-desc">${quest.desc}</div>
                    <small>Hadiah: ${quest.rewardExp} EXP + ${quest.rewardGold} Gold</small>
                </div>
                <button class="quest-take-btn" onclick="takeQuest('${id}')">Ambil</button>
            </div>
        `).join('');
    }
    const questModal = document.getElementById('questModal');
    if (questModal) questModal.style.display = 'flex';
}

function takeQuest(questId) {
    if (playerData.quests?.[questId]?.completed) {
        showToast('Quest sudah selesai!', 'error');
        return;
    }
    if (playerData.quests?.[questId]?.active) {
        showToast('Quest sudah diambil!', 'error');
        return;
    }
    
    if (!playerData.quests) playerData.quests = {};
    playerData.quests[questId] = { active: true, progress: 0 };
    savePlayerData();
    showToast(`Quest "${quests[questId].title}" diambil!`, 'success');
}

function closeQuestModal() {
    const questModal = document.getElementById('questModal');
    if (questModal) questModal.style.display = 'none';
}

// ========== HEAL ==========
async function heal() {
    if (playerData.gold < 20) {
        showToast('Gold tidak cukup! Butuh 20 gold untuk istirahat.', 'error');
        return;
    }
    
    playerData.gold -= 20;
    playerData.hp = playerData.maxHp;
    playerData.mp = playerData.maxMp;
    await savePlayerData();
    updateUI();
    showToast('💤 Istirahat selesai! HP dan MP pulih penuh.', 'success');
}

// ========== DAILY REWARD ==========
async function dailyReward() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (playerData.lastDaily && (now - playerData.lastDaily) < oneDay) {
        const remaining = oneDay - (now - playerData.lastDaily);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        showToast(`Claim lagi dalam ${hours} jam!`, 'error');
        return;
    }
    
    const rewardGold = 100 + (playerData.level * 10);
    const rewardExp = 50 + (playerData.level * 5);
    
    playerData.gold += rewardGold;
    playerData.exp += rewardExp;
    playerData.lastDaily = now;
    
    while (playerData.exp >= playerData.expToNext) {
        playerData.exp -= playerData.expToNext;
        playerData.level++;
        playerData.expToNext = Math.floor(playerData.expToNext * 1.5);
        playerData.maxHp += 10;
        playerData.maxMp += 5;
        playerData.attack += 2;
        playerData.defense += 1;
        playerData.agility += 1;
    }
    
    await savePlayerData();
    updateUI();
    showToast(`🎁 Daily Reward! +${rewardGold} Gold, +${rewardExp} EXP`, 'success');
}

// ========== WORK ==========
async function doWork() {
    const results = [
        { name: "Lembur dapat bonus", exp: 15, gold: 80, hp: -8 },
        { name: "Kerja santai, gaji standar", exp: 10, gold: 50, hp: -5 },
        { name: "Dimarahi bos", exp: 5, gold: 30, hp: -10 }
    ];
    const result = results[Math.floor(Math.random() * results.length)];
    
    playerData.gold += result.gold;
    playerData.exp += result.exp;
    playerData.hp = Math.max(0, playerData.hp + result.hp);
    
    while (playerData.exp >= playerData.expToNext) {
        playerData.exp -= playerData.expToNext;
        playerData.level++;
        playerData.expToNext = Math.floor(playerData.expToNext * 1.5);
        playerData.maxHp += 10;
        playerData.maxMp += 5;
        playerData.attack += 2;
        playerData.defense += 1;
        playerData.agility += 1;
    }
    
    await savePlayerData();
    updateUI();
    showToast(`💼 ${result.name}! +${result.gold} Gold, +${result.exp} EXP`, 'success');
}

// ========== MINING ==========
async function doMining() {
    if (playerData.location !== 'tambang') {
        showToast('Kamu harus di Tambang Terbengkalai untuk menambang!', 'error');
        return;
    }
    
    const ores = ['Batu', 'Batu Bara', 'Bijih Besi', 'Permata'];
    const goldRewards = [5, 15, 30, 100];
    const index = Math.floor(Math.random() * ores.length);
    
    const goldGain = goldRewards[index];
    playerData.gold += goldGain;
    playerData.exp += 5;
    
    await savePlayerData();
    updateUI();
    showToast(`⛏️ Mendapatkan ${ores[index]}! +${goldGain} Gold`, 'success');
}

// ========== PVP ==========
async function showPvp() {
    try {
        const snapshot = await database.ref('rpg_players').once('value');
        const players = snapshot.val();
        const playerList = [];
        
        for (const [id, data] of Object.entries(players)) {
            if (id !== currentUserId && data.username !== playerData.username) {
                playerList.push({ id, username: data.username, level: data.level });
            }
        }
        
        const container = document.getElementById('pvpList');
        if (container) {
            if (playerList.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:20px;">Tidak ada player lain</div>';
            } else {
                container.innerHTML = playerList.map(p => `
                    <div class="pvp-item" data-username="${p.username}">
                        <div>
                            <div class="item-name">${p.username}</div>
                            <div class="item-desc">Level ${p.level}</div>
                        </div>
                        <button class="pvp-challenge-btn" onclick="challengePvp('${p.id}', '${p.username}')">Tantang</button>
                    </div>
                `).join('');
            }
        }
        const pvpModal = document.getElementById('pvpModal');
        if (pvpModal) pvpModal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading PvP:', error);
        showToast('Gagal memuat daftar player!', 'error');
    }
}

function filterPvpPlayers() {
    const search = document.getElementById('pvpSearch')?.value.toLowerCase() || '';
    const items = document.querySelectorAll('.pvp-item');
    items.forEach(item => {
        const username = item.getAttribute('data-username');
        if (username && username.toLowerCase().includes(search)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

async function challengePvp(opponentId, opponentName) {
    try {
        const snapshot = await database.ref(`rpg_players/${opponentId}`).once('value');
        const opponent = snapshot.val();
        
        if (!opponent) {
            showToast('Player tidak ditemukan!', 'error');
            return;
        }
        
        let playerCurrent = playerData.hp;
        let opponentCurrent = opponent.hp;
        let turn = playerData.agility > opponent.agility ? 'player' : 'opponent';
        let log = `⚔️ DUEL VS ${opponentName} ⚔️\n\n`;
        
        while (playerCurrent > 0 && opponentCurrent > 0) {
            if (turn === 'player') {
                const damage = Math.max(1, getTotalAttack() - getOpponentDefense(opponent));
                opponentCurrent -= damage;
                log += `🗡️ Kamu menyerang! Damage: ${damage}\n`;
                turn = 'opponent';
            } else {
                const damage = Math.max(1, getOpponentAttack(opponent) - getTotalDefense());
                playerCurrent -= damage;
                log += `🛡️ ${opponentName} menyerang! Damage: ${damage}\n`;
                turn = 'player';
            }
        }
        
        if (playerCurrent <= 0) {
            log += `\n💀 KAMU KALAH! 💀`;
            playerData.pvpLosses = (playerData.pvpLosses || 0) + 1;
            const goldStolen = Math.floor(playerData.gold * 0.05);
            playerData.gold -= goldStolen;
            log += `\n💰 Uangmu berkurang ${formatGold(goldStolen)}!`;
        } else {
            log += `\n🏆 KAMU MENANG! 🏆`;
            playerData.pvpWins = (playerData.pvpWins || 0) + 1;
            const goldStolen = Math.floor(opponent.gold * 0.05);
            playerData.gold += goldStolen;
            log += `\n💰 Kamu mendapat ${formatGold(goldStolen)} dari lawan!`;
        }
        
        playerData.hp = Math.floor(playerCurrent);
        await savePlayerData();
        updateUI();
        
        showToast(log, 'info');
        closePvpModal();
    } catch (error) {
        console.error('PvP error:', error);
        showToast('Gagal melakukan PvP!', 'error');
    }
}

function getOpponentAttack(opponent) {
    let attack = opponent.attack;
    if (opponent.equipment?.weapon && shopItems[opponent.equipment.weapon]) {
        attack += shopItems[opponent.equipment.weapon].attack || 0;
    }
    return attack;
}

function getOpponentDefense(opponent) {
    let defense = opponent.defense;
    if (opponent.equipment?.armor && shopItems[opponent.equipment.armor]) {
        defense += shopItems[opponent.equipment.armor].defense || 0;
    }
    return defense;
}

function closePvpModal() {
    const pvpModal = document.getElementById('pvpModal');
    if (pvpModal) pvpModal.style.display = 'none';
}

// ========== LEADERBOARD ==========
async function loadLeaderboard(type) {
    try {
        const snapshot = await database.ref('rpg_players').once('value');
        const players = snapshot.val();
        const playerList = [];
        
        for (const [id, data] of Object.entries(players)) {
            playerList.push({
                username: data.username,
                level: data.level,
                gold: data.gold,
                pvpWins: data.pvpWins || 0
            });
        }
        
        if (type === 'level') playerList.sort((a,b) => b.level - a.level);
        else if (type === 'gold') playerList.sort((a,b) => b.gold - a.gold);
        else playerList.sort((a,b) => b.pvpWins - a.pvpWins);
        
        const container = document.getElementById('leaderboardList');
        if (container) {
            container.innerHTML = playerList.slice(0, 10).map((p, i) => `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">${i + 1}</div>
                    <div>
                        <div class="item-name">${p.username}</div>
                        ${type === 'level' ? `<div class="item-desc">Level ${p.level}</div>` : ''}
                        ${type === 'gold' ? `<div class="item-desc">💰 ${formatGold(p.gold)}</div>` : ''}
                        ${type === 'pvp' ? `<div class="item-desc">⚔️ ${p.pvpWins} Menang</div>` : ''}
                    </div>
                </div>
            `).join('');
        }
        
        // Update active tab
        document.querySelectorAll('.lb-tab').forEach(btn => btn.classList.remove('active'));
        const activeTab = document.querySelector(`.lb-tab[onclick*="${type}"]`);
        if (activeTab) activeTab.classList.add('active');
        
        const leaderboardModal = document.getElementById('leaderboardModal');
        if (leaderboardModal) leaderboardModal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showToast('Gagal memuat leaderboard!', 'error');
    }
}

function closeLeaderboardModal() {
    const leaderboardModal = document.getElementById('leaderboardModal');
    if (leaderboardModal) leaderboardModal.style.display = 'none';
}

// ========== LOCATION ==========
function showLocationModal() {
    const container = document.getElementById('locationList');
    if (container) {
        container.innerHTML = Object.entries(locations).map(([id, loc]) => `
            <div class="location-item" onclick="changeLocation('${id}')">
                <div>
                    <div class="item-name">${loc.name}</div>
                    <div class="item-desc">${loc.desc}</div>
                    <small>Level ${loc.minLevel}-${loc.maxLevel}</small>
                </div>
                <i class="fas fa-chevron-right" style="color: var(--primary);"></i>
            </div>
        `).join('');
    }
    const locationModal = document.getElementById('locationModal');
    if (locationModal) locationModal.style.display = 'flex';
}

async function changeLocation(locationId) {
    const location = locations[locationId];
    if (playerData.level < location.minLevel) {
        showToast(`Level minimal ${location.minLevel} untuk masuk ${location.name}!`, 'error');
        return;
    }
    
    playerData.location = locationId;
    await savePlayerData();
    updateUI();
    closeLocationModal();
    showToast(`📍 Berpindah ke ${location.name}`, 'success');
}

function closeLocationModal() {
    const locationModal = document.getElementById('locationModal');
    if (locationModal) locationModal.style.display = 'none';
}

// ========== SAVE DATA ==========
async function savePlayerData() {
    if (!playerData || !database) return;
    
    try {
        await database.ref(`rpg_players/${currentUserId}`).update({
            username: playerData.username,
            class: playerData.class,
            level: playerData.level,
            exp: playerData.exp,
            expToNext: playerData.expToNext,
            maxHp: playerData.maxHp,
            hp: playerData.hp,
            maxMp: playerData.maxMp,
            mp: playerData.mp,
            attack: playerData.attack,
            defense: playerData.defense,
            agility: playerData.agility,
            skillName: playerData.skillName,
            skillDesc: playerData.skillDesc,
            gold: playerData.gold,
            inventory: playerData.inventory,
            equipment: playerData.equipment,
            location: playerData.location,
            lastDaily: playerData.lastDaily,
            pvpWins: playerData.pvpWins,
            pvpLosses: playerData.pvpLosses,
            quests: playerData.quests,
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error('Error saving:', error);
    }
}

// ========== UTILITIES ==========
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

function toggleTheme() {
    if (document.body.classList.contains('light')) {
        document.body.classList.remove('light');
        localStorage.setItem('rpg_theme', 'dark');
    } else {
        document.body.classList.add('light');
        localStorage.setItem('rpg_theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('rpg_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light');
    }
}

function goBackToTools() {
    if (window.GlobalMusic && window.GlobalMusic.saveState) {
        window.GlobalMusic.saveState();
    }
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = 'tools.html';
    }, 200);
}

// ========== START ==========
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// ========== EXPORT GLOBAL FUNCTIONS ==========
window.login = login;
window.explore = explore;
window.showInventory = showInventory;
window.showShop = showShop;
window.showQuest = showQuest;
window.heal = heal;
window.dailyReward = dailyReward;
window.showLeaderboard = () => loadLeaderboard('level');
window.showPvp = showPvp;
window.doWork = doWork;
window.doMining = doMining;
window.battleAttack = battleAttack;
window.battleSkill = battleSkill;
window.battleUseItem = battleUseItem;
window.battleFlee = battleFlee;
window.closeBattleModal = closeBattleModal;
window.closeInventoryModal = closeInventoryModal;
window.closeShopModal = closeShopModal;
window.closeQuestModal = closeQuestModal;
window.closePvpModal = closePvpModal;
window.closeLeaderboardModal = closeLeaderboardModal;
window.closeLocationModal = closeLocationModal;
window.closeClassModal = closeClassModal;
window.useItem = useItem;
window.buyItem = buyItem;
window.takeQuest = takeQuest;
window.changeLocation = changeLocation;
window.filterPvpPlayers = filterPvpPlayers;
window.toggleTheme = toggleTheme;
window.goBackToTools = goBackToTools;
window.showLocationModal = showLocationModal;
window.loadLeaderboard = loadLeaderboard;
window.challengePvp = challengePvp;
window.createPlayer = createPlayer;