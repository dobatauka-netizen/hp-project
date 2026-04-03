import { auth } from './firebase-config.js';
import { requireAuth, logout, showToast, confirmDialog } from './auth.js';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { db } from './firebase-config.js';
import {
  collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

requireAuth(async (currentUser) => {
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('current-email').textContent = currentUser.email;
  await loadAdmins();
  bindEvents(currentUser);
  bindPasswordChange(currentUser);
});

async function loadAdmins() {
  const tbody = document.getElementById('admin-tbody');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="3">読み込み中…</td></tr>';

  const snap = await getDocs(query(collection(db, 'admins'), orderBy('createdAt', 'asc')));
  const admins = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  document.getElementById('admin-count').textContent = admins.length;

  if (admins.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3"><div class="empty-state"><div class="empty-icon">👤</div><p>管理者が登録されていません</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = admins.map(a => `
    <tr>
      <td>${escHtml(a.email)}</td>
      <td>${escHtml(a.name || '—')}</td>
      <td>
        <button class="btn btn-sm btn-delete" onclick="removeAdmin('${a.id}', '${escHtml(a.email)}')">削除</button>
      </td>
    </tr>`).join('');
}

function bindEvents(currentUser) {
  document.getElementById('btn-add-admin').addEventListener('click', () => {
    document.getElementById('add-modal').classList.remove('hidden');
    document.getElementById('new-email').focus();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('add-form').addEventListener('submit', (e) => addAdmin(e, currentUser));
}

function closeModal() {
  document.getElementById('add-modal').classList.add('hidden');
  document.getElementById('add-form').reset();
  document.getElementById('add-error').textContent = '';
}

async function addAdmin(e, currentUser) {
  e.preventDefault();
  const email    = document.getElementById('new-email').value.trim();
  const name     = document.getElementById('new-name').value.trim();
  const password = document.getElementById('new-password').value;
  const errorEl  = document.getElementById('add-error');
  const saveBtn  = document.getElementById('btn-save');

  errorEl.textContent = '';
  saveBtn.disabled = true;
  saveBtn.textContent = '追加中…';

  try {
    // Firebase Auth にユーザー作成
    await createUserWithEmailAndPassword(auth, email, password);

    // Firestore に管理者情報を保存
    await addDoc(collection(db, 'admins'), {
      email, name,
      addedBy: currentUser.email,
      createdAt: serverTimestamp()
    });

    showToast(`${email} を管理者に追加しました`);
    closeModal();
    await loadAdmins();
  } catch (err) {
    const msgs = {
      'auth/email-already-in-use': 'このメールアドレスはすでに登録されています',
      'auth/weak-password':        'パスワードは6文字以上にしてください',
      'auth/invalid-email':        '有効なメールアドレスを入力してください',
    };
    errorEl.textContent = msgs[err.code] || '追加に失敗しました: ' + err.message;
    saveBtn.disabled = false;
    saveBtn.textContent = '追加する';
  }
}

window.removeAdmin = async (id, email) => {
  const ok = await confirmDialog(
    '管理者を削除しますか？',
    `${email} のアクセス権を削除します。この操作はFirebaseコンソールからも認証を削除してください。`
  );
  if (!ok) return;
  try {
    await deleteDoc(doc(db, 'admins', id));
    showToast('管理者情報を削除しました');
    await loadAdmins();
  } catch (err) {
    showToast('削除に失敗しました', 'error');
  }
};

function bindPasswordChange(currentUser) {
  document.getElementById('btn-change-pw').addEventListener('click', async () => {
    const current  = document.getElementById('pw-current').value;
    const newPw    = document.getElementById('pw-new').value;
    const confirm  = document.getElementById('pw-confirm').value;
    const errorEl  = document.getElementById('pw-error');
    const btn      = document.getElementById('btn-change-pw');

    errorEl.textContent = '';

    if (!current || !newPw || !confirm) {
      errorEl.textContent = 'すべての項目を入力してください';
      return;
    }
    if (newPw.length < 6) {
      errorEl.textContent = '新しいパスワードは6文字以上にしてください';
      return;
    }
    if (newPw !== confirm) {
      errorEl.textContent = '新しいパスワードが一致しません';
      return;
    }

    btn.disabled = true;
    btn.textContent = '変更中…';

    try {
      // 再認証してからパスワード更新
      const credential = EmailAuthProvider.credential(currentUser.email, current);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);

      document.getElementById('pw-current').value = '';
      document.getElementById('pw-new').value = '';
      document.getElementById('pw-confirm').value = '';
      showToast('パスワードを変更しました');
    } catch (err) {
      const msgs = {
        'auth/wrong-password':       '現在のパスワードが正しくありません',
        'auth/too-many-requests':    'しばらく待ってから再試行してください',
        'auth/weak-password':        'パスワードは6文字以上にしてください',
        'auth/requires-recent-login':'再度ログインし直してから変更してください',
      };
      errorEl.textContent = msgs[err.code] || '変更に失敗しました: ' + err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'パスワードを変更する';
    }
  });
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
