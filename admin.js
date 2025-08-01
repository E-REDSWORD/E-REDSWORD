// تهيئة Firebase
const db = firebase.firestore();
const auth = firebase.auth();

// عناصر الصفحة
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const mainContentForm = document.getElementById('main-content-form');
const gamesListElement = document.getElementById('games-list');
const addGameForm = document.getElementById('add-game-form');

// 1. التعامل مع تسجيل الدخول والخروج
auth.onAuthStateChanged((user) => {
    if (user) {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        document.getElementById('admin-user-email').textContent = user.email;
        loadAdminData();
    } else {
        loginSection.style.display = 'flex';
        adminPanel.style.display = 'none';
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    const errorMessage = document.getElementById('login-error-message');
    errorMessage.style.display = 'none';

    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            errorMessage.textContent = 'خطأ في البريد الإلكتروني أو كلمة المرور.';
            errorMessage.style.display = 'block';
        });
});

logoutButton.addEventListener('click', () => {
    auth.signOut();
});

// 2. دالة لجلب البيانات من Firestore وملء النماذج
function loadAdminData() {
    // جلب بيانات الصفحة الرئيسية
    db.collection("settings").doc("site-info").get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('site-title').value = data.title;
            document.getElementById('site-description').value = data.description;
            document.getElementById('background-image-url').value = data.backgroundImage;
        }
    });

    // جلب بيانات الألعاب
    db.collection("games").get().then((querySnapshot) => {
        gamesListElement.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const game = doc.data();
            const div = document.createElement('div');
            div.className = 'game-item';
            div.innerHTML = `
                <h3>${game.name}</h3>
                <form data-docid="${doc.id}">
                    <label>اسم اللعبة</label>
                    <input type="text" value="${game.name}" data-field="name">
                    <label>رابط اللعبة</label>
                    <input type="text" value="${game.url}" data-field="url">
                    <label>رابط صورة اللعبة</label>
                    <input type="text" value="${game.image}" data-field="image">
                    
                    <label>
                        <input type="checkbox" ${game.isVisible ? 'checked' : ''} data-field="isVisible">
                        عرض اللعبة على الموقع
                    </label>

                    <div class="game-actions">
                        <button type="submit" class="update-btn">حفظ التعديل</button>
                        <button type="button" class="delete-btn" data-docid="${doc.id}">حذف</button>
                    </div>
                </form>
            `;
            gamesListElement.appendChild(div);

            // إضافة مستمع للأحداث لكل نموذج تعديل لعبة
            div.querySelector('form').addEventListener('submit', (e) => {
                e.preventDefault();
                const form = e.target;
                const docId = form.getAttribute('data-docid');
                const updatedData = {
                    name: form.querySelector('[data-field="name"]').value,
                    url: form.querySelector('[data-field="url"]').value,
                    image: form.querySelector('[data-field="image"]').value,
                    isVisible: form.querySelector('[data-field="isVisible"]').checked
                };
                updateFirestoreData('games', docId, updatedData);
            });

            // إضافة مستمع للأحداث لزر الحذف
            div.querySelector('.delete-btn').addEventListener('click', (e) => {
                const docId = e.target.getAttribute('data-docid');
                if (confirm('هل أنت متأكد من حذف هذه اللعبة؟')) {
                    deleteFirestoreDocument('games', docId);
                }
            });
        });
    });
}

// 3. دالة لحفظ التعديلات في Firestore
mainContentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const updatedData = {
        title: document.getElementById('site-title').value,
        description: document.getElementById('site-description').value,
        backgroundImage: document.getElementById('background-image-url').value
    };
    updateFirestoreData('settings', 'site-info', updatedData, 'main-content-success');
});

// 4. دالة لإضافة لعبة جديدة
addGameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newGameData = {
        name: addGameForm['new-game-name'].value,
        url: addGameForm['new-game-url'].value,
        image: addGameForm['new-game-image'].value,
        isVisible: addGameForm['new-game-isVisible'].checked,
    };

    db.collection('games').add(newGameData)
        .then(() => {
            addGameForm.reset();
            loadAdminData();
            const successElement = document.getElementById('add-game-success');
            successElement.style.display = 'block';
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 3000);
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });
});

// دالة عامة لتحديث البيانات في Firestore
function updateFirestoreData(collection, docId, data, successMessageId) {
    db.collection(collection).doc(docId).update(data)
        .then(() => {
            if(successMessageId) {
                const messageElement = document.getElementById(successMessageId);
                messageElement.style.display = 'block';
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 3000);
            }
            console.log("Document successfully updated!");
        })
        .catch((error) => {
            console.error("Error updating document: ", error);
        });
}

// دالة عامة لحذف مستند من Firestore
function deleteFirestoreDocument(collection, docId) {
    db.collection(collection).doc(docId).delete()
        .then(() => {
            console.log("Document successfully deleted!");
            loadAdminData();
        })
        .catch((error) => {
            console.error("Error removing document: ", error);
        });
}
