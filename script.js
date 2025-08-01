// A custom alert function to avoid using the native alert which can be blocked by browsers.
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
        modalOverlay.classList.remove('hidden');
        customAlert.classList.remove('hidden');

        alertOkBtn.onclick = () => {
            modalOverlay.classList.add('hidden');
            customAlert.classList.add('hidden');
            resolve(true);
        };

        if (isConfirm) {
            alertCancelBtn.classList.remove('hidden');
            alertCancelBtn.onclick = () => {
                modalOverlay.classList.add('hidden');
                customAlert.classList.add('hidden');
                resolve(false);
            };
        } else {
            alertCancelBtn.classList.add('hidden');
        }
    });
}

// Global variable to replace the native alert
window.alert = (message) => showCustomAlert('تنبيه', message);
window.confirm = (message) => showCustomAlert('تأكيد', message, true);

// Firebase Initialization
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
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
const searchInput = document.getElementById('search-input');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const userProfile = document.getElementById('user-profile');
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');
const adminLink = document.getElementById('admin-link');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const modalOverlay = document.getElementById('modal-overlay');
const closeBtns = document.querySelectorAll('.modal-form .close-btn');

// Game Player Elements
const gamePlayerOverlay = document.getElementById('game-player-overlay');
const gamePlayerTitle = document.getElementById('game-player-title');
const gamePlayerIframe = document.getElementById('game-player-iframe');
const closeGameBtn = document.getElementById('close-game-btn');

let allGames = []; // Stores all games
let currentUser = null; // Stores the current authenticated user

// Function to handle user authentication state changes
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
        userActions.querySelector('#login-btn').classList.add('hidden');
        userActions.querySelector('#signup-btn').classList.add('hidden');
        userProfile.classList.remove('hidden');
        userDisplayName.textContent = user.displayName || user.email;

        // Check if the user is an admin
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().isAdmin) {
            adminLink.classList.remove('hidden');
        } else {
            adminLink.classList.add('hidden');
        }
    } else {
        userActions.querySelector('#login-btn').classList.remove('hidden');
        userActions.querySelector('#signup-btn').classList.remove('hidden');
        userProfile.classList.add('hidden');
        adminLink.classList.add('hidden');
    }
});

// Event listeners for login/signup/logout
loginBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('hidden');
    loginModal.classList.remove('hidden');
});

signupBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('hidden');
    signupModal.classList.remove('hidden');
});

logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        alert('تم تسجيل الخروج بنجاح!');
    } catch (error) {
        console.error('Error signing out:', error);
        alert('حدث خطأ أثناء تسجيل الخروج.');
    }
});

// Close modals
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        loginModal.classList.add('hidden');
        signupModal.classList.add('hidden');
    });
});
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.add('hidden');
        loginModal.classList.add('hidden');
        signupModal.classList.add('hidden');
    }
});

// Login and Signup Forms
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert('تم تسجيل الدخول بنجاح!');
        modalOverlay.classList.add('hidden');
        loginModal.classList.add('hidden');
    } catch (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message);
    }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        alert('تم إنشاء الحساب بنجاح!');
        modalOverlay.classList.add('hidden');
        signupModal.classList.add('hidden');
    } catch (error) {
        alert('خطأ في إنشاء الحساب: ' + error.message);
    }
});

// Load site content from Firestore
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
                siteLockedOverlay.classList.remove('hidden');
                sitePasswordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const password = sitePasswordForm['site-password-input'].value;
                    if (password === data.sitePassword) {
                        sessionStorage.setItem('siteUnlocked', 'true');
                        siteLockedOverlay.classList.add('hidden');
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

// Load all games from Firestore
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

// Display games on the page
function displayGames(gamesToShow) {
    gameContainer.innerHTML = '';
    if (gamesToShow.length === 0) {
        gameContainer.innerHTML = '<p style="text-align:center; color:#999; font-size:1.2em;">لا توجد ألعاب لعرضها حالياً.</p>';
        return;
    }
    
    gamesToShow.forEach((game) => {
        const gameElement = document.createElement('a');
        gameElement.className = 'game-card';
        gameElement.href = 'javascript:void(0)';
        gameElement.dataset.id = game.id;
        
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
                gameLockedOverlay.classList.remove('hidden');
                gamePasswordForm['game-password-input'].value = '';
                
                // Clone the form to reset the event listener
                const newGamePasswordForm = gamePasswordForm.cloneNode(true);
                gamePasswordForm.parentNode.replaceChild(newGamePasswordForm, gamePasswordForm);

                newGamePasswordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const password = newGamePasswordForm['game-password-input'].value;
                    if (password === game.gamePassword) {
                        sessionStorage.setItem(`gameUnlocked-${game.id}`, 'true');
                        gameLockedOverlay.classList.add('hidden');
                        loadAndShowGame(game);
                    } else {
                        alert('كلمة المرور خاطئة!');
                    }
                });
            } else {
                loadAndShowGame(game);
            }
        });
        gameContainer.appendChild(gameElement);
    });
}

// Function to load and show the game in the overlay
function loadAndShowGame(game) {
    gamePlayerTitle.textContent = game.name;
    gamePlayerIframe.src = game.url;
    gamePlayerOverlay.classList.remove('hidden');
}

// Close the game player overlay
closeGameBtn.addEventListener('click', () => {
    gamePlayerOverlay.classList.add('hidden');
    gamePlayerIframe.src = ''; // Stop the game from running in the background
});
gamePlayerOverlay.addEventListener('click', (e) => {
    if (e.target === gamePlayerOverlay) {
        gamePlayerOverlay.classList.add('hidden');
        gamePlayerIframe.src = '';
    }
});

// Filter games by category
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

// Search functionality
function searchGames(query) {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredGames = allGames.filter(game => {
        const normalizedGameName = game.name.toLowerCase();
        return normalizedGameName.includes(normalizedQuery);
    });
    displayGames(filteredGames);
}

// Add event listeners for categories and search
document.querySelectorAll('#categories-list a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.getAttribute('data-category');
        filterGames(category);
    });
});

searchInput.addEventListener('input', (e) => {
    searchGames(e.target.value);
});


// Mobile menu toggles
mainNavToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mainNav.classList.toggle('active');
    userActions.classList.toggle('active');
    searchInput.parentElement.classList.toggle('active');
});

sidebarToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    const isClickInsideHeader = mainHeader.contains(e.target);
    const isClickInsideSidebar = sidebar.contains(e.target);
    const isClickInsideModals = modalOverlay.contains(e.target) || gamePlayerOverlay.contains(e.target);
    
    if (!isClickInsideHeader && mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        userActions.classList.remove('active');
        searchInput.parentElement.classList.remove('active');
    }
    if (!isClickInsideSidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
});

// Initial content load
loadSiteContent();
