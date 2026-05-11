// ========== PVP ARENA - STANDALONE WEB (FIXED LOGIN) ==========

// Firebase Configuration (SAMA DENGAN RPG GAME)
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
let currentBattleId = null;
let currentInviteId = null;
let onlineInterval = null;
let pvpInviteListener = null;
let pvpBattleListener = null;

// Shop Items
const shopItems = {
    "potion": { name: "Potion", type: "heal", value: 30, price: 10, desc: "Memulihkan 30 HP" },
    "elixir": { name: "Elixir", type: "mana", value: 25, price: 15, desc: "Memulihkan 25 MP" }
};

// ========== INITIALIZATION ==========
async function init() {
    console.log('Initializing PvP Arena...');
    
    try {
        await initFirebase();
        
        const loginBtn = document.getElementById('loginBtn');
        const usernameInput = document.getElementById('usernameInput');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', login);
        }
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') login();
            });
        }
        
        checkUrlForPvpInvite();
        checkSavedUser();
    } catch (error) {
        console.error('Init error:', error);
        showToast('Gagal terhubung ke server!', 'error');
    }
}

function checkUrlForPvpInvite() {
    const urlParams = new URLSearchParams(window.location.search);
    const invite = urlParams.get('invite');
    if (invite && invite.startsWith('pvp-invite-')) {
        localStorage.setItem('pending_pvp_invite', invite);
        showToast('Kamu diundang PvP! Login untuk bertarung.', 'info');
    }
}

// ========== LOGIN (AMBIL DATA DARI RPG DATABASE) ==========
async function login() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput ? usernameInput.value.trim() : '';
    
    if (!username) {
        showToast('Masukkan username!', 'error');
        return;
    }
    
    if (username.length < 3) {
        showToast('Minimal 3 karakter!', 'error');
        return;
    }
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Memproses...';
    }
    
    currentUser = username;
    // Format userId HARUS SAMA dengan yang di RPG Game
    currentUserId = 'rpg_' + username.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    localStorage.setItem('pvp_username', currentUser);
    localStorage.setItem('pvp_userId', currentUserId);
    
    try {
        await loadPlayerDataFromRPG();
    } catch (error) {
        console.error('Login error:', error);
        showToast('Gagal login! Pastikan username terdaftar di RPG Game', 'error');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-gamepad"></i> Login ke Arena';
        }
    }
}

function checkSavedUser() {
    const savedUser = localStorage.getItem('pvp_username');
    const savedUserId = localStorage.getItem('pvp_userId');
    
    if (savedUser && savedUserId && database) {
        currentUser = savedUser;
        currentUserId = savedUserId;
        loadPlayerDataFromRPG();
    }
}

async function loadPlayerDataFromRPG() {
    showToast('Memuat data karakter dari RPG Game...', 'info');
    
    try {
        // Ambil data dari database RPG dengan userId yang SAMA
        const snapshot = await database.ref(`rpg_players/${currentUserId}`).once('value');
        const data = snapshot.val();
        
        console.log('Data dari Firebase:', data);
        console.log('CurrentUserId:', currentUserId);
        
        if (!data) {
            showToast(`Username "${currentUser}" tidak ditemukan di RPG Game! Login ke RPG Game dulu.`, 'error');
            // Reset form
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('arenaScreen').style.display = 'none';
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-gamepad"></i> Login ke Arena';
            }
            return;
        }
        
        playerData = data;
        updateUI();
        startGame();
        startOnlineStatusUpdates();
        listenForPvpBattles();
        
        // Cek pending invite
        const pendingInvite = localStorage.getItem('pending_pvp_invite');
        if (pendingInvite) {
            localStorage.removeItem('pending_pvp_invite');
            const joinInput = document.getElementById('joinLinkInput');
            if (joinInput) joinInput.value = pendingInvite;
            showToast('Kamu memiliki undangan PvP! Klik Join untuk bertarung.', 'info');
        }
        
    } catch (error) {
        console.error('Error loading player data:', error);
        showToast('Gagal memuat data karakter!', 'error');
    }
}

