/* =============================================
   共通 認証ガード & ユーティリティ
   ============================================= */

import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

/** ログイン必須チェック。未ログインならログイン画面へリダイレクト */
export function requireAuth(onReady) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    const el = document.getElementById('admin-user-email');
    if (el) el.textContent = user.email;
    if (onReady) onReady(user);
  });
}

/** ログアウト */
export async function logout() {
  await signOut(auth);
  window.location.href = 'index.html';
}

/** トースト通知 */
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/** 確認ダイアログ（Promise） */
export function confirmDialog(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirm-overlay');
    const titleEl = document.getElementById('confirm-title');
    const msgEl   = document.getElementById('confirm-msg');
    const okBtn   = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    titleEl.textContent = title;
    msgEl.textContent   = message;
    overlay.classList.remove('hidden');

    const cleanup = (result) => {
      overlay.classList.add('hidden');
      okBtn.removeEventListener('click', okHandler);
      cancelBtn.removeEventListener('click', cancelHandler);
      resolve(result);
    };
    const okHandler     = () => cleanup(true);
    const cancelHandler = () => cleanup(false);
    okBtn.addEventListener('click', okHandler);
    cancelBtn.addEventListener('click', cancelHandler);
  });
}

/** 日付フォーマット（Firestoreタイムスタンプ → "2026.03.15"） */
export function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** カテゴリ → ラベル */
export const CATEGORY_LABELS = {
  event:  'イベント',
  report: 'レポート',
  info:   'お知らせ',
};
export const CATEGORY_CLASSES = {
  event:  'badge-event',
  report: 'badge-report',
  info:   'badge-info',
};
