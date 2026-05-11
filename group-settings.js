// ========== GROUP & USER PROFILE SETTINGS ==========
// Fitur: Ganti profil grup, ganti profil user, status grup, status user

const IMGBB_API_KEY = 'a60507c67d4d1a5d3f6b0cecbb168314';

// Group Profile State
let groupProfile = {
    name: 'Global Chat+',
    photo: null,
    status: null,
    statusType: null, // 'text', 'image', 'video'
    statusExpiry: null
};

// User Profile State
let userProfiles = {};

// ========== UPLOAD KE IMGBB ==========
async function uploadToImgBB(file, isVideo = false) {
    const formData = new FormData();
    if (isVideo) {
        // Untuk video, kirim sebagai file biasa
        formData.append('image', file);
    } else {
        formData.append('image', file);
    }
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error(data?.error?.message || 'Upload gagal');
    return data.data.url;
}

// ========== GROUP PROFILE ==========
async function updateGroupProfile(type, value) {
    if (!isAdmin && !isOwner) {
        showToast('Hanya Admin/Owner yang bisa mengubah profil grup!', 'error');
        return false;
    }
    
    try {
        if (type === 'photo') {
            const file = value;
            if (!file.type.startsWith('image/')) {
                showToast('Harus file gambar!', 'error');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast('Maksimal 5MB!', 'error');
                return false;
            }
            
            showToast('Mengunggah foto grup...', 'info');
            const photoUrl = await uploadToImgBB(file);
            await database.ref('chat/groupProfile/photo').set(photoUrl);
            groupProfile.photo = photoUrl;
            showToast('Foto grup berhasil diubah!', 'success');
            updateGroupProfileUI();
            return true;
            
        } else if (type === 'name') {
            if (value.length < 3 || value.length > 30) {
                showToast('Nama grup 3-30 karakter!', 'error');
                return false;
            }
            await database.ref('chat/groupProfile/name').set(value);
            groupProfile.name = value;
            updateGroupProfileUI();
            showToast('Nama grup berhasil diubah!', 'success');
            return true;
        }
    } catch (error) {
        showToast('Gagal update profil grup: ' + error.message, 'error');
        return false;
    }
}

