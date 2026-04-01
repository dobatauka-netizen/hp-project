import { db } from './firebase-config.js';
import { requireAuth, logout, showToast, confirmDialog, formatDate, CATEGORY_LABELS, CATEGORY_CLASSES } from './auth.js';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let allDocs = [];
let editingId = null;

requireAuth(async () => {
  document.getElementById('logout-btn').addEventListener('click', logout);
  await loadNews();
  bindEvents();
});

/* ─── 一覧読み込み ─── */
async function loadNews() {
  const tbody = document.getElementById('news-tbody');
  tbody.innerHTML = '<tr class="loading-row"><td colspan="5">読み込み中…</td></tr>';

  const q = query(collection(db, 'news'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderTable(allDocs);
}

function renderTable(docs) {
  const tbody = document.getElementById('news-tbody');
  const count = document.getElementById('news-count');
  count.textContent = docs.length;

  if (docs.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>記事がまだありません。「新規作成」から追加してください。</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = docs.map(d => `
    <tr data-id="${d.id}">
      <td style="white-space:nowrap">${formatDate(d.date)}</td>
      <td><span class="badge ${CATEGORY_CLASSES[d.category] || ''}">${CATEGORY_LABELS[d.category] || d.category}</span></td>
      <td style="max-width:340px">${escHtml(d.title)}</td>
      <td><span class="badge ${d.published ? 'badge-pub' : 'badge-draft'}">${d.published ? '公開中' : '下書き'}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-edit" onclick="editNews('${d.id}')">編集</button>
          <button class="btn btn-sm btn-delete" onclick="deleteNews('${d.id}')">削除</button>
        </div>
      </td>
    </tr>`).join('');
}

/* ─── イベントバインド ─── */
function bindEvents() {
  // 新規作成ボタン
  document.getElementById('btn-new').addEventListener('click', () => openModal(null));

  // モーダル閉じる
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // フォーム送信
  document.getElementById('news-form').addEventListener('submit', saveNews);

  // フィルター
  document.getElementById('filter-cat').addEventListener('change', applyFilter);
  document.getElementById('filter-status').addEventListener('change', applyFilter);
  document.getElementById('search-input').addEventListener('input', applyFilter);
}

function applyFilter() {
  const cat    = document.getElementById('filter-cat').value;
  const status = document.getElementById('filter-status').value;
  const kw     = document.getElementById('search-input').value.toLowerCase();

  const filtered = allDocs.filter(d => {
    if (cat    && d.category !== cat)              return false;
    if (status === 'pub'   && !d.published)         return false;
    if (status === 'draft' &&  d.published)         return false;
    if (kw && !d.title.toLowerCase().includes(kw)) return false;
    return true;
  });
  renderTable(filtered);
}

/* ─── モーダル ─── */
function openModal(id) {
  editingId = id;
  const form = document.getElementById('news-form');
  form.reset();

  const title = document.getElementById('modal-title');

  if (id) {
    title.textContent = '記事を編集';
    const item = allDocs.find(d => d.id === id);
    if (!item) return;
    document.getElementById('f-title').value     = item.title;
    document.getElementById('f-category').value  = item.category;
    document.getElementById('f-body').value      = item.body || '';
    document.getElementById('f-published').checked = item.published;
    // 日付変換 (Timestamp → input[date] 形式)
    if (item.date) {
      const dt = item.date.toDate();
      document.getElementById('f-date').value = dt.toISOString().slice(0, 10);
    }
  } else {
    title.textContent = '新規記事を作成';
    document.getElementById('f-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('f-published').checked = true;
  }

  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('f-title').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  editingId = null;
}

/* ─── 保存 ─── */
async function saveNews(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('btn-save');
  saveBtn.disabled = true;
  saveBtn.textContent = '保存中…';

  const dateVal = document.getElementById('f-date').value;
  const data = {
    title:     document.getElementById('f-title').value.trim(),
    category:  document.getElementById('f-category').value,
    body:      document.getElementById('f-body').value.trim(),
    published: document.getElementById('f-published').checked,
    date:      Timestamp.fromDate(new Date(dateVal)),
    updatedAt: serverTimestamp(),
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, 'news', editingId), data);
      showToast('記事を更新しました');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'news'), data);
      showToast('記事を追加しました');
    }
    closeModal();
    await loadNews();
  } catch (err) {
    showToast('保存に失敗しました: ' + err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '保存する';
  }
}

/* ─── グローバル関数（テーブルのonclick用） ─── */
window.editNews = (id) => openModal(id);
window.deleteNews = async (id) => {
  const ok = await confirmDialog('記事を削除しますか？', 'この操作は元に戻せません。');
  if (!ok) return;
  try {
    await deleteDoc(doc(db, 'news', id));
    showToast('記事を削除しました');
    await loadNews();
  } catch (err) {
    showToast('削除に失敗しました', 'error');
  }
};

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
