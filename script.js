// تهيئة Firebase
const db = firebase.firestore();

// عناصر الصفحة
const mainTitle = document.getElementById('main-title');
const mainDescription = document.getElementById('main-description');
const gameContainer = document.getElementById('game-list');
const gameContentContainer = document.getElementById('game-content');
const backButton = document.getElementById('back-button');
const siteLockedOverlay = document.getElementById('site-locked-overlay');
const sitePasswordForm = document.getElementById('site-password-form');
const gameLockedOverlay = document.getElementById('game-locked-overlay');
const gamePasswordForm = document.getElementById('game-password-form');

// دالة لتحميل محتوى اللعبة أو الصفحة الرئيسية
function loadContent(gameId) {
    // جلب إعدادات الموقع
    db.collection("settings").doc("site-info").get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            mainTitle.textContent = data.title;
            mainDescription.textContent = data.description;
            document.body.style.backgroundImage = `url(${data.backgroundImage})`;
            
            // التحقق من قفل الموقع
            if (data.isSiteLocked && !sessionStorage.getItem('siteUnlocked')) {
                siteLockedOverlay.style.display = 'flex';
                sitePasswordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const password = sitePasswordForm['site-password-input'].value;
                    if (password === data.sitePassword) {
                        sessionStorage.setItem('siteUnlocked', 'true');
                        siteLockedOverlay.style.display = 'none';
                        loadGameList(); // إعادة تحميل القائمة بعد فتح القفل
                    } else {
                        alert('كلمة المرور خاطئة!');
                    }
                });
                return;
            }
        }
        
        // إذا كان الموقع مفتوحاً، قم بتحميل قائمة الألعاب
        loadGameList();
    });
}

// دالة لتحميل قائمة الألعاب
function loadGameList() {
    gameContainer.innerHTML = ''; // تفريغ القائمة
    db.collection("games").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const game = doc.data();
            if (game.isVisible) {
                const gameElement = document.createElement('div');
                gameElement.className = 'game-card';
                gameElement.innerHTML = `
                    <img src="${game.image}" alt="${game.name}">
                    <h3>${game.name}</h3>
                `;
                gameElement.addEventListener('click', () => {
                    // التحقق من قفل اللعبة
                    if (game.isLocked && !sessionStorage.getItem(`gameUnlocked-${doc.id}`)) {
                        gameLockedOverlay.style.display = 'flex';
                        gamePasswordForm['game-password-input'].value = '';
                        gamePasswordForm.addEventListener('submit', (e) => {
                            e.preventDefault();
                            const password = gamePasswordForm['game-password-input'].value;
                            if (password === game.gamePassword) {
                                sessionStorage.setItem(`gameUnlocked-${doc.id}`, 'true');
                                gameLockedOverlay.style.display = 'none';
                                window.location.href = `game.html?id=${doc.id}`;
                            } else {
                                alert('كلمة المرور خاطئة!');
                            }
                        });
                    } else {
                        window.location.href = `game.html?id=${doc.id}`;
                    }
                });
                gameContainer.appendChild(gameElement);
            }
        });
    });
}

// تحميل المحتوى عند فتح الصفحة
loadContent();
