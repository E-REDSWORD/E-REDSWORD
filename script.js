// هذا السطر يخبر الكود أننا نريد استخدام قاعدة البيانات
const db = firebase.firestore();

// 1. جلب بيانات الموقع الرئيسية من Firestore
db.collection("settings").doc("site-info").get().then((doc) => {
    // إذا وجد الكود البيانات
    if (doc.exists) {
        const data = doc.data();
        // يضع عنوان الموقع في مكانه
        document.getElementById('site-title').textContent = data.title;
        // يضع الوصف في مكانه
        document.getElementById('site-description').textContent = data.description;
        // يغير صورة الخلفية
        document.body.style.backgroundImage = `url('${data.backgroundImage}')`;
    }
});

// 2. جلب قائمة الألعاب من Firestore
const gamesListElement = document.getElementById('games-list');
db.collection("games").where("isVisible", "==", true).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        const game = doc.data();
        const li = document.createElement('li');
        const a = document.createElement('a');
        
        // يحدد أن الرابط سيشير إلى اللعبة (مثلاً: #game1)
        a.href = `#${doc.id}`;
        a.textContent = game.name;
        
        li.appendChild(a);
        // يضيف اللعبة إلى القائمة
        gamesListElement.appendChild(li);
    });
});

// 3. هذا الكود هو الذي يقوم بتحميل اللعبة داخل الصفحة
function loadGame(gameId) {
    const gameContainer = document.getElementById('game-container');
    
    // إذا كان هناك اسم للعبة في الرابط
    if (gameId) {
        // نغير محتوى هذا الجزء من الصفحة إلى إطار (iframe) يحمل اللعبة
        gameContainer.innerHTML = `<iframe src="/games/${gameId}.html" frameborder="0"></iframe>`;
    } else {
        // إذا لم يكن هناك لعبة محددة، نظهر رسالة ترحيبية أو أي شيء آخر
        gameContainer.innerHTML = '<h2>اختر لعبة من القائمة.</h2>';
    }
}

// 4. هذا الكود يراقب التغييرات في الرابط
// عندما يضغط المستخدم على رابط اللعبة (مثلاً: #game1)، يتغير الرابط ويقوم هذا الكود بتشغيل وظيفة loadGame
window.addEventListener('hashchange', () => {
    const gameId = window.location.hash.slice(1);
    loadGame(gameId);
});

// 5. هذا الكود مهم جداً!
// عندما يفتح المستخدم الموقع لأول مرة، يتأكد هذا الكود من قراءة الرابط وتحميل أي لعبة محددة فيه
window.addEventListener('DOMContentLoaded', () => {
    const initialGameId = window.location.hash.slice(1);
    loadGame(initialGameId);
});