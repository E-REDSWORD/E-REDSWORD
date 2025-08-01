// تهيئة Firebase
const db = firebase.firestore();

// عناصر الصفحة
const mainTitle = document.getElementById('main-title');
const mainDescription = document.getElementById('main-description');
const gameContainer = document.getElementById('game-list');
const siteLockedOverlay = document.getElementById('site-locked-overlay');
const sitePasswordForm = document.getElementById('site-password-form');
const gameLockedOverlay = document.getElementById('game-locked-overlay');
const gamePasswordForm = document.getElementById('game-password-form');

// دالة لتحميل محتوى الموقع
function loadSiteContent() {
    // جلب إعدادات الموقع
    db.collection("settings").doc("site-info").get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            mainTitle.textContent = data.title;
            mainDescription.textContent = data.description;
            document.body.style.backgroundImage = `url(${data.backgroundImage})`;
            document.title = data.title;
            
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
            // عرض الألعاب المرئية فقط
            if (game.isVisible) {
                const gameElement = document.createElement('div');
                gameElement.className = 'game-card';
                
                // إضافة أيقونة القفل إذا كانت اللعبة مقفلة
                const lockIcon = game.isLocked ? '<span class="lock-icon">🔒</span>' : '';

                gameElement.innerHTML = `
                    ${lockIcon}
                    <img src="${game.image}" alt="${game.name}">
                    <h3>${game.name}</h3>
                `;
                gameElement.addEventListener('click', () => {
                    // التحقق من قفل اللعبة
                    if (game.isLocked && !sessionStorage.getItem(`gameUnlocked-${doc.id}`)) {
                        gameLockedOverlay.style.display = 'flex';
                        gamePasswordForm['game-password-input'].value = '';
                        // يجب أن نقوم بإزالة المستمع القديم لمنع تكرار الأحداث
                        gamePasswordForm.replaceWith(gamePasswordForm.cloneNode(true));
                        const newGamePasswordForm = document.getElementById('game-password-form');
                        newGamePasswordForm.addEventListener('submit', (e) => {
                            e.preventDefault();
                            const password = newGamePasswordForm['game-password-input'].value;
                            if (password === game.gamePassword) {
                                sessionStorage.setItem(`gameUnlocked-${doc.id}`, 'true');
                                newGamePasswordForm.parentElement.style.display = 'none'; // إخفاء الشاشة
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
loadSiteContent();