// ========== GROUP STATUS (Story) ==========
async function updateGroupStatus(type, content) {
    if (!isAdmin && !isOwner) {
        showToast('Hanya Admin/Owner yang bisa membuat status grup!', 'error');
        return false;
    }
    
    try {
        let statusData = {
            type: type,
            content: content,
            postedBy: currentUser,
            postedAt: Date.now(),
            expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 jam
        };
        
        if (type === 'image' && content instanceof File) {
            showToast('Mengunggah status gambar...', 'info');
            const imageUrl = await uploadToImgBB(content);
            statusData.content = imageUrl;
        } else if (type === 'video' && content) {
            // Video via URL
            if (!content.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
                showToast('URL video tidak valid!', 'error');
                return false;
            }
            statusData.content = content;
        } else if (type === 'text') {
            if (content.length > 500) {
                showToast('Status teks maksimal 500 karakter!', 'error');
                return false;
            }
            statusData.content = content;
        }
        
        await database.ref('chat/groupStatus').set(statusData);
        groupProfile.status = statusData;
        groupProfile.statusType = type;
        groupProfile.statusExpiry = statusData.expiry;
        
        // Kirim notifikasi ke semua user
        await database.ref('chat/notifications').push({
            type: 'group_status',
            message: `📢 Status grup baru dari ${currentUser}!`,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        showToast('Status grup berhasil diposting!', 'success');
        updateGroupStatusUI();
        return true;
        
    } catch (error) {
        showToast('Gagal posting status: ' + error.message, 'error');
        return false;
    }
}

// ========== USER PROFILE ==========
async function updateUserProfile(userId, username, profileData) {
    if (userId !== currentUserId && !isAdmin && !isOwner) {
        showToast('Anda tidak bisa mengubah profil orang lain!', 'error');
        return false;
    }
    
    try {
        const userProfileRef = database.ref(`chat/userProfiles/${userId}`);
        
        if (profileData.photo && profileData.photo instanceof File) {
            showToast('Mengunggah foto profil...', 'info');
            const photoUrl = await uploadToImgBB(profileData.photo);
            await userProfileRef.update({ photo: photoUrl });
        }
        
        if (profileData.bio) {
            if (profileData.bio.length > 200) {
                showToast('Bio maksimal 200 karakter!', 'error');
                return false;
            }
            await userProfileRef.update({ bio: profileData.bio });
        }
        
        if (profileData.status) {
            let statusData = {
                text: profileData.status.text,
                type: profileData.status.type,
                postedAt: Date.now(),
                expiry: Date.now() + (24 * 60 * 60 * 1000)
            };
            
            if (profileData.status.type === 'image' && profileData.status.file) {
                const imageUrl = await uploadToImgBB(profileData.status.file);
                statusData.imageUrl = imageUrl;
            }
            
            await userProfileRef.update({ status: statusData });
        }
        
        showToast('Profil berhasil diperbarui!', 'success');
        loadUserProfile(userId);
        return true;
        
    } catch (error) {
        showToast('Gagal update profil: ' + error.message, 'error');
        return false;
    }
}

async function loadUserProfile(userId) {
    try {
        const snapshot = await database.ref(`chat/userProfiles/${userId}`).once('value');
        const profile = snapshot.val() || {};
        userProfiles[userId] = profile;
        return profile;
    } catch (error) {
        console.error('Error loading profile:', error);
        return {};
    }
}

// ========== UI UPDATES ==========
function updateGroupProfileUI() {
    const groupAvatar = document.querySelector('.group-avatar img');
    const groupNameSpan = document.querySelector('.group-name');
    
    if (groupAvatar && groupProfile.photo) {
        groupAvatar.src = groupProfile.photo;
    }
    if (groupNameSpan && groupProfile.name) {
        groupNameSpan.textContent = groupProfile.name;
    }
}

function updateGroupStatusUI() {
    const statusContainer = document.querySelector('.group-status-container');
    if (!statusContainer) return;
    
    if (groupProfile.status && groupProfile.statusExpiry > Date.now()) {
        let statusHtml = '';
        if (groupProfile.statusType === 'text') {
            statusHtml = `<div class="group-status-text">📢 ${groupProfile.status.content}</div>`;
        } else if (groupProfile.statusType === 'image') {
            statusHtml = `<div class="group-status-image"><img src="${groupProfile.status.content}" onclick="previewImage('${groupProfile.status.content}')"></div>`;
        } else if (groupProfile.statusType === 'video') {
            statusHtml = `<div class="group-status-video"><video src="${groupProfile.status.content}" controls></video></div>`;
        }
        statusContainer.innerHTML = statusHtml + `<div class="group-status-by">Diposting oleh ${groupProfile.status.postedBy}</div>`;
        statusContainer.style.display = 'block';
    } else {
        statusContainer.style.display = 'none';
    }
}

// ========== LOAD PROFILES FROM FIREBASE ==========
async function loadGroupProfile() {
    if (!database) return;
    
    const groupProfileRef = database.ref('chat/groupProfile');
    groupProfileRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (data.name) groupProfile.name = data.name;
            if (data.photo) groupProfile.photo = data.photo;
            updateGroupProfileUI();
        }
    });
    
    const groupStatusRef = database.ref('chat/groupStatus');
    groupStatusRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.expiry > Date.now()) {
            groupProfile.status = data;
            groupProfile.statusType = data.type;
            groupProfile.statusExpiry = data.expiry;
            updateGroupStatusUI();
        } else {
            groupProfile.status = null;
            updateGroupStatusUI();
        }
    });
}

// ========== MODAL UNTUK EDIT PROFIL GRUP ==========
function showGroupProfileModal() {
    if (!isAdmin && !isOwner) {
        showToast('Hanya Admin/Owner yang bisa mengubah profil grup!', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="groupProfileModal" class="profile-modal">
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <i class="fas fa-users"></i>
                    <h3>Profil Grup</h3>
                    <button onclick="closeProfileModal()" class="close-modal-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="profile-modal-body">
                    <div class="profile-image-section">
                        <div class="current-profile-image">
                            ${groupProfile.photo ? `<img src="${groupProfile.photo}" id="groupPhotoPreview">` : '<i class="fas fa-users fa-3x"></i>'}
                        </div>
                        <button onclick="document.getElementById('groupPhotoInput').click()" class="btn-secondary">
                            <i class="fas fa-camera"></i> Ganti Foto Grup
                        </button>
                        <input type="file" id="groupPhotoInput" accept="image/*" style="display: none;">
                    </div>
                    <div class="profile-name-section">
                        <label>Nama Grup</label>
                        <input type="text" id="groupNameInput" value="${groupProfile.name}" maxlength="30">
                    </div>
                    <div class="profile-actions">
                        <button onclick="saveGroupProfile()" class="btn-primary"><i class="fas fa-save"></i> Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Hapus modal lama jika ada
    const oldModal = document.getElementById('groupProfileModal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('groupPhotoInput').addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('groupPhotoPreview');
                if (preview) preview.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
            window.pendingGroupPhoto = e.target.files[0];
        }
    });
}