function updateUI() {
    if (!playerData) return;
    
    document.getElementById('headerUsername').innerText = playerData.username;
    document.getElementById('playerName').innerText = playerData.username;
    document.getElementById('playerClass').innerText = playerData.class?.toUpperCase() || 'WARRIOR';
    document.getElementById('pvpWins').innerText = playerData.pvpWins || 0;
    document.getElementById('pvpLosses').innerText = playerData.pvpLosses || 0;
    document.getElementById('statLevel').innerText = playerData.level || 1;
    document.getElementById('statAttack').innerText = getTotalAttack();
    document.getElementById('statDefense').innerText = getTotalDefense();
    document.getElementById('statAgility').innerText = playerData.agility || 5;
    
    const hpPercent = ((playerData.hp || playerData.maxHp) / (playerData.maxHp || 100)) * 100;
    const mpPercent = ((playerData.mp || playerData.maxMp) / (playerData.maxMp || 50)) * 100;
    
    document.getElementById('hpFillMini').style.width = `${Math.max(0, hpPercent)}%`;
    document.getElementById('mpFillMini').style.width = `${Math.max(0, mpPercent)}%`;
    document.getElementById('hpTextMini').innerText = `${playerData.hp || playerData.maxHp}/${playerData.maxHp || 100}`;
    document.getElementById('mpTextMini').innerText = `${playerData.mp || playerData.maxMp}/${playerData.maxMp || 50}`;
}

function getTotalAttack() {
    let total = playerData?.attack || 10;
    if (playerData?.equipment?.weapon && shopItems[playerData.equipment.weapon]) {
        total += shopItems[playerData.equipment.weapon].attack || 0;
    }
    return total;
}

function getTotalDefense() {
    let total = playerData?.defense || 5;
    if (playerData?.equipment?.armor && shopItems[playerData.equipment.armor]) {
        total += shopItems[playerData.equipment.armor].defense || 0;
    }
    return total;
}

function formatGold(amount) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}jt`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}rb`;
    return amount.toString();
}

function startGame() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('arenaScreen').style.display = 'block';
    console.log('🎮 PvP Arena started for:', currentUser);
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
    if (onlineInterval) clearInterval(onlineInterval);
    onlineInterval = setInterval(() => {
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
                container.innerHTML = '<div class="loading-text">Tidak ada player online</div>';
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
                        <button class="invite-btn" onclick="invitePlayer('${p.id}', '${p.username}')">
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
async function createBattle() {
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
        currentInviteId = inviteCode;
        
        document.getElementById('battleLinkInput').value = inviteLink;
        document.getElementById('battleLinkContainer').style.display = 'block';
        
        showToast('Link battle dibuat!', 'success');
        listenForJoiner(inviteCode);
        showWaitingModal(inviteLink);
    } catch (error) {
        console.error('Error creating battle:', error);
        showToast('Gagal membuat link!', 'error');
    }
}

function listenForJoiner(inviteCode) {
    if (pvpInviteListener) pvpInviteListener.off();
    pvpInviteListener = database.ref(`rpg_pvp_invites/${inviteCode}`).on('value', (snapshot) => {
        const invite = snapshot.val();
        if (invite && invite.status === 'accepted' && invite.joinerId) {
            startBattleWithJoiner(invite);
            pvpInviteListener.off();
            closeWaitingModal();
        }
    });
}

async function startBattleWithJoiner(invite) {
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
        currentTurn: (invite.inviterAgility || 5) > (invite.joinerAgility || 5) ? invite.inviterId : invite.joinerId,
        status: 'active', winner: null, log: ['⚔️ PvP Pertempuran dimulai!'], timestamp: Date.now()
    };
    await database.ref(`rpg_pvp_battles/${battleId}`).set(battleData);
    startBattle(battleId, battleData);
    showToast('Lawan bergabung! Pertarungan dimulai!', 'success');
}

async function joinBattleByLink() {
    const linkInput = document.getElementById('joinLinkInput');
    let link = linkInput ? linkInput.value.trim() : '';
    if (!link) { showToast('Masukkan link invite!', 'error'); return; }
    
    let inviteCode = '';
    if (link.includes('invite=')) inviteCode = link.split('invite=')[1].split('&')[0];
    else if (link.includes('pvp-invite-')) inviteCode = link.includes('/') ? link.split('/').pop() : link;
    else inviteCode = link;
    
    if (!inviteCode.startsWith('pvp-invite-')) { showToast('Link tidak valid!', 'error'); return; }
    
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
            currentTurn: (invite.inviterAgility || 5) > (playerData.agility || 5) ? invite.inviterId : currentUserId,
            status: 'active', winner: null, log: ['⚔️ PvP Pertempuran dimulai!'], timestamp: now
        };
        await database.ref(`rpg_pvp_battles/${battleId}`).set(battleData);
        startBattle(battleId, battleData);
        showToast('Berhasil join PvP!', 'success');
    } catch (error) {
        console.error('Error joining battle:', error);
        showToast('Gagal join PvP!', 'error');
    }
}

