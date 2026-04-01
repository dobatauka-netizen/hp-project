import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// すでにログイン済みならダッシュボードへ
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = 'dashboard.html';
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl  = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  errorEl.textContent = '';
  btn.textContent = 'ログイン中…';
  btn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'dashboard.html';
  } catch (err) {
    const msgs = {
      'auth/invalid-credential':    'メールアドレスまたはパスワードが正しくありません',
      'auth/user-not-found':        'このメールアドレスは登録されていません',
      'auth/wrong-password':        'パスワードが正しくありません',
      'auth/too-many-requests':     'ログイン試行が多すぎます。しばらくしてからお試しください',
      'auth/network-request-failed':'ネットワークエラーが発生しました',
    };
    errorEl.textContent = msgs[err.code] || 'ログインに失敗しました';
    btn.textContent = 'ログイン';
    btn.disabled = false;
  }
});
