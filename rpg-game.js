// ========== RPG GAME - WITH PVP LINK INVITE SYSTEM ==========

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
let onlinePlayersRef = null;
let pvpInvitesRef = null;
let pvpBattlesRef = null;

function initFirebase() {
    return new Promise((resolve, reject) => {
        if (typeof firebase === 'undefined') {
            setTimeout(() => initFirebase().then(resolve).catch(reject), 500);
            return;
        }
        try {
            if (!firebase.apps || firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
            }
            database = firebase.database();
            onlinePlayersRef = database.ref('rpg_online_players');
            pvpInvitesRef = database.ref('rpg_pvp_invites');
            pvpBattlesRef = database.ref('rpg_pvp_battles');
            console.log('✅ Firebase connected');
            resolve();
        } catch (error) {
            console.error('Firebase init error:', error);
            reject(error);
        }
    });
}

// Game Variables
let currentUser = null;
let currentUserId = null;
let playerData = null;
let battleState = null;
let pvpBattleState = null;
let battleCooldown = false;
let battleTimer = null;
let currentPvpBattleId = null;
let currentPvpInviteId = null;
let onlinePlayersInterval = null;
let pvpInviteListener = null;
let pvpBattleListener = null;

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

// DOM Elements
let loginScreen, gameScreen, usernameInput, loginBtn;

// ========== INITIALIZATION ==========
async function init() {
    console.log('Initializing RPG Game...');
    
    loginScreen = document.getElementById('loginScreen');
    gameScreen = document.getElementById('gameScreen');
    usernameInput = document.getElementById('usernameInput');
    loginBtn = document.getElementById('loginBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
    }
    
    loadTheme();
    checkUrlForPvpInvite();
    
    try {
        await initFirebase();
        checkSavedUser();
        console.log('✅ RPG Game initialized');
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        showToast('Gagal terhubung ke database!', 'error');
    }
}

function checkUrlForPvpInvite() {
    const urlParams = new URLSearchParams(window.location.search);
    const invite = urlParams.get('invite');
    if (invite && invite.startsWith('pvp-invite-')) {
        const inviterUsername = invite.replace('pvp-invite-', '');
        localStorage.setItem('pending_pvp_invite', inviterUsername);
        showToast(`Tantangan PvP dari ${inviterUsername}! Login untuk bertarung.`, 'info');
    }
}

// ========== ONLINE STATUS ==========
async function updateOnlineStatus() {
    if (!currentUserId || !database) return;
    try {
        await database.ref(`rpg_online_players/${currentUserId}`).set({
            username: currentUser,
            lastSeen: Date.now(),
            level: playerData?.level || 1,
            class: playerData?.class || 'Warrior',
            hp: playerData?.hp || 100,
            maxHp: playerData?.maxHp || 100,
            attack: getTotalAttack(),
            defense: getTotalDefense()
        });
    } catch (error) {
        console.error('Error updating online status:', error);
    }
}

function startOnlineStatusUpdates() {
    if (onlinePlayersInterval) clearInterval(onlinePlayersInterval);
    onlinePlayersInterval = setInterval(() => {
        updateOnlineStatus();
        loadOnlinePlayers();
    }, 10000);
    updateOnlineStatus();
    loadOnlinePlayers();
    
    window.addEventListener('beforeunload', () => {
        if (currentUserId && database) {
            database.ref(`rpg_online_players/${currentUserId}`).remove();
        }
        if (pvpInviteListener) pvpInviteListener?.off();
        if (pvpBattleListener) pvpBattleListener?.off();
    });
}