async function invitePlayer(targetId, targetName) {
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
        navigator.clipboard.writeText(inviteLink);
        showToast(`Link invite untuk ${targetName} sudah disalin!`, 'success');
        currentInviteId = inviteCode;
        listenForJoiner(inviteCode);
        showWaitingModal(inviteLink);
    } catch (error) {
        console.error('Error inviting player:', error);
        showToast('Gagal membuat invite!', 'error');
    }
}

function showWaitingModal(inviteLink) {
    const modal = document.getElementById('waitingModal');
    const input = document.getElementById('waitingLinkInput');
    if (input) input.value = inviteLink;
    if (modal) modal.style.display = 'flex';
}

function closeWaitingModal() {
    const modal = document.getElementById('waitingModal');
    if (modal) modal.style.display = 'none';
}

function cancelWaiting() {
    if (currentInviteId && database) {
        database.ref(`rpg_pvp_invites/${currentInviteId}`).remove();
    }
    closeWaitingModal();
    document.getElementById('battleLinkContainer').style.display = 'none';
    showToast('Battle dibatalkan.', 'info');
}

function copyBattleLink() {
    const input = document.getElementById('battleLinkInput');
    if (input) { input.select(); document.execCommand('copy'); showToast('Link disalin!', 'success'); }
}

function copyWaitingLink() {
    const input = document.getElementById('waitingLinkInput');
    if (input) { input.select(); document.execCommand('copy'); showToast('Link disalin!', 'success'); }
}

// ========== PVP BATTLE SYSTEM ==========
function listenForPvpBattles() {
    if (!database || !currentUserId) return;
    if (pvpBattleListener) pvpBattleListener.off();
    
    pvpBattleListener = database.ref('rpg_pvp_battles').on('child_added', (snapshot) => {
        const battle = snapshot.val();
        if (battle && battle.status === 'active' && (battle.player1Id === currentUserId || battle.player2Id === currentUserId)) {
            if (currentBattleId !== snapshot.key) startBattle(snapshot.key, battle);
        }
    });
    
    database.ref('rpg_pvp_battles').on('child_changed', (snapshot) => {
        const battle = snapshot.val();
        if (battle && currentBattleId === snapshot.key) updateBattleUI(battle);
    });
}

function startBattle(battleId, battleData) {
    currentBattleId = battleId;
    const isPlayer1 = battleData.player1Id === currentUserId;
    
    battleState = {
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
    
    document.getElementById('battlePlayerName').innerText = battleState.player.name;
    document.getElementById('battleEnemyName').innerText = battleState.opponent.name;
    document.getElementById('battlePlayerHp').innerText = `${battleState.player.hp}/${battleState.player.maxHp}`;
    document.getElementById('battlePlayerHpFill').style.width = `${(battleState.player.hp / battleState.player.maxHp) * 100}%`;
    document.getElementById('battlePlayerMp').innerText = `${battleState.player.mp}/${battleState.player.maxMp}`;
    document.getElementById('battlePlayerMpFill').style.width = `${(battleState.player.mp / battleState.player.maxMp) * 100}%`;
    document.getElementById('battleEnemyHp').innerText = `${battleState.opponent.hp}/${battleState.opponent.maxHp}`;
    document.getElementById('battleEnemyHpFill').style.width = `${(battleState.opponent.hp / battleState.opponent.maxHp) * 100}%`;
    document.getElementById('battleEnemyMp').innerText = `${battleState.opponent.mp}/${battleState.opponent.maxMp}`;
    document.getElementById('battleEnemyMpFill').style.width = `${(battleState.opponent.mp / battleState.opponent.maxMp) * 100}%`;
    document.getElementById('battleLog').innerHTML = battleState.log.map(l => `<p>${l}</p>`).join('');
    document.getElementById('battleModal').style.display = 'flex';
    updateBattleButtons();
}

function updateBattleButtons() {
    const isMyTurn = battleState && battleState.currentTurn === currentUserId;
    const btns = ['attackBtn', 'skillBtn', 'itemBtn'];
    btns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) { btn.disabled = !isMyTurn; btn.style.opacity = isMyTurn ? '1' : '0.5'; }
    });
}