async function saveGroupProfile() {
    const newName = document.getElementById('groupNameInput')?.value.trim();
    if (newName && newName !== groupProfile.name) {
        await updateGroupProfile('name', newName);
    }
    
    if (window.pendingGroupPhoto) {
        await updateGroupProfile('photo', window.pendingGroupPhoto);
        window.pendingGroupPhoto = null;
    }
    
    closeProfileModal();
}

// ========== MODAL UNTUK STATUS GRUP ==========
function showGroupStatusModal() {
    if (!isAdmin && !isOwner) {
        showToast('Hanya Admin/Owner yang bisa membuat status grup!', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="groupStatusModal" class="status-modal">
            <div class="status-modal-content">
                <div class="status-modal-header">
                    <i class="fas fa-star"></i>
                    <h3>Buat Status Grup</h3>
                    <button onclick="closeStatusModal()" class="close-modal-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="status-modal-body">
                    <div class="status-type-selector">
                        <button onclick="selectStatusType('text')" id="statusTypeTextBtn" class="type-btn active">Teks</button>
                        <button onclick="selectStatusType('image')" id="statusTypeImageBtn" class="type-btn">Gambar</button>
                        <button onclick="selectStatusType('video')" id="statusTypeVideoBtn" class="type-btn">Video (URL)</button>
                    </div>
                    <div id="statusTextInput" class="status-input-area">
                        <textarea id="statusText" placeholder="Tulis status grup..." maxlength="500"></textarea>
                    </div>
                    <div id="statusImageInput" class="status-input-area" style="display: none;">
                        <input type="file" id="statusImage" accept="image/*">
                        <div id="imagePreview"></div>
                    </div>
                    <div id="statusVideoInput" class="status-input-area" style="display: none;">
                        <input type="text" id="statusVideoUrl" placeholder="Masukkan URL video (mp4, webm, dll)">
                    </div>
                    <div class="status-actions">
                        <button onclick="postGroupStatus()" class="btn-primary"><i class="fas fa-paper-plane"></i> Posting Status</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const oldModal = document.getElementById('groupStatusModal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    window.selectedStatusType = 'text';
    
    document.getElementById('statusImage')?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('imagePreview');
                if (preview) preview.innerHTML = `<img src="${event.target.result}" style="max-width: 100%; max-height: 150px; border-radius: 8px;">`;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}

function selectStatusType(type) {
    window.selectedStatusType = type;
    
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`statusType${type.charAt(0).toUpperCase() + type.slice(1)}Btn`)?.classList.add('active');
    
    document.getElementById('statusTextInput').style.display = type === 'text' ? 'block' : 'none';
    document.getElementById('statusImageInput').style.display = type === 'image' ? 'block' : 'none';
    document.getElementById('statusVideoInput').style.display = type === 'video' ? 'block' : 'none';
}

async function postGroupStatus() {
    const type = window.selectedStatusType;
    
    if (type === 'text') {
        const text = document.getElementById('statusText')?.value.trim();
        if (!text) {
            showToast('Masukkan teks status!', 'error');
            return;
        }
        await updateGroupStatus('text', text);
    } else if (type === 'image') {
        const file = document.getElementById('statusImage')?.files[0];
        if (!file) {
            showToast('Pilih gambar!', 'error');
            return;
        }
        await updateGroupStatus('image', file);
    } else if (type === 'video') {
        const url = document.getElementById('statusVideoUrl')?.value.trim();
        if (!url) {
            showToast('Masukkan URL video!', 'error');
            return;
        }
        await updateGroupStatus('video', url);
    }
    
    closeStatusModal();
}

function closeProfileModal() {
    const modal = document.getElementById('groupProfileModal');
    if (modal) modal.remove();
}

function closeStatusModal() {
    const modal = document.getElementById('groupStatusModal');
    if (modal) modal.remove();
}

// Export functions
window.updateGroupProfile = updateGroupProfile;
window.updateGroupStatus = updateGroupStatus;
window.updateUserProfile = updateUserProfile;
window.showGroupProfileModal = showGroupProfileModal;
window.showGroupStatusModal = showGroupStatusModal;
window.closeProfileModal = closeProfileModal;
window.closeStatusModal = closeStatusModal;
window.selectStatusType = selectStatusType;
window.postGroupStatus = postGroupStatus;
window.saveGroupProfile = saveGroupProfile;