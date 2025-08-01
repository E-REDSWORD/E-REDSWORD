// تهيئة Firebase
const db = firebase.firestore();

// عناصر الصفحة
const mainHeader = document.querySelector('.main-header');
const pageTitle = document.getElementById('page-title');
const pageDescription = document.getElementById('page-description');
const gameContainer = document.getElementById('game-list');
const categoriesList = document.getElementById('categories-list');
const siteLockedOverlay = document.getElementById('site-locked-overlay');
const sitePasswordForm = document.getElementById('site-password-form');
const gameLockedOverlay = document.getElementById('game-locked-overlay');
const gamePasswordForm = document.getElementById('game-password-form');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const sidebar = document.querySelector('.sidebar');
const mainNav = document.querySelector('.main-nav');
const userActions = document.querySelector('.user-actions');

let allGames = []; // متغير لتخزين جميع الألعاب مؤقتاً

// دالة لتحميل محتوى الموقع
function loadSiteContent() {
    // جلب إعدادات الموقع
    db.collection("settings").doc("site-info").get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            // تحديث محتوى الصفحة
            mainHeader.querySelector('.logo h1').textContent = data.title;
            pageTitle.textContent = data.description;
            pageDescription.textContent = "استمتع بأفضل تجربة لعب."; // يمكنك تغيير هذا الوصف من لوحة التحكم لاحقاً
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
                        loadGameList();
                    } else {
                        alert('كلمة المرور خاطئة!');
                    }
                });
                return;
            }
        }
        
        loadGameList();
    });
}

// دالة لتحميل قائمة الألعاب
function loadGameList() {
    db.collection("games").get().then((querySnapshot) => {
        allGames = [];
        querySnapshot.forEach((doc) => {
            const game = { id: doc.id, ...doc.data() };
            if (game.isVisible) {
                allGames.push(game);
            }
        });
        displayGames(allGames);
    });
}

// دالة لعرض الألعاب في الصفحة
function displayGames(gamesToShow) {
    gameContainer.innerHTML = '';
    gamesToShow.forEach((game) => {
        const gameElement = document.createElement('div');
        gameElement.className = 'game-card';
        
        const lockIcon = game.isLocked ? '<span class="lock-icon">🔒</span>' : '';

        gameElement.innerHTML = `
            ${lockIcon}
            <img src="${game.image}" alt="${game.name}">
            <h3>${game.name}</h3>
        `;
        gameElement.addEventListener('click', () => {
            if (game.isLocked && !sessionStorage.getItem(`gameUnlocked-${game.id}`)) {
                gameLockedOverlay.style.display = 'flex';
                gamePasswordForm['game-password-input'].value = '';
                gamePasswordForm.replaceWith(gamePasswordForm.cloneNode(true));
                const newGamePasswordForm = document.getElementById('game-password-form');
                newGamePasswordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const password = newGamePasswordForm['game-password-input'].value;
                    if (password === game.gamePassword) {
                        sessionStorage.setItem(`gameUnlocked-${game.id}`, 'true');
                        newGamePasswordForm.parentElement.style.display = 'none';
                        window.location.href = `game.html?id=${game.id}`;
                    } else {
                        alert('كلمة المرور خاطئة!');
                    }
                });
            } else {
                window.location.href = `game.html?id=${game.id}`;
            }
        });
        gameContainer.appendChild(gameElement);
    });
}

// دالة لتصفية الألعاب حسب الفئة
function filterGames(category) {
    document.querySelectorAll('#categories-list a').forEach(link => {
        link.classList.remove('active-category');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active-category');
    
    let filteredGames = [];
    if (category === 'all') {
        filteredGames = allGames;
    } else {
        filteredGames = allGames.filter(game => game.category === category);
    }
    displayGames(filteredGames);
}

// إضافة مستمعين للأحداث لروابط الفئات
document.querySelectorAll('#categories-list a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.getAttribute('data-category');
        filterGames(category);
    });
});

// وظيفة لتفعيل وإخفاء القائمة الجانبية في وضع الموبايل
mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    mainNav.classList.toggle('active');
    userActions.classList.toggle('active');
});

// تحميل المحتوى عند فتح الصفحة
loadSiteContent();