function updateBattleUI(battleData) {
    if (!battleState) return;
    const isPlayer1 = battleData.player1Id === currentUserId;
    battleState.player.hp = isPlayer1 ? battleData.player1Hp : battleData.player2Hp;
    battleState.opponent.hp = isPlayer1 ? battleData.player2Hp : battleData.player1Hp;
    battleState.player.mp = isPlayer1 ? battleData.player1Mp : battleData.player2Mp;
    battleState.opponent.mp = isPlayer1 ? battleData.player2Mp : battleData.player1Mp;
    battleState.currentTurn = battleData.currentTurn;
    battleState.log = battleData.log || [];
    
    document.getElementById('battlePlayerHp').innerText = `${battleState.player.hp}/${battleState.player.maxHp}`;
    document.getElementById('battlePlayerHpFill').style.width = `${(battleState.player.hp / battleState.player.maxHp) * 100}%`;
    document.getElementById('battlePlayerMp').innerText = `${battleState.player.mp}/${battleState.player.maxMp}`;
    document.getElementById('battlePlayerMpFill').style.width = `${(battleState.player.mp / battleState.player.maxMp) * 100}%`;
    document.getElementById('battleEnemyHp').innerText = `${battleState.opponent.hp}/${battleState.opponent.maxHp}`;
    document.getElementById('battleEnemyHpFill').style.width = `${(battleState.opponent.hp / battleState.opponent.maxHp) * 100}%`;
    document.getElementById('battleEnemyMp').innerText = `${battleState.opponent.mp}/${battleState.opponent.maxMp}`;
    document.getElementById('battleEnemyMpFill').style.width = `${(battleState.opponent.mp / battleState.opponent.maxMp) * 100}%`;
    document.getElementById('battleLog').innerHTML = battleState.log.map(l => `<p>${l}</p>`).join('');
    updateBattleButtons();
    if (battleData.winner) endBattle(battleData.winner);
}

function calculateDamage(attack, defense) {
    return Math.max(1, Math.floor(attack - defense));
}

async function battleAttack() {
    if (!battleState || battleState.currentTurn !== currentUserId) { showToast('Bukan giliranmu!', 'error'); return; }
    const damage = calculateDamage(battleState.player.attack, battleState.opponent.defense);
    const isCritical = Math.random() < 0.1;
    const finalDamage = isCritical ? damage * 2 : damage;
    const newOpponentHp = Math.max(0, battleState.opponent.hp - finalDamage);
    await updateBattle({ opponentHp: newOpponentHp, currentTurn: battleState.opponent.id, log: `${battleState.player.name} menyerang! ${isCritical ? 'CRITICAL! ' : ''}Damage: ${finalDamage}` });
    if (newOpponentHp <= 0) await endBattle(currentUserId);
}

async function battleSkill() {
    if (!battleState || battleState.currentTurn !== currentUserId) { showToast('Bukan giliranmu!', 'error'); return; }
    let mpCost = 15, skillDamage = 0, skillName = "Skill";
    if (battleState.player.class === 'mage') { mpCost = 20; skillDamage = Math.floor(battleState.player.attack * 2); skillName = "Fireball"; }
    else if (battleState.player.class === 'archer') { mpCost = 15; const isCritical = Math.random() < 0.75; skillDamage = calculateDamage(battleState.player.attack, battleState.opponent.defense); if (isCritical) skillDamage *= 2; skillName = "Precision Shot"; }
    else { mpCost = 15; skillDamage = Math.floor(battleState.player.attack * 2.5); skillName = "Rage Slash"; }
    if (battleState.player.mp < mpCost) { showToast(`MP tidak cukup! Butuh ${mpCost} MP.`, 'error'); return; }
    const newPlayerMp = battleState.player.mp - mpCost;
    const newOpponentHp = Math.max(0, battleState.opponent.hp - skillDamage);
    await updateBattle({ opponentHp: newOpponentHp, playerMp: newPlayerMp, currentTurn: battleState.opponent.id, log: `${battleState.player.name} menggunakan ${skillName}! Damage: ${skillDamage}` });
    if (newOpponentHp <= 0) await endBattle(currentUserId);
}

async function battleUseItem() {
    if (!battleState || battleState.currentTurn !== currentUserId) { showToast('Bukan giliranmu!', 'error'); return; }
    if (!playerData.inventory?.potion || playerData.inventory.potion < 1) { 
        showToast('Tidak memiliki Potion!', 'error'); 
        return; 
    }
    const healAmount = 30;
    const newPlayerHp = Math.min(battleState.player.maxHp, battleState.player.hp + healAmount);
    playerData.inventory.potion--;
    await savePlayerDataToRPG();
    await updateBattle({ playerHp: newPlayerHp, currentTurn: battleState.opponent.id, log: `${battleState.player.name} menggunakan Potion! HP +${healAmount}` });
}

