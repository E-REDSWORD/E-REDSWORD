// A custom alert function to avoid using the native alert/confirm.
function showCustomAlert(title, message, isConfirm = false) {
    return new Promise(resolve => {
        const modalOverlay = document.getElementById('modal-overlay');
        const customAlert = document.getElementById('custom-alert');
        const alertTitle = customAlert.querySelector('h2');
        const alertMessage = customAlert.querySelector('p');
        const alertOkBtn = document.getElementById('alert-ok-btn');
        const alertCancelBtn = document.getElementById('alert-cancel-btn');

        alertTitle.textContent = title;
        alertMessage.textContent = message;
        
        // This is a special overlay for the admin page
        const adminModalOverlay = document.createElement('div');
        adminModalOverlay.className = 'modal-overlay';
        adminModalOverlay.id = 'admin-modal-overlay';
        adminModalOverlay.innerHTML = customAlert.outerHTML;
        document.body.appendChild(adminModalOverlay);
        
        const currentCustomAlert = adminModalOverlay.querySelector('#custom-alert');
        currentCustomAlert.classList.remove('hidden');
        
        const currentAlertOkBtn = adminModalOverlay.querySelector('#alert-ok-btn');
        const currentAlertCancelBtn = adminModalOverlay.querySelector('#alert-cancel-btn');

        currentAlertOkBtn.onclick = () => {
            adminModalOverlay.remove();
            resolve(true);
        };

        if (isConfirm) {
            currentAlertCancelBtn.classList.remove('hidden');
            currentAlertCancelBtn.onclick = () => {
                adminModalOverlay.remove();
                resolve(false);
            };
        } else {
            currentAlertCancelBtn.classList.add('hidden');
        }
    });
}
// Replace the native confirm with our custom one
window.confirm = (message) => showCustomAlert('تأكيد', message, true);
window.alert = (message) => showCustomAlert('تنبيه', message);

// Firebase Initialization
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM elements
const adminLoading = document.getElementById('admin-loading');
const adminContent = document.getElementById('admin-content');
const siteSettingsForm = document.getElementById('site-settings-form');
const siteTitleInput = document.getElementById('site-title');
const siteDescriptionInput = document.getElementById('site-description');
const siteBannerImageInput = document.getElementById('site-banner-image');
const sitePasswordInput = document.getElementById('site-password');
const isSiteLockedCheckbox = document.getElementById('is-site-locked');
const addGameBtn = document.getElementById('add-game-btn');
const gameListContainer = document.getElementById('game-list');
const gameModal = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const gameForm = document.getElementById('game-form');
const gameIdInput = document.getElementById('game-id');
const gameNameInput = document.getElementById('game-name');
const gameCategoryInput = document.getElementById('game-category');
const gameImageInput = document.getElementById('game-image');
const gameUrlInput = document.getElementById('game-url');
const isGameLockedCheckbox = document.getElementById('is-game-locked');
const gamePasswordInput = document.getElementById('game-password');
const isGameVisibleCheckbox = document.getElementById('is-game-visible');
const closeModalBtn = document.querySelector('.close-btn');

// Check admin privileges on page load
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().isAdmin) {
                // User is an admin, show content
                adminLoading.classList.add('hidden');
                adminContent.classList.remove('hidden');
                loadSiteSettings();
                loadGames();
            } else {
                // Not an admin, show error and redirect
                alert('ليس لديك صلاحيات الوصول إلى هذه الصفحة.');
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            alert('حدث خطأ أثناء التحقق من الصلاحيات.');
            window.location.href = 'index.html';
        }
    } else {
        // Not logged in, show error and redirect
        alert('الرجاء تسجيل الدخول للوصول إلى لوحة التحكم.');
        window.location.href = 'index.html';
    }
});

// Load site settings
function loadSiteSettings() {
    db.collection('settings').doc('site-info').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            siteTitleInput.value = data.title || '';
            siteDescriptionInput.value = data.description || '';
            siteBannerImageInput.value = data.backgroundImage || '';
            sitePasswordInput.value = data.sitePassword || '';
            isSiteLockedCheckbox.checked = data.isSiteLocked || false;
        }
    });
}

// Save site settings
siteSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = {
        title: siteTitleInput.value,
        description: siteDescriptionInput.value,
        backgroundImage: siteBannerImageInput.value,
        sitePassword: sitePasswordInput.value,
        isSiteLocked: isSiteLockedCheckbox.checked
    };
    db.collection('settings').doc('site-info').set(settings)
        .then(() => {
            alert('تم حفظ إعدادات الموقع بنجاح!');
        })
        .catch(error => {
            console.error('Error saving settings: ', error);
        });
});

// Load games list
function loadGames() {
    gameListContainer.innerHTML = '<p>جاري تحميل الألعاب...</p>';
    db.collection('games').onSnapshot(snapshot => {
        gameListContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const game = { id: doc.id, ...doc.data() };
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card-admin';
            gameCard.innerHTML = `
                <img src="${game.image}" alt="${game.name}">
                <div class="game-info">
                    <h3>${game.name}</h3>
                    <p>الفئة: ${game.category}</p>
                    <p>الحالة: ${game.isVisible ? 'ظاهر' : 'مخفي'}</p>
                </div>
                <div class="game-actions">
                    <button class="edit-btn" data-id="${game.id}">تعديل</button>
                    <button class="delete-btn" data-id="${game.id}">حذف</button>
                </div>
            `;
            gameListContainer.appendChild(gameCard);
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => editGame(e.target.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteGame(e.target.dataset.id));
        });
    });
}

// Open add/edit modal
addGameBtn.addEventListener('click', () => {
    modalTitle.textContent = 'إضافة لعبة جديدة';
    gameForm.reset();
    gameIdInput.value = '';
    gameModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    gameModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === gameModal) {
        gameModal.style.display = 'none';
    }
});

// Edit game
function editGame(id) {
    db.collection('games').doc(id).get().then(doc => {
        if (doc.exists) {
            const game = doc.data();
            modalTitle.textContent = 'تعديل اللعبة';
            gameIdInput.value = id;
            gameNameInput.value = game.name;
            gameCategoryInput.value = game.category;
            gameImageInput.value = game.image;
            gameUrlInput.value = game.url;
            isGameLockedCheckbox.checked = game.isLocked;
            gamePasswordInput.value = game.gamePassword;
            isGameVisibleCheckbox.checked = game.isVisible;
            gameModal.style.display = 'flex';
        }
    });
}

// Save/Update game
gameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const gameData = {
        name: gameNameInput.value,
        category: gameCategoryInput.value,
        image: gameImageInput.value,
        url: gameUrlInput.value,
        isLocked: isGameLockedCheckbox.checked,
        gamePassword: gamePasswordInput.value,
        isVisible: isGameVisibleCheckbox.checked
    };
    
    if (gameIdInput.value) {
        db.collection('games').doc(gameIdInput.value).update(gameData)
            .then(() => {
                alert('تم تحديث اللعبة بنجاح!');
                gameModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Error updating game: ', error);
            });
    } else {
        db.collection('games').add(gameData)
            .then(() => {
                alert('تم إضافة اللعبة بنجاح!');
                gameModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Error adding game: ', error);
            });
    }
});

// Delete game
function deleteGame(id) {
    confirm('هل أنت متأكد من حذف هذه اللعبة؟').then(result => {
        if (result) {
            db.collection('games').doc(id).delete()
                .then(() => {
                    alert('تم حذف اللعبة بنجاح!');
                })
                .catch(error => {
                    console.error('Error deleting game: ', error);
                });
        }
    });
}
