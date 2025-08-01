// تهيئة Firebase
const db = firebase.firestore();

// عناصر الصفحة
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

// تحميل إعدادات الموقع الحالية
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

// حفظ إعدادات الموقع
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
            console.error('خطأ في حفظ الإعدادات: ', error);
        });
});

// تحميل قائمة الألعاب
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

        // إضافة مستمعين لحدث التعديل والحذف
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => editGame(e.target.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteGame(e.target.dataset.id));
        });
    });
}

// فتح نافذة الإضافة/التعديل
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

// تعديل لعبة
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

// حفظ/تعديل لعبة
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
        // تعديل
        db.collection('games').doc(gameIdInput.value).update(gameData)
            .then(() => {
                alert('تم تحديث اللعبة بنجاح!');
                gameModal.style.display = 'none';
            })
            .catch(error => {
                console.error('خطأ في التحديث: ', error);
            });
    } else {
        // إضافة
        db.collection('games').add(gameData)
            .then(() => {
                alert('تم إضافة اللعبة بنجاح!');
                gameModal.style.display = 'none';
            })
            .catch(error => {
                console.error('خطأ في الإضافة: ', error);
            });
    }
});

// حذف لعبة
function deleteGame(id) {
    if (confirm('هل أنت متأكد من حذف هذه اللعبة؟')) {
        db.collection('games').doc(id).delete()
            .then(() => {
                alert('تم حذف اللعبة بنجاح!');
            })
            .catch(error => {
                console.error('خطأ في الحذف: ', error);
            });
    }
}

// تحميل الإعدادات وقائمة الألعاب عند فتح الصفحة
window.onload = () => {
    loadSiteSettings();
    loadGames();
};