async function updateBattle(updates) {
    if (!currentBattleId || !database) return;
    const battleRef = database.ref(`rpg_pvp_battles/${currentBattleId}`);
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

async function endBattle(winnerId) {
    if (!currentBattleId || !database) return;
    const battleRef = database.ref(`rpg_pvp_battles/${currentBattleId}`);
    const snapshot = await battleRef.once('value');
    const battle = snapshot.val();
    if (!battle) return;
    await battleRef.update({ winner: winnerId, status: 'finished' });
    
    const isWinner = winnerId === currentUserId;
    if (isWinner) {
        playerData.pvpWins = (playerData.pvpWins || 0) + 1;
        playerData.gold += 100;
        showToast('🏆 Kemenangan PvP! +100 Gold', 'success');
    } else {
        playerData.pvpLosses = (playerData.pvpLosses || 0) + 1;
        const goldLost = Math.floor((playerData.gold || 0) * 0.05);
        playerData.gold = Math.max(0, (playerData.gold || 0) - goldLost);
        showToast(`💀 Kalah PvP! Uang berkurang ${formatGold(goldLost)}`, 'error');
    }
    playerData.lastPvp = Date.now();
    await savePlayerDataToRPG();
    updateUI();
    
    if (currentInviteId && database) database.ref(`rpg_pvp_invites/${currentInviteId}`).remove();
    setTimeout(() => closeBattleModal(), 3000);
}

function closeBattleModal() {
    document.getElementById('battleModal').style.display = 'none';
    currentBattleId = null;
    battleState = null;
}

// ========== INVENTORY ==========
function showInventory() {
    const container = document.getElementById('inventoryList');
    if (!playerData.inventory || Object.keys(playerData.inventory).length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;">Inventory kosong</div>';
    } else {
        container.innerHTML = Object.entries(playerData.inventory).map(([itemId, qty]) => {
            const item = shopItems[itemId];
            if (!item) return '';
            return `<div class="inventory-item"><div><div class="item-name">${item.name}</div><div class="item-desc">${item.desc || ''}</div></div><div class="item-quantity">x${qty}</div><button class="use-btn" onclick="useInventoryItem('${itemId}')">Gunakan</button></div>`;
        }).join('');
    }
    document.getElementById('inventoryModal').style.display = 'flex';
}

function useInventoryItem(itemId) {
    const item = shopItems[itemId];
    if (!item) return;
    if (item.type === 'heal') {
        if (playerData.hp >= playerData.maxHp) { showToast('HP sudah penuh!', 'error'); return; }
        playerData.hp = Math.min(playerData.maxHp, playerData.hp + item.value);
        showToast(`❤️ HP pulih ${item.value}!`, 'success');
    } else if (item.type === 'mana') {
        if (playerData.mp >= playerData.maxMp) { showToast('MP sudah penuh!', 'error'); return; }
        playerData.mp = Math.min(playerData.maxMp, playerData.mp + item.value);
        showToast(`🔵 MP pulih ${item.value}!`, 'success');
    }
    playerData.inventory[itemId]--;
    if (playerData.inventory[itemId] <= 0) delete playerData.inventory[itemId];
    savePlayerDataToRPG();
    updateUI();
    closeInventoryModal();
}

function closeInventoryModal() {
    document.getElementById('inventoryModal').style.display = 'none';
}

// ========== SAVE DATA TO RPG ==========
async function savePlayerDataToRPG() {
    if (!playerData || !database) return;
    try {
        await database.ref(`rpg_players/${currentUserId}`).update({
            hp: playerData.hp,
            mp: playerData.mp,
            gold: playerData.gold,
            inventory: playerData.inventory,
            pvpWins: playerData.pvpWins,
            pvpLosses: playerData.pvpLosses,
            lastPvp: playerData.lastPvp,
            lastUpdated: Date.now()
        });
        console.log('✅ Data saved to RPG');
    } catch (error) { console.error('Error saving:', error); }
}

// ========== UTILITIES ==========
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    } else { alert(message); }
}

// ========== START ==========
document.addEventListener('DOMContentLoaded', () => { init(); });

// ========== EXPORT GLOBAL FUNCTIONS ==========
window.createBattle = createBattle;
window.joinBattleByLink = joinBattleByLink;
window.invitePlayer = invitePlayer;
window.battleAttack = battleAttack;
window.battleSkill = battleSkill;
window.battleUseItem = battleUseItem;
window.closeBattleModal = closeBattleModal;
window.closeInventoryModal = closeInventoryModal;
window.showInventory = showInventory;
window.useInventoryItem = useInventoryItem;
window.copyBattleLink = copyBattleLink;
window.copyWaitingLink = copyWaitingLink;
window.cancelWaiting = cancelWaiting;
window.closeWaitingModal = closeWaitingModal;