async function loadOnlinePlayers() {
    if (!database || !currentUserId) return;
    try {
        const snapshot = await database.ref('rpg_online_players').once('value');
        const players = snapshot.val() || {};
        const now = Date.now();
        const onlinePlayers = [];
        
        for (const [id, data] of Object.entries(players)) {
            if (now - (data.lastSeen || 0) < 60000 && id !== currentUserId) {
                onlinePlayers.push({ id, username: data.username, level: data.level, class: data.class });
            } else if (now - (data.lastSeen || 0) >= 60000) {
                database.ref(`rpg_online_players/${id}`).remove();
            }
        }
        
        const container = document.getElementById('onlinePlayersList');
        const onlineCount = document.getElementById('onlineCount');
        if (onlineCount) onlineCount.innerText = onlinePlayers.length;
        
        if (container) {
            if (onlinePlayers.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:20px;">Tidak ada player online</div>';
            } else {
                container.innerHTML = onlinePlayers.map(p => `
                    <div class="online-player-item">
                        <div class="online-player-info">
                            <div class="online-dot"></div>
                            <div>
                                <div class="online-player-name">${p.username}</div>
                                <div class="online-player-level">Lv ${p.level} - ${p.class}</div>
                            </div>
                        </div>
                        <button class="invite-player-btn" onclick="sendPvpInviteToPlayer('${p.id}', '${p.username}')">
                            <i class="fas fa-link"></i> Invite
                        </button>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading online players:', error);
    }
}

// ========== PVP INVITE SYSTEM ==========
async function createPvpInviteLink() {
    if (!playerData) { showToast('Login dulu!', 'error'); return; }
    
    const now = Date.now();
    if (playerData.lastPvp && (now - playerData.lastPvp) < 300000) {
        const remaining = Math.ceil((300000 - (now - playerData.lastPvp)) / 1000);
        showToast(`Cooldown PvP! Tunggu ${remaining} detik lagi.`, 'error');
        return;
    }
    
    const inviteCode = `pvp-invite-${currentUser}-${Date.now()}`;
    const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${inviteCode}`;
    
    const inviteData = {
        inviterId: currentUserId,
        inviterName: currentUser,
        inviterLevel: playerData.level,
        inviterClass: playerData.class,
        inviterHp: playerData.hp,
        inviterMaxHp: playerData.maxHp,
        inviterMp: playerData.mp,
        inviterMaxMp: playerData.maxMp,
        inviterAttack: getTotalAttack(),
        inviterDefense: getTotalDefense(),
        inviterAgility: playerData.agility,
        code: inviteCode,
        status: 'waiting',
        createdAt: now
    };
    
    try {
        await database.ref(`rpg_pvp_invites/${inviteCode}`).set(inviteData);
        currentPvpInviteId = inviteCode;
        
        const inviteLinkInput = document.getElementById('inviteLinkInput');
        const inviteLinkContainer = document.getElementById('inviteLinkContainer');
        if (inviteLinkInput) inviteLinkInput.value = inviteLink;
        if (inviteLinkContainer) inviteLinkContainer.style.display = 'block';
        
        showToast('Link undangan PvP dibuat!', 'success');
        listenForPvpJoiner(inviteCode);
        showPvpWaitingModal(inviteLink);
    } catch (error) {
        console.error('Error creating invite:', error);
        showToast('Gagal membuat link!', 'error');
    }
}

function listenForPvpJoiner(inviteCode) {
    if (pvpInviteListener) pvpInviteListener.off();
    pvpInviteListener = database.ref(`rpg_pvp_invites/${inviteCode}`).on('value', (snapshot) => {
        const invite = snapshot.val();
        if (invite && invite.status === 'accepted' && invite.joinerId) {
            startPvpBattleWithJoiner(invite);
            pvpInviteListener.off();
            closePvpWaitingModal();
        }
    });
}

async function startPvpBattleWithJoiner(invite) {
    const battleId = Date.now() + '_pvp';
    const battleData = {
        player1Id: invite.inviterId, player1Name: invite.inviterName,
        player1Hp: invite.inviterHp, player1MaxHp: invite.inviterMaxHp,
        player1Mp: invite.inviterMp, player1MaxMp: invite.inviterMaxMp,
        player1Attack: invite.inviterAttack, player1Defense: invite.inviterDefense,
        player1Class: invite.inviterClass,
        player2Id: invite.joinerId, player2Name: invite.joinerName,
        player2Hp: invite.joinerHp, player2MaxHp: invite.joinerMaxHp,
        player2Mp: invite.joinerMp, player2MaxMp: invite.joinerMaxMp,
        player2Attack: invite.joinerAttack, player2Defense: invite.joinerDefense,
        player2Class: invite.joinerClass,
        currentTurn: invite.inviterAgility > (invite.joinerAgility || 5) ? invite.inviterId : invite.joinerId,
        status: 'active', winner: null, log: ['⚔️ PvP Pertempuran dimulai!'], timestamp: Date.now()
    };
    await database.ref(`rpg_pvp_battles/${battleId}`).set(battleData);
    closePvpArenaModal();
    startPvpBattle(battleId, battleData);
    showToast('Lawan bergabung! Pertarungan dimulai!', 'success');
}

async function joinPvpByLink() {
    const linkInput = document.getElementById('joinLinkInput');
    let link = linkInput ? linkInput.value.trim() : '';
    if (!link) { showToast('Masukkan link invite PvP!', 'error'); return; }
    
    let inviteCode = '';
    if (link.includes('invite=')) inviteCode = link.split('invite=')[1].split('&')[0];
    else if (link.includes('pvp-invite-')) inviteCode = link.includes('/') ? link.split('/').pop() : link;
    else inviteCode = link;
    
    if (!inviteCode.startsWith('pvp-invite-')) { showToast('Link invite tidak valid!', 'error'); return; }
    
    try {
        const snapshot = await database.ref(`rpg_pvp_invites/${inviteCode}`).once('value');
        const invite = snapshot.val();
        if (!invite) { showToast('Invite tidak ditemukan!', 'error'); return; }
        if (invite.status !== 'waiting') { showToast('Invite sudah tidak berlaku!', 'error'); return; }
        if (invite.inviterId === currentUserId) { showToast('Tidak bisa melawan diri sendiri!', 'error'); return; }
        
        const now = Date.now();
        if (playerData.lastPvp && (now - playerData.lastPvp) < 300000) {
            const remaining = Math.ceil((300000 - (now - playerData.lastPvp)) / 1000);
            showToast(`Cooldown PvP! Tunggu ${remaining} detik lagi.`, 'error');
            return;
        }
        
        await database.ref(`rpg_pvp_invites/${inviteCode}`).update({
            status: 'accepted', joinerId: currentUserId, joinerName: currentUser,
            joinerLevel: playerData.level, joinerClass: playerData.class,
            joinerHp: playerData.hp, joinerMaxHp: playerData.maxHp,
            joinerMp: playerData.mp, joinerMaxMp: playerData.maxMp,
            joinerAttack: getTotalAttack(), joinerDefense: getTotalDefense(),
            joinerAgility: playerData.agility, acceptedAt: now
        });
        
        const battleId = Date.now() + '_pvp';
        const battleData = {
            player1Id: invite.inviterId, player1Name: invite.inviterName,
            player1Hp: invite.inviterHp, player1MaxHp: invite.inviterMaxHp,
            player1Mp: invite.inviterMp, player1MaxMp: invite.inviterMaxMp,
            player1Attack: invite.inviterAttack, player1Defense: invite.inviterDefense,
            player1Class: invite.inviterClass,
            player2Id: currentUserId, player2Name: currentUser,
            player2Hp: playerData.hp, player2MaxHp: playerData.maxHp,
            player2Mp: playerData.mp, player2MaxMp: playerData.maxMp,
            player2Attack: getTotalAttack(), player2Defense: getTotalDefense(),
            player2Class: playerData.class,
            currentTurn: invite.inviterAgility > playerData.agility ? invite.inviterId : currentUserId,
            status: 'active', winner: null, log: ['⚔️ PvP Pertempuran dimulai!'], timestamp: now
        };
        await database.ref(`rpg_pvp_battles/${battleId}`).set(battleData);
        closePvpArenaModal();
        startPvpBattle(battleId, battleData);
        showToast('Berhasil join PvP!', 'success');
    } catch (error) {
        console.error('Error joining PvP:', error);
        showToast('Gagal join PvP!', 'error');
    }
}

async function sendPvpInviteToPlayer(targetId, targetName) {
    if (!playerData) return;
    const now = Date.now();
    if (playerData.lastPvp && (now - playerData.lastPvp) < 300000) {
        const remaining = Math.ceil((300000 - (now - playerData.lastPvp)) / 1000);
        showToast(`Cooldown PvP! Tunggu ${remaining} detik lagi.`, 'error');
        return;
    }
    
    const inviteCode = `pvp-invite-${currentUser}-to-${targetName}-${now}`;
    const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${inviteCode}`;
    
    const inviteData = {
        inviterId: currentUserId, inviterName: currentUser,
        inviterLevel: playerData.level, inviterClass: playerData.class,
        inviterHp: playerData.hp, inviterMaxHp: playerData.maxHp,
        inviterMp: playerData.mp, inviterMaxMp: playerData.maxMp,
        inviterAttack: getTotalAttack(), inviterDefense: getTotalDefense(),
        inviterAgility: playerData.agility,
        targetId: targetId, targetName: targetName,
        code: inviteCode, status: 'waiting', createdAt: now
    };
    
    try {
        await database.ref(`rpg_pvp_invites/${inviteCode}`).set(inviteData);
        const inviteLinkInput = document.getElementById('inviteLinkInput');
        const inviteLinkContainer = document.getElementById('inviteLinkContainer');
        if (inviteLinkInput) inviteLinkInput.value = inviteLink;
        if (inviteLinkContainer) inviteLinkContainer.style.display = 'block';
        navigator.clipboard.writeText(inviteLink);
        showToast(`Link invite untuk ${targetName} sudah disalin!`, 'success');
        currentPvpInviteId = inviteCode;
        listenForPvpJoiner(inviteCode);
        showPvpWaitingModal(inviteLink);
    } catch (error) {
        console.error('Error sending invite:', error);
        showToast('Gagal membuat invite!', 'error');
    }
}

function showPvpWaitingModal(inviteLink) {
    const waitingModal = document.getElementById('pvpWaitingModal');
    const waitingLinkInput = document.getElementById('waitingLinkInput');
    if (waitingLinkInput) waitingLinkInput.value = inviteLink;
    if (waitingModal) waitingModal.style.display = 'flex';
}

function closePvpWaitingModal() {
    const waitingModal = document.getElementById('pvpWaitingModal');
    if (waitingModal) waitingModal.style.display = 'none';
}

function cancelPvpWaiting() {
    if (currentPvpInviteId && database) {
        database.ref(`rpg_pvp_invites/${currentPvpInviteId}`).remove();
    }
    closePvpWaitingModal();
    showToast('PvP dibatalkan.', 'info');
}

function copyWaitingLink() {
    const input = document.getElementById('waitingLinkInput');
    if (input) { input.select(); document.execCommand('copy'); showToast('Link disalin!', 'success'); }
}

function copyInviteLink() {
    const input = document.getElementById('inviteLinkInput');
    if (input) { input.select(); document.execCommand('copy'); showToast('Link disalin!', 'success'); }
}

// ========== PVP BATTLE SYSTEM ==========
function listenForPvpBattles() {
    if (!database || !currentUserId) return;
    if (pvpBattleListener) pvpBattleListener.off();
    
    pvpBattleListener = database.ref('rpg_pvp_battles').on('child_added', (snapshot) => {
        const battle = snapshot.val();
        if (battle && battle.status === 'active' && (battle.player1Id === currentUserId || battle.player2Id === currentUserId)) {
            if (currentPvpBattleId !== snapshot.key) startPvpBattle(snapshot.key, battle);
        }
    });
    
    database.ref('rpg_pvp_battles').on('child_changed', (snapshot) => {
        const battle = snapshot.val();
        if (battle && currentPvpBattleId === snapshot.key) updatePvpBattleUI(battle);
    });
}

function startPvpBattle(battleId, battleData) {
    currentPvpBattleId = battleId;
    const isPlayer1 = battleData.player1Id === currentUserId;
    
    pvpBattleState = {
        battleId: battleId,
        player: isPlayer1 ? {
            id: battleData.player1Id, name: battleData.player1Name,
            hp: battleData.player1Hp, maxHp: battleData.player1MaxHp,
            mp: battleData.player1Mp, maxMp: battleData.player1MaxMp,
            attack: battleData.player1Attack, defense: battleData.player1Defense,
            class: battleData.player1Class
        } : {
            id: battleData.player2Id, name: battleData.player2Name,
            hp: battleData.player2Hp, maxHp: battleData.player2MaxHp,
            mp: battleData.player2Mp, maxMp: battleData.player2MaxMp,
            attack: battleData.player2Attack, defense: battleData.player2Defense,
            class: battleData.player2Class
        },
        opponent: isPlayer1 ? {
            id: battleData.player2Id, name: battleData.player2Name,
            hp: battleData.player2Hp, maxHp: battleData.player2MaxHp,
            mp: battleData.player2Mp, maxMp: battleData.player2MaxMp,
            attack: battleData.player2Attack, defense: battleData.player2Defense,
            class: battleData.player2Class
        } : {
            id: battleData.player1Id, name: battleData.player1Name,
            hp: battleData.player1Hp, maxHp: battleData.player1MaxHp,
            mp: battleData.player1Mp, maxMp: battleData.player1MaxMp,
            attack: battleData.player1Attack, defense: battleData.player1Defense,
            class: battleData.player1Class
        },
        currentTurn: battleData.currentTurn,
        log: battleData.log || ['⚔️ PvP Pertempuran dimulai!']
    };
    
    const modal = document.getElementById('pvpBattleModal');
    document.getElementById('pvpPlayerName').innerText = pvpBattleState.player.name;
    document.getElementById('pvpEnemyName').innerText = pvpBattleState.opponent.name;
    document.getElementById('pvpPlayerHp').innerText = `${pvpBattleState.player.hp}/${pvpBattleState.player.maxHp}`;
    document.getElementById('pvpPlayerHpFill').style.width = `${(pvpBattleState.player.hp / pvpBattleState.player.maxHp) * 100}%`;
    document.getElementById('pvpPlayerMp').innerText = `${pvpBattleState.player.mp}/${pvpBattleState.player.maxMp}`;
    document.getElementById('pvpPlayerMpFill').style.width = `${(pvpBattleState.player.mp / pvpBattleState.player.maxMp) * 100}%`;
    document.getElementById('pvpEnemyHp').innerText = `${pvpBattleState.opponent.hp}/${pvpBattleState.opponent.maxHp}`;
    document.getElementById('pvpEnemyHpFill').style.width = `${(pvpBattleState.opponent.hp / pvpBattleState.opponent.maxHp) * 100}%`;
    document.getElementById('pvpEnemyMp').innerText = `${pvpBattleState.opponent.mp}/${pvpBattleState.opponent.maxMp}`;
    document.getElementById('pvpEnemyMpFill').style.width = `${(pvpBattleState.opponent.mp / pvpBattleState.opponent.maxMp) * 100}%`;
    document.getElementById('pvpBattleLog').innerHTML = pvpBattleState.log.map(l => `<p>${l}</p>`).join('');
    if (modal) modal.style.display = 'flex';
    updatePvpButtons();
}

function updatePvpButtons() {
    const isMyTurn = pvpBattleState && pvpBattleState.currentTurn === currentUserId;
    const btns = ['pvpAttackBtn', 'pvpSkillBtn', 'pvpItemBtn'];
    btns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) { btn.disabled = !isMyTurn; btn.style.opacity = isMyTurn ? '1' : '0.5'; }
    });
}

function updatePvpBattleUI(battleData) {
    if (!pvpBattleState) return;
    const isPlayer1 = battleData.player1Id === currentUserId;
    pvpBattleState.player.hp = isPlayer1 ? battleData.player1Hp : battleData.player2Hp;
    pvpBattleState.opponent.hp = isPlayer1 ? battleData.player2Hp : battleData.player1Hp;
    pvpBattleState.player.mp = isPlayer1 ? battleData.player1Mp : battleData.player2Mp;
    pvpBattleState.opponent.mp = isPlayer1 ? battleData.player2Mp : battleData.player1Mp;
    pvpBattleState.currentTurn = battleData.currentTurn;
    pvpBattleState.log = battleData.log || [];
    
    document.getElementById('pvpPlayerHp').innerText = `${pvpBattleState.player.hp}/${pvpBattleState.player.maxHp}`;
    document.getElementById('pvpPlayerHpFill').style.width = `${(pvpBattleState.player.hp / pvpBattleState.player.maxHp) * 100}%`;
    document.getElementById('pvpPlayerMp').innerText = `${pvpBattleState.player.mp}/${pvpBattleState.player.maxMp}`;
    document.getElementById('pvpPlayerMpFill').style.width = `${(pvpBattleState.player.mp / pvpBattleState.player.maxMp) * 100}%`;
    document.getElementById('pvpEnemyHp').innerText = `${pvpBattleState.opponent.hp}/${pvpBattleState.opponent.maxHp}`;
    document.getElementById('pvpEnemyHpFill').style.width = `${(pvpBattleState.opponent.hp / pvpBattleState.opponent.maxHp) * 100}%`;
    document.getElementById('pvpEnemyMp').innerText = `${pvpBattleState.opponent.mp}/${pvpBattleState.opponent.maxMp}`;
    document.getElementById('pvpEnemyMpFill').style.width = `${(pvpBattleState.opponent.mp / pvpBattleState.opponent.maxMp) * 100}%`;
    document.getElementById('pvpBattleLog').innerHTML = pvpBattleState.log.map(l => `<p>${l}</p>`).join('');
    updatePvpButtons();
    if (battleData.winner) endPvpBattle(battleData.winner);
}

async function pvpAttack() {
    if (!pvpBattleState || pvpBattleState.currentTurn !== currentUserId) { showToast('Bukan giliranmu!', 'error'); return; }
    const damage = Math.max(1, pvpBattleState.player.attack - pvpBattleState.opponent.defense);
    const isCritical = Math.random() < 0.1;
    const finalDamage = isCritical ? damage * 2 : damage;
    const newOpponentHp = Math.max(0, pvpBattleState.opponent.hp - finalDamage);
    await updatePvpBattle({ opponentHp: newOpponentHp, currentTurn: pvpBattleState.opponent.id, log: `${pvpBattleState.player.name} menyerang! ${isCritical ? 'CRITICAL! ' : ''}Damage: ${finalDamage}` });
    if (newOpponentHp <= 0) await endPvpBattle(currentUserId);
}

async function pvpSkill() {
    if (!pvpBattleState || pvpBattleState.currentTurn !== currentUserId) { showToast('Bukan giliranmu!', 'error'); return; }
    let mpCost = 15, skillDamage = 0, skillName = "Skill";
    if (pvpBattleState.player.class === 'mage') { mpCost = 20; skillDamage = Math.floor(pvpBattleState.player.attack * 2); skillName = "Fireball"; }
    else if (pvpBattleState.player.class === 'archer') { mpCost = 15; const isCritical = Math.random() < 0.75; skillDamage = Math.max(1, pvpBattleState.player.attack - pvpBattleState.opponent.defense); if (isCritical) skillDamage *= 2; skillName = "Precision Shot"; }
    else { mpCost = 15; skillDamage = Math.floor(pvpBattleState.player.attack * 2.5); skillName = "Rage Slash"; }
    if (pvpBattleState.player.mp < mpCost) { showToast(`MP tidak cukup! Butuh ${mpCost} MP.`, 'error'); return; }
    const newPlayerMp = pvpBattleState.player.mp - mpCost;
    const newOpponentHp = Math.max(0, pvpBattleState.opponent.hp - skillDamage);
    await updatePvpBattle({ opponentHp: newOpponentHp, playerMp: newPlayerMp, currentTurn: pvpBattleState.opponent.id, log: `${pvpBattleState.player.name} menggunakan ${skillName}! Damage: ${skillDamage}` });
    if (newOpponentHp <= 0) await endPvpBattle(currentUserId);
}

async function pvpUseItem() {
    if (!pvpBattleState || pvpBattleState.currentTurn !== currentUserId) { showToast('Bukan giliranmu!', 'error'); return; }
    if (!playerData.inventory?.potion || playerData.inventory.potion < 1) { showToast('Tidak memiliki Potion!', 'error'); return; }
    const healAmount = 30;
    const newPlayerHp = Math.min(pvpBattleState.player.maxHp, pvpBattleState.player.hp + healAmount);
    playerData.inventory.potion--;
    await savePlayerData();
    await updatePvpBattle({ playerHp: newPlayerHp, currentTurn: pvpBattleState.opponent.id, log: `${pvpBattleState.player.name} menggunakan Potion! HP +${healAmount}` });
}

async function updatePvpBattle(updates) {
    if (!currentPvpBattleId || !database) return;
    const battleRef = database.ref(`rpg_pvp_battles/${currentPvpBattleId}`);
    const snapshot = await battleRef.once('value');
    const battle = snapshot.val();
    if (!battle) return;
    const newBattleData = { ...battle };
    const isPlayer1 = battle.player1Id === currentUserId;
    if (updates.opponentHp !== undefined) isPlayer1 ? newBattleData.player2Hp = updates.opponentHp : newBattleData.player1Hp = updates.opponentHp;
    if (updates.playerHp !== undefined) isPlayer1 ? newBattleData.player1Hp = updates.playerHp : newBattleData.player2Hp = updates.playerHp;
    if (updates.playerMp !== undefined) isPlayer1 ? newBattleData.player1Mp = updates.playerMp : newBattleData.player2Mp = updates.playerMp;
    if (updates.currentTurn !== undefined) newBattleData.currentTurn = updates.currentTurn;
    if (updates.log !== undefined) newBattleData.log = [...(battle.log || []), updates.log];
    await battleRef.update(newBattleData);
}

async function endPvpBattle(winnerId) {
    if (!currentPvpBattleId || !database) return;
    const battleRef = database.ref(`rpg_pvp_battles/${currentPvpBattleId}`);
    const snapshot = await battleRef.once('value');
    const battle = snapshot.val();
    if (!battle) return;
    await battleRef.update({ winner: winnerId, status: 'finished' });
    const isWinner = winnerId === currentUserId;
    if (isWinner) { playerData.pvpWins = (playerData.pvpWins || 0) + 1; playerData.gold += 100; showToast('🏆 Kemenangan PvP! +100 Gold', 'success'); }
    else { playerData.pvpLosses = (playerData.pvpLosses || 0) + 1; const goldLost = Math.floor(playerData.gold * 0.05); playerData.gold -= goldLost; showToast(`💀 Kalah PvP! Uang berkurang ${formatGold(goldLost)}`, 'error'); }
    playerData.lastPvp = Date.now();
    await savePlayerData();
    updateUI();
    if (currentPvpInviteId && database) database.ref(`rpg_pvp_invites/${currentPvpInviteId}`).remove();
    setTimeout(() => closePvpBattleModal(), 3000);
}

function closePvpBattleModal() {
    const modal = document.getElementById('pvpBattleModal');
    if (modal) modal.style.display = 'none';
    currentPvpBattleId = null;
    pvpBattleState = null;
}

function showPvpArena() {
    const modal = document.getElementById('pvpArenaModal');
    if (modal) modal.style.display = 'flex';
    loadOnlinePlayers();
}

function closePvpArenaModal() {
    const modal = document.getElementById('pvpArenaModal');
    if (modal) modal.style.display = 'none';
}

// ========== LOGIN SYSTEM ==========
async function login() {
    if (!database) { showToast('Database sedang inisialisasi!', 'error'); return; }
    const username = usernameInput ? usernameInput.value.trim() : '';
    if (!username) { showToast('Masukkan username!', 'error'); return; }
    if (username.length < 3) { showToast('Minimal 3 karakter!', 'error'); return; }
    if (loginBtn) { loginBtn.disabled = true; loginBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Memproses...'; }
    currentUser = username;
    currentUserId = 'rpg_' + username.toLowerCase().replace(/[^a-z0-9]/g, '_');
    localStorage.setItem('rpg_username', currentUser);
    localStorage.setItem('rpg_userId', currentUserId);
    try { await loadPlayerData(); } catch (error) { console.error('Login error:', error); showToast('Gagal login!', 'error'); if (loginBtn) { loginBtn.disabled = false; loginBtn.innerHTML = '<i class="fas fa-gamepad"></i> Mulai Petualangan'; } }
}

function checkSavedUser() {
    const savedUser = localStorage.getItem('rpg_username');
    const savedUserId = localStorage.getItem('rpg_userId');
    if (savedUser && savedUserId && database) { currentUser = savedUser; currentUserId = savedUserId; loadPlayerData(); }
}

async function loadPlayerData() {
    showToast('Memuat data petualang...', 'info');
    try {
        const snapshot = await database.ref(`rpg_players/${currentUserId}`).once('value');
        const data = snapshot.val();
        if (data) { playerData = data; updateUI(); startGame(); startOnlineStatusUpdates(); listenForPvpBattles(); }
        else { showClassSelection(); }
    } catch (error) { console.error('Error loading player:', error); showToast('Gagal memuat data!', 'error'); if (loginBtn) { loginBtn.disabled = false; loginBtn.innerHTML = '<i class="fas fa-gamepad"></i> Mulai Petualangan'; } }
}

function showClassSelection() {
    if (loginScreen) loginScreen.style.display = 'none';
    const existingModal = document.getElementById('classModal');
    if (existingModal) existingModal.remove();
    const modalHtml = `<div id="classModal" class="modal" style="display: flex; z-index: 3000;"><div class="modal-content" style="max-width: 350px;"><div class="modal-header"><h3><i class="fas fa-hat-wizard"></i> Pilih Class</h3><button class="modal-close" onclick="closeClassModal()"><i class="fas fa-times"></i></button></div><div class="modal-body" style="padding: 20px;"><div style="display: flex; flex-direction: column; gap: 12px;"><div class="action-card" onclick="createPlayer('warrior')" style="display: flex; align-items: center; gap: 12px; padding: 12px;"><i class="fas fa-shield-alt" style="font-size: 1.8rem;"></i><div style="text-align: left;"><strong>Warrior</strong><small style="display: block;">HP & Defense tinggi</small></div></div><div class="action-card" onclick="createPlayer('mage')" style="display: flex; align-items: center; gap: 12px; padding: 12px;"><i class="fas fa-magic" style="font-size: 1.8rem;"></i><div style="text-align: left;"><strong>Mage</strong><small style="display: block;">Magic attack kuat</small></div></div><div class="action-card" onclick="createPlayer('archer')" style="display: flex; align-items: center; gap: 12px; padding: 12px;"><i class="fas fa-bow-arrow" style="font-size: 1.8rem;"></i><div style="text-align: left;"><strong>Archer</strong><small style="display: block;">Critical & agility tinggi</small></div></div></div></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeClassModal() {
    const modal = document.getElementById('classModal');
    if (modal) modal.remove();
    if (loginScreen) loginScreen.style.display = 'flex';
    if (gameScreen) gameScreen.style.display = 'none';
    if (loginBtn) { loginBtn.disabled = false; loginBtn.innerHTML = '<i class="fas fa-gamepad"></i> Mulai Petualangan'; }
}

async function createPlayer(className) {
    closeClassModal();
    const classStats = { warrior: { hp: 100, mp: 30, attack: 15, defense: 10, agility: 5, skillName: "Rage Slash" }, mage: { hp: 60, mp: 100, attack: 20, defense: 5, agility: 8, skillName: "Fireball" }, archer: { hp: 80, mp: 50, attack: 12, defense: 7, agility: 15, skillName: "Precision Shot" } };
    const stats = classStats[className];
    playerData = { username: currentUser, class: className, level: 1, exp: 0, expToNext: 100, maxHp: stats.hp, hp: stats.hp, maxMp: stats.mp, mp: stats.mp, attack: stats.attack, defense: stats.defense, agility: stats.agility, skillName: stats.skillName, skillDesc: "", gold: 50, inventory: { "potion": 3 }, equipment: { weapon: null, armor: null }, location: "desa", lastDaily: 0, pvpWins: 0, pvpLosses: 0, quests: {}, createdAt: Date.now(), lastPvp: 0 };
    try { await database.ref(`rpg_players/${currentUserId}`).set(playerData); updateUI(); startGame(); startOnlineStatusUpdates(); listenForPvpBattles(); showToast(`🎉 Selamat datang, ${className.toUpperCase()}!`, 'success'); } catch (error) { console.error('Error creating player:', error); showToast('Gagal membuat karakter!', 'error'); }
}

function startGame() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (gameScreen) gameScreen.style.display = 'block';
    refreshUIData(); updateUI();
}

function refreshUIData() {
    document.getElementById('headerUsername').innerText = playerData?.username || 'Loading...';
    document.getElementById('headerLevel').innerText = `Lv ${playerData?.level || 1}`;
    document.getElementById('playerName').innerText = playerData?.username || '-';
    document.getElementById('playerClass').innerText = playerData?.class?.toUpperCase() || '-';
    document.getElementById('playerGold').innerText = formatGold(playerData?.gold || 0);
}

function updateUI() {
    if (!playerData) return;
    document.getElementById('headerUsername').innerText = playerData.username;
    document.getElementById('headerLevel').innerText = `Lv ${playerData.level}`;
    document.getElementById('playerName').innerText = playerData.username;
    document.getElementById('playerClass').innerText = playerData.class.toUpperCase();
    document.getElementById('playerGold').innerText = formatGold(playerData.gold);
    document.getElementById('hpBar').style.width = `${(playerData.hp / playerData.maxHp) * 100}%`;
    document.getElementById('mpBar').style.width = `${(playerData.mp / playerData.maxMp) * 100}%`;
    document.getElementById('expBar').style.width = `${(playerData.exp / playerData.expToNext) * 100}%`;
    document.getElementById('hpText').innerText = `${playerData.hp}/${playerData.maxHp}`;
    document.getElementById('mpText').innerText = `${playerData.mp}/${playerData.maxMp}`;
    document.getElementById('expText').innerText = `${playerData.exp}/${playerData.expToNext}`;
    document.getElementById('playerAttack').innerText = getTotalAttack();
    document.getElementById('playerDefense').innerText = getTotalDefense();
    document.getElementById('playerAgility').innerText = playerData.agility;
    document.getElementById('playerPvp').innerText = `${playerData.pvpWins || 0}/${playerData.pvpLosses || 0}`;
    const location = locations[playerData.location] || locations['desa'];
    document.getElementById('currentLocation').innerText = location.name;
    document.getElementById('locationDesc').innerText = location.desc;
}

function getTotalAttack() { let total = playerData.attack; if (playerData.equipment?.weapon && shopItems[playerData.equipment.weapon]) total += shopItems[playerData.equipment.weapon].attack || 0; return total; }
function getTotalDefense() { let total = playerData.defense; if (playerData.equipment?.armor && shopItems[playerData.equipment.armor]) total += shopItems[playerData.equipment.armor].defense || 0; return total; }
function formatGold(amount) { if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}jt`; if (amount >= 1000) return `${(amount / 1000).toFixed(0)}rb`; return amount.toString(); }

// ========== EXPLORE & BATTLE ==========
async function explore() {
    if (battleCooldown) { showToast('Kamu masih kelelahan!', 'error'); return; }
    const location = locations[playerData.location];
    if (!location.monsters || location.monsters.length === 0) { showToast('Tidak ada monster di sini!', 'error'); return; }
    const monsterId = location.monsters[Math.floor(Math.random() * location.monsters.length)];
    const monster = { ...monsters[monsterId], id: monsterId };
    battleState = { inBattle: true, monster: monster, monsterCurrentHp: monster.hp, playerCurrentHp: playerData.hp, playerCurrentMp: playerData.mp };
    document.getElementById('battleEnemyName').innerText = monster.name;
    document.getElementById('battleEnemyHp').innerText = `${monster.hp}/${monster.hp}`;
    document.getElementById('battleEnemyHpFill').style.width = '100%';
    document.getElementById('battlePlayerName').innerText = playerData.username;
    document.getElementById('battlePlayerHp').innerText = `${playerData.hp}/${playerData.maxHp}`;
    document.getElementById('battlePlayerHpFill').style.width = `${(playerData.hp / playerData.maxHp) * 100}%`;
    document.getElementById('battleLog').innerHTML = '<p>⚔️ Pertempuran dimulai!</p>';
    document.getElementById('battleModal').style.display = 'flex';
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) { if (playerData.mp < getSkillMpCost()) { skillBtn.disabled = true; skillBtn.style.opacity = '0.5'; } else { skillBtn.disabled = false; skillBtn.style.opacity = '1'; } }
}

function getSkillMpCost() { if (playerData.class === 'mage') return 20; if (playerData.class === 'archer') return 15; return 15; }
function calculateDamage(attack, defense) { return Math.max(1, Math.floor(attack - defense)); }

async function battleAttack() {
    if (!battleState) return;
    const playerDamage = calculateDamage(getTotalAttack(), battleState.monster.defense);
    battleState.monsterCurrentHp -= playerDamage;
    let log = `<p>🗡️ Kamu menyerang ${battleState.monster.name}! Damage: ${playerDamage}</p>`;
    if (battleState.monsterCurrentHp <= 0) { document.getElementById('battleLog').innerHTML += log; await battleVictory(); return; }
    const monsterDamage = calculateDamage(battleState.monster.attack, getTotalDefense());
    battleState.playerCurrentHp -= monsterDamage;
    log += `<p>🛡️ ${battleState.monster.name} menyerang balik! Damage: ${monsterDamage}</p>`;
    updateBattleUI();
    document.getElementById('battleLog').innerHTML += log;
    if (battleState.playerCurrentHp <= 0) await battleDefeat();
}

async function battleSkill() {
    if (!battleState) return;
    const mpCost = getSkillMpCost();
    if (battleState.playerCurrentMp < mpCost) { showToast('MP tidak cukup!', 'error'); return; }
    battleState.playerCurrentMp -= mpCost;
    let skillDamage = 0, log = `<p>✨ ${playerData.skillName} ✨</p>`;
    if (playerData.class === 'warrior') { skillDamage = Math.floor(getTotalAttack() * 2.5); battleState.playerCurrentHp -= 5; log += `<p>💥 RAGE SLASH! Damage: ${skillDamage} ke ${battleState.monster.name}! (-5 HP)</p>`; }
    else if (playerData.class === 'mage') { skillDamage = Math.floor(getTotalAttack() * 2); log += `<p>🔥 FIREBALL! Damage: ${skillDamage} ke ${battleState.monster.name}!</p>`; }
    else { const isCritical = Math.random() < 0.75; skillDamage = calculateDamage(getTotalAttack(), battleState.monster.defense); if (isCritical) skillDamage *= 2; log += `<p>🏹 PRECISION SHOT! Damage: ${skillDamage} ke ${battleState.monster.name}! ${isCritical ? '(Critical!)' : ''}</p>`; }
    battleState.monsterCurrentHp -= skillDamage;
    if (battleState.monsterCurrentHp <= 0) { document.getElementById('battleLog').innerHTML += log; await battleVictory(); return; }
    const monsterDamage = calculateDamage(battleState.monster.attack, getTotalDefense());
    battleState.playerCurrentHp -= monsterDamage;
    log += `<p>🛡️ ${battleState.monster.name} menyerang balik! Damage: ${monsterDamage}</p>`;
    updateBattleUI();
    document.getElementById('battleLog').innerHTML += log;
    if (battleState.playerCurrentHp <= 0) await battleDefeat();
}

function battleUseItem() {
    if (!battleState) return;
    if (!playerData.inventory?.potion || playerData.inventory.potion < 1) { showToast('Tidak memiliki Potion!', 'error'); return; }
    const healAmount = 30;
    battleState.playerCurrentHp = Math.min(playerData.maxHp, battleState.playerCurrentHp + healAmount);
    playerData.inventory.potion--;
    let log = `<p>🧪 Menggunakan Potion! HP pulih ${healAmount}!</p>`;
    const monsterDamage = calculateDamage(battleState.monster.attack, getTotalDefense());
    battleState.playerCurrentHp -= monsterDamage;
    log += `<p>🛡️ ${battleState.monster.name} menyerang! Damage: ${monsterDamage}</p>`;
    updateBattleUI();
    document.getElementById('battleLog').innerHTML += log;
    if (battleState.playerCurrentHp <= 0) battleDefeat();
}

async function battleFlee() {
    if (!battleState) return;
    const fleeChance = Math.min(0.8, playerData.agility / 100);
    if (Math.random() < fleeChance) { showToast('Berhasil kabur!', 'success'); closeBattleModal(); }
    else { const monsterDamage = calculateDamage(battleState.monster.attack, getTotalDefense()); battleState.playerCurrentHp -= monsterDamage; updateBattleUI(); document.getElementById('battleLog').innerHTML += `<p>❌ Gagal kabur! ${battleState.monster.name} menyerang! Damage: ${monsterDamage}</p>`; if (battleState.playerCurrentHp <= 0) await battleDefeat(); }
}

function updateBattleUI() {
    document.getElementById('battlePlayerHp').innerText = `${Math.max(0, battleState.playerCurrentHp)}/${playerData.maxHp}`;
    document.getElementById('battlePlayerHpFill').style.width = `${Math.max(0, (battleState.playerCurrentHp / playerData.maxHp) * 100)}%`;
    document.getElementById('battleEnemyHp').innerText = `${Math.max(0, battleState.monsterCurrentHp)}/${battleState.monster.hp}`;
    document.getElementById('battleEnemyHpFill').style.width = `${Math.max(0, (battleState.monsterCurrentHp / battleState.monster.hp) * 100)}%`;
}

async function battleVictory() {
    playerData.gold += battleState.monster.gold;
    playerData.exp += battleState.monster.exp;
    let leveledUp = false;
    while (playerData.exp >= playerData.expToNext) {
        playerData.exp -= playerData.expToNext; playerData.level++;
        playerData.expToNext = Math.floor(playerData.expToNext * 1.5);
        playerData.maxHp += 10; playerData.maxMp += 5;
        playerData.attack += 2; playerData.defense += 1; playerData.agility += 1;
        leveledUp = true;
    }
    playerData.hp = playerData.maxHp; playerData.mp = playerData.maxMp;
    await savePlayerData();
    let log = `<p>🎉 VICTORY! 🎉</p><p>💰 +${battleState.monster.gold} Gold</p><p>⭐ +${battleState.monster.exp} EXP</p>`;
    if (leveledUp) log += `<p>🎊 LEVEL UP! Sekarang Level ${playerData.level}! 🎊</p>`;
    document.getElementById('battleLog').innerHTML += log;
    updateUI();
    setBattleCooldown();
    setTimeout(() => { closeBattleModal(); showToast(`Kemenangan! +${battleState.monster.gold} Gold, +${battleState.monster.exp} EXP`, 'success'); }, 2000);
}

async function battleDefeat() {
    playerData.hp = Math.floor(playerData.maxHp / 2);
    const goldLost = Math.floor(playerData.gold * 0.1);
    playerData.gold -= goldLost;
    await savePlayerData();
    document.getElementById('battleLog').innerHTML += `<p>💀 KAMU KALAH! 💀</p><p>💔 HP terisi setengah</p><p>💰 Uang berkurang ${formatGold(goldLost)}</p>`;
    updateUI();
    setBattleCooldown();
    setTimeout(() => { closeBattleModal(); showToast(`Kalah! Uang berkurang ${formatGold(goldLost)}`, 'error'); }, 2000);
}

function setBattleCooldown() { battleCooldown = true; if (battleTimer) clearTimeout(battleTimer); battleTimer = setTimeout(() => { battleCooldown = false; showToast('Kamu sudah pulih! Bisa bertarung lagi.', 'success'); }, 20000); }
function closeBattleModal() { battleState = null; document.getElementById('battleModal').style.display = 'none'; }

// ========== INVENTORY, SHOP, QUEST, HEAL, DAILY, WORK, MINING ==========
function showInventory() { const container = document.getElementById('inventoryList'); if (!playerData.inventory || Object.keys(playerData.inventory).length === 0) { container.innerHTML = '<div style="text-align:center;padding:20px;">Inventory kosong</div>'; } else { container.innerHTML = Object.entries(playerData.inventory).map(([itemId, qty]) => { const item = shopItems[itemId]; if (!item) return ''; return `<div class="inventory-item"><div><div class="item-name">${item.name}</div><div class="item-desc">${item.desc || ''}</div></div><div class="item-quantity">x${qty}</div><button class="use-btn" onclick="useItem('${itemId}')">Gunakan</button></div>`; }).join(''); } document.getElementById('inventoryModal').style.display = 'flex'; }
function useItem(itemId) { const item = shopItems[itemId]; if (!item) return; if (item.type === 'heal') { if (playerData.hp >= playerData.maxHp) { showToast('HP sudah penuh!', 'error'); return; } playerData.hp = Math.min(playerData.maxHp, playerData.hp + item.value); showToast(`❤️ HP pulih ${item.value}!`, 'success'); } else if (item.type === 'mana') { if (playerData.mp >= playerData.maxMp) { showToast('MP sudah penuh!', 'error'); return; } playerData.mp = Math.min(playerData.maxMp, playerData.mp + item.value); showToast(`🔵 MP pulih ${item.value}!`, 'success'); } else if (item.type === 'weapon') { if (playerData.equipment.weapon === itemId) { showToast('Sudah memakai senjata ini!', 'error'); return; } if (playerData.equipment.weapon) { const oldWeapon = playerData.equipment.weapon; playerData.inventory[oldWeapon] = (playerData.inventory[oldWeapon] || 0) + 1; } playerData.equipment.weapon = itemId; playerData.inventory[itemId]--; showToast(`⚔️ ${item.name} dipasang!`, 'success'); } else if (item.type === 'armor') { if (playerData.equipment.armor === itemId) { showToast('Sudah memakai zirah ini!', 'error'); return; } if (playerData.equipment.armor) { const oldArmor = playerData.equipment.armor; playerData.inventory[oldArmor] = (playerData.inventory[oldArmor] || 0) + 1; } playerData.equipment.armor = itemId; playerData.inventory[itemId]--; showToast(`🛡️ ${item.name} dipasang!`, 'success'); } if (playerData.inventory[itemId] <= 0) delete playerData.inventory[itemId]; savePlayerData(); updateUI(); showInventory(); }
function closeInventoryModal() { document.getElementById('inventoryModal').style.display = 'none'; }
function showShop() { const container = document.getElementById('shopList'); container.innerHTML = Object.entries(shopItems).map(([id, item]) => `<div class="shop-item"><div><div class="item-name">${item.name}</div><div class="item-desc">${item.desc || ''}</div></div><div class="item-price">💰 ${item.price}</div><button class="buy-btn" onclick="buyItem('${id}')">Beli</button></div>`).join(''); document.getElementById('shopModal').style.display = 'flex'; }
async function buyItem(itemId) { const item = shopItems[itemId]; if (!item) return; if (playerData.gold < item.price) { showToast('Gold tidak cukup!', 'error'); return; } playerData.gold -= item.price; if (!playerData.inventory) playerData.inventory = {}; playerData.inventory[itemId] = (playerData.inventory[itemId] || 0) + 1; await savePlayerData(); updateUI(); showToast(`✅ Membeli ${item.name}!`, 'success'); showShop(); }
function closeShopModal() { document.getElementById('shopModal').style.display = 'none'; }
function showQuest() { const container = document.getElementById('questList'); container.innerHTML = Object.entries(quests).map(([id, quest]) => `<div class="quest-item"><div><div class="item-name">${quest.title}</div><div class="item-desc">${quest.desc}</div><small>Hadiah: ${quest.rewardExp} EXP + ${quest.rewardGold} Gold</small></div><button class="quest-take-btn" onclick="takeQuest('${id}')">Ambil</button></div>`).join(''); document.getElementById('questModal').style.display = 'flex'; }
function takeQuest(questId) { if (playerData.quests?.[questId]?.completed) { showToast('Quest sudah selesai!', 'error'); return; } if (playerData.quests?.[questId]?.active) { showToast('Quest sudah diambil!', 'error'); return; } if (!playerData.quests) playerData.quests = {}; playerData.quests[questId] = { active: true, progress: 0 }; savePlayerData(); showToast(`Quest "${quests[questId].title}" diambil!`, 'success'); }
function closeQuestModal() { document.getElementById('questModal').style.display = 'none'; }
async function heal() { if (playerData.gold < 20) { showToast('Gold tidak cukup! Butuh 20 gold untuk istirahat.', 'error'); return; } playerData.gold -= 20; playerData.hp = playerData.maxHp; playerData.mp = playerData.maxMp; await savePlayerData(); updateUI(); showToast('💤 Istirahat selesai! HP dan MP pulih penuh.', 'success'); }
async function dailyReward() { const now = Date.now(); const oneDay = 24 * 60 * 60 * 1000; if (playerData.lastDaily && (now - playerData.lastDaily) < oneDay) { const remaining = oneDay - (now - playerData.lastDaily); const hours = Math.floor(remaining / (60 * 60 * 1000)); showToast(`Claim lagi dalam ${hours} jam!`, 'error'); return; } const rewardGold = 100 + (playerData.level * 10); const rewardExp = 50 + (playerData.level * 5); playerData.gold += rewardGold; playerData.exp += rewardExp; playerData.lastDaily = now; while (playerData.exp >= playerData.expToNext) { playerData.exp -= playerData.expToNext; playerData.level++; playerData.expToNext = Math.floor(playerData.expToNext * 1.5); playerData.maxHp += 10; playerData.maxMp += 5; playerData.attack += 2; playerData.defense += 1; playerData.agility += 1; } await savePlayerData(); updateUI(); showToast(`🎁 Daily Reward! +${rewardGold} Gold, +${rewardExp} EXP`, 'success'); }
async function doWork() { const results = [{ name: "Lembur dapat bonus", exp: 15, gold: 80, hp: -8 }, { name: "Kerja santai, gaji standar", exp: 10, gold: 50, hp: -5 }, { name: "Dimarahi bos", exp: 5, gold: 30, hp: -10 }]; const result = results[Math.floor(Math.random() * results.length)]; playerData.gold += result.gold; playerData.exp += result.exp; playerData.hp = Math.max(0, playerData.hp + result.hp); while (playerData.exp >= playerData.expToNext) { playerData.exp -= playerData.expToNext; playerData.level++; playerData.expToNext = Math.floor(playerData.expToNext * 1.5); playerData.maxHp += 10; playerData.maxMp += 5; playerData.attack += 2; playerData.defense += 1; playerData.agility += 1; } await savePlayerData(); updateUI(); showToast(`💼 ${result.name}! +${result.gold} Gold, +${result.exp} EXP`, 'success'); }
async function doMining() { if (playerData.location !== 'tambang') { showToast('Kamu harus di Tambang Terbengkalai untuk menambang!', 'error'); return; } const ores = ['Batu', 'Batu Bara', 'Bijih Besi', 'Permata']; const goldRewards = [5, 15, 30, 100]; const index = Math.floor(Math.random() * ores.length); const goldGain = goldRewards[index]; playerData.gold += goldGain; playerData.exp += 5; await savePlayerData(); updateUI(); showToast(`⛏️ Mendapatkan ${ores[index]}! +${goldGain} Gold`, 'success'); }

// ========== LEADERBOARD, LOCATION ==========
async function loadLeaderboard(type) { try { const snapshot = await database.ref('rpg_players').once('value'); const players = snapshot.val(); const playerList = []; for (const [id, data] of Object.entries(players)) { if (data && data.username) playerList.push({ username: data.username, level: data.level || 1, gold: data.gold || 0, pvpWins: data.pvpWins || 0 }); } if (type === 'level') playerList.sort((a,b) => b.level - a.level); else if (type === 'gold') playerList.sort((a,b) => b.gold - a.gold); else playerList.sort((a,b) => b.pvpWins - a.pvpWins); document.getElementById('leaderboardList').innerHTML = playerList.slice(0, 10).map((p, i) => `<div class="leaderboard-item"><div class="leaderboard-rank">${i+1}</div><div><div class="item-name">${p.username}</div>${type === 'level' ? `<div class="item-desc">Level ${p.level}</div>` : ''}${type === 'gold' ? `<div class="item-desc">💰 ${formatGold(p.gold)}</div>` : ''}${type === 'pvp' ? `<div class="item-desc">⚔️ ${p.pvpWins} Menang</div>` : ''}</div></div>`).join(''); document.querySelectorAll('.lb-tab').forEach(btn => btn.classList.remove('active')); const activeTab = document.querySelector(`.lb-tab[onclick*="${type}"]`); if (activeTab) activeTab.classList.add('active'); document.getElementById('leaderboardModal').style.display = 'flex'; } catch (error) { console.error('Error loading leaderboard:', error); showToast('Gagal memuat leaderboard!', 'error'); } }
function closeLeaderboardModal() { document.getElementById('leaderboardModal').style.display = 'none'; }
function showLocationModal() { const container = document.getElementById('locationList'); container.innerHTML = Object.entries(locations).map(([id, loc]) => `<div class="location-item" onclick="changeLocation('${id}')"><div><div class="item-name">${loc.name}</div><div class="item-desc">${loc.desc}</div><small>Level ${loc.minLevel}-${loc.maxLevel}</small></div><i class="fas fa-chevron-right" style="color: var(--primary);"></i></div>`).join(''); document.getElementById('locationModal').style.display = 'flex'; }
async function changeLocation(locationId) { const location = locations[locationId]; if (playerData.level < location.minLevel) { showToast(`Level minimal ${location.minLevel} untuk masuk ${location.name}!`, 'error'); return; } playerData.location = locationId; await savePlayerData(); updateUI(); closeLocationModal(); showToast(`📍 Berpindah ke ${location.name}`, 'success'); }
function closeLocationModal() { document.getElementById('locationModal').style.display = 'none'; }

// ========== SAVE DATA ==========
async function savePlayerData() { if (!playerData || !database) return; try { await database.ref(`rpg_players/${currentUserId}`).update({ username: playerData.username, class: playerData.class, level: playerData.level, exp: playerData.exp, expToNext: playerData.expToNext, maxHp: playerData.maxHp, hp: playerData.hp, maxMp: playerData.maxMp, mp: playerData.mp, attack: playerData.attack, defense: playerData.defense, agility: playerData.agility, skillName: playerData.skillName, skillDesc: playerData.skillDesc, gold: playerData.gold, inventory: playerData.inventory, equipment: playerData.equipment, location: playerData.location, lastDaily: playerData.lastDaily, pvpWins: playerData.pvpWins, pvpLosses: playerData.pvpLosses, quests: playerData.quests, lastPvp: playerData.lastPvp, lastUpdated: Date.now() }); } catch (error) { console.error('Error saving:', error); } }

// ========== UTILITIES ==========
function showToast(message, type = 'info') { const toast = document.getElementById('toast'); if (toast) { toast.textContent = message; toast.className = `toast ${type}`; toast.style.display = 'block'; setTimeout(() => { toast.style.display = 'none'; }, 3000); } else { alert(message); } }
function toggleTheme() { if (document.body.classList.contains('light')) { document.body.classList.remove('light'); localStorage.setItem('rpg_theme', 'dark'); } else { document.body.classList.add('light'); localStorage.setItem('rpg_theme', 'light'); } }
function loadTheme() { const savedTheme = localStorage.getItem('rpg_theme'); if (savedTheme === 'light') document.body.classList.add('light'); }
function goBackToTools() { if (window.GlobalMusic && window.GlobalMusic.saveState) window.GlobalMusic.saveState(); if (currentUserId && database) database.ref(`rpg_online_players/${currentUserId}`).remove(); document.body.style.opacity = '0'; setTimeout(() => { window.location.href = 'tools.html'; }, 200); }

// ========== START ==========
document.addEventListener('DOMContentLoaded', () => { init(); });

// ========== EXPORT GLOBAL FUNCTIONS ==========
window.login = login;
window.explore = explore;
window.showInventory = showInventory;
window.showShop = showShop;
window.showQuest = showQuest;
window.heal = heal;
window.dailyReward = dailyReward;
window.showLeaderboard = () => loadLeaderboard('level');
window.showPvpArena = showPvpArena;
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
window.closePvpArenaModal = closePvpArenaModal;
window.closeLeaderboardModal = closeLeaderboardModal;
window.closeLocationModal = closeLocationModal;
window.closeClassModal = closeClassModal;
window.closePvpBattleModal = closePvpBattleModal;
window.closePvpWaitingModal = closePvpWaitingModal;
window.useItem = useItem;
window.buyItem = buyItem;
window.takeQuest = takeQuest;
window.changeLocation = changeLocation;
window.toggleTheme = toggleTheme;
window.goBackToTools = goBackToTools;
window.showLocationModal = showLocationModal;
window.loadLeaderboard = loadLeaderboard;
window.createPlayer = createPlayer;
window.pvpAttack = pvpAttack;
window.pvpSkill = pvpSkill;
window.pvpUseItem = pvpUseItem;
window.createPvpInviteLink = createPvpInviteLink;
window.joinPvpByLink = joinPvpByLink;
window.copyInviteLink = copyInviteLink;
window.copyWaitingLink = copyWaitingLink;
window.cancelPvpWaiting = cancelPvpWaiting;
window.sendPvpInviteToPlayer = sendPvpInviteToPlayer;