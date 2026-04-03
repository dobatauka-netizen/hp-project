/* =============================================
   公開ページ用 サイト画像ローダー
   Firestoreに登録された画像URLを各ページに適用
   ============================================= */
import { initializeApp }      from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
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

const app = initializeApp(firebaseConfig, 'public');
const db  = getFirestore(app);

async function applySiteImages() {
  try {
    const snap = await getDocs(collection(db, 'site-images'));
    snap.forEach(docSnap => {
      const { url } = docSnap.data();
      if (!url) return;
      const key = docSnap.id;

      document.querySelectorAll(`[data-img-key="${key}"]`).forEach(el => {
        if (el.tagName === 'IMG') {
          el.src = url;
          el.removeAttribute('hidden');
          el.style.display = 'block';
        } else {
          el.style.backgroundImage  = `url('${url}')`;
          el.style.backgroundSize   = 'cover';
          el.style.backgroundPosition = 'center';
          el.classList.add('has-image');
        }
      });
    });
  } catch (_) {
    /* Firebase 未設定 or オフライン時は静的表示のまま */
  }
}

applySiteImages();
