/* =============================================
   公開ページ用 テキストコンテンツローダー
   Firestoreに登録されたテキストを各ページに適用
   ============================================= */
import { initializeApp }    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, getDocs }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyA6Z_h9yY_BhG3QwHBPt7EZYJAFiQbiNb8",
  authDomain:        "mazekozemura-web.firebaseapp.com",
  projectId:         "mazekozemura-web",
  storageBucket:     "mazekozemura-web.firebasestorage.app",
  messagingSenderId: "82198995339",
  appId:             "1:82198995339:web:b9d4eb16a78a6fc3678f8e"
};

const app = initializeApp(firebaseConfig, 'public-content');
const db  = getFirestore(app);

async function applySiteContent() {
  try {
    const snap = await getDocs(collection(db, 'site-content'));
    snap.forEach(docSnap => {
      const { text } = docSnap.data();
      if (!text) return;
      const key = docSnap.id;
      document.querySelectorAll(`[data-content-key="${key}"]`).forEach(el => {
        el.textContent = text;
      });
    });
  } catch (_) {
    /* Firebase 未設定 or オフライン時は静的表示のまま */
  }
}

applySiteContent();
