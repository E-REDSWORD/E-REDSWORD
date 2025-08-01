// تهيئة Firebase
const db = firebase.firestore();

// عناصر الصفحة
const mainHeader = document.querySelector('.main-header');
const heroBanner = document.getElementById('hero-banner');
const bannerTitle = document.getElementById('banner-title');
const bannerDescription = document.getElementById('banner-description');
const gameContainer = document.getElementById('game-list');
const categoriesList = document.getElementById('categories-list');
const siteLockedOverlay = document.getElementById('site-locked-overlay');
const sitePasswordForm = document.getElementById('site-password-form');
const gameLockedOverlay = document.getElementById('game-locked-overlay');
const gamePasswordForm = document.getElementById('game-password-form');

const mainNavToggle = document.getElementById('main-nav-toggle');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const mainNav = document.getElementById('main-nav');
const userActions = document.getElementById('user-actions');

let allGames = []; // متغير لتخزين جميع الألعاب مؤقتاً

// دالة لتحميل محتوى الموقع
function loadSiteContent() {
    db.collection("settings").doc("site-info").get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            mainHeader.querySelector('.logo h1').textContent = data.title;
            bannerTitle.textContent = data.title;
            bannerDescription.textContent = data.description;
            heroBanner.style.backgroundImage = `url(${data.backgroundImage})`;
            document.title = data.title;
            
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
    if (gamesToShow.length === 0) {
        gameContainer.innerHTML = '<p style="text-align:center; color:#999; font-size:1.2em;">لا توجد ألعاب لعرضها في هذه الفئة حالياً.</p>';
        return;
    }
    
    gamesToShow.forEach((game) => {
        const gameElement = document.createElement('a');
        gameElement.className = 'game-card';
        gameElement.href = 'javascript:void(0)';
        
        const lockIcon = game.isLocked ? '<span class="lock-icon">🔒</span>' : '';

        gameElement.innerHTML = `
            <img src="${game.image}" alt="${game.name}">
            <div class="game-card-content">
                <h3>${game.name}</h3>
            </div>
            ${lockIcon}
        `;
        
        gameElement.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (game.isLocked && !sessionStorage.getItem(`gameUnlocked-${game.id}`)) {
                gameLockedOverlay.style.display = 'flex';
                gamePasswordForm['game-password-input'].value = '';
                const newGamePasswordForm = gamePasswordForm.cloneNode(true);
                gamePasswordForm.parentNode.replaceChild(newGamePasswordForm, gamePasswordForm);
                
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

// وظيفة لتفعيل وإخفاء القائمة العلوية في وضع الموبايل
mainNavToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mainNav.classList.toggle('active');
    userActions.classList.toggle('active');
});

// وظيفة لتفعيل وإخفاء القائمة الجانبية في وضع الموبايل
sidebarToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('active');
});

// إغلاق القوائم عند الضغط خارجها
document.addEventListener('click', (e) => {
    if (mainNav.classList.contains('active') && !mainNav.contains(e.target) && !mainNavToggle.contains(e.target)) {
        mainNav.classList.remove('active');
        userActions.classList.remove('active');
    }
    if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('active');
    }
});


// تحميل المحتوى عند فتح الصفحة
loadSiteContent();
