/* =============================================
   Firebase 設定ファイル
   ★ Firebaseコンソール > プロジェクト設定 から
     「マイアプリ」のSDK設定をここに貼り付けてください
   ============================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth }        from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage }     from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// ↓↓↓ この部分をFirebaseコンソールから取得した値に書き換えてください ↓↓↓
const firebaseConfig = {
  apiKey:            "AIzaSyA6Z_h9yY_BhG3QwHBPt7EZYJAFiQbiNb8",
  authDomain:        "mazekozemura-web.firebaseapp.com",
  projectId:         "mazekozemura-web",
  storageBucket:     "mazekozemura-web.firebasestorage.app",
  messagingSenderId: "82198995339",
  appId:             "1:82198995339:web:b9d4eb16a78a6fc3678f8e",
  measurementId:     "G-B9WRFB3H80"
};
// ↑↑↑ ここまで書き換え ↑↑↑

const app = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
