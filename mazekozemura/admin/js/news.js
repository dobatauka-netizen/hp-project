import { db } from './firebase-config.js';
import { requireAuth, logout, showToast, confirmDialog, formatDate, CATEGORY_LABELS, CATEGORY_CLASSES } from './auth.js';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const CLOUDINARY_CLOUD = 'dv2getmk7';
const CLOUDINARY_PRESET = 'mazekozemura';

let allDocs    = [];
let editingId  = null;
let selectedFile = null;  // アップロード予定の画像ファイル
let currentImageUrl = ''; // 現在保存されている画像URL

requireAuth(async () => {
  document.getElementById('logout-btn').addEventListener('click', logout);
  await loadNews();
  bindEvents();
});

/* ─── 一覧読み込み ─── */
async function loadNews() {
  const grid = document.getElementById('news-grid');
  grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>読み込み中…</p></div>';

  const q = query(collection(db, 'news'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderTable(allDocs);
}

function renderTable(docs) {
  const grid  = document.getElementById('news-grid');
  const count = document.getElementById('news-count');
  count.textContent = docs.length;

  if (docs.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>記事がまだありません。<br>「＋ 新しい記事を作成」ボタンから追加してください。</p>
      </div>`;
    return;
  }

  const CAT_ICON = { event: '🎪', report: '📝', info: '📢' };

  grid.innerHTML = docs.map(d => `
    <div class="news-card" data-id="${d.id}">
      ${d.imageUrl
        ? `<img class="news-card-img" src="${d.imageUrl}" alt="${escHtml(d.title)}">`
        : `<div class="news-card-no-img">${CAT_ICON[d.category] || '📰'}</div>`
      }
      <div class="news-card-body">
        <div class="news-card-meta">
          <span class="badge ${CATEGORY_CLASSES[d.category] || ''}">${CAT_ICON[d.category] || ''} ${CATEGORY_LABELS[d.category] || d.category}</span>
          <span class="badge ${d.published ? 'badge-pub' : 'badge-draft'}">${d.published ? '✅ 公開中' : '📝 下書き'}</span>
          <span class="news-card-date">📅 ${formatDate(d.date)}</span>
        </div>
        <div class="news-card-title">${escHtml(d.title)}</div>
        ${d.body ? `<div class="news-card-body-text">${escHtml(d.body)}</div>` : ''}
      </div>
      <div class="news-card-footer">
        <button class="btn btn-sm btn-edit" onclick="editNews('${d.id}')">✏️ 編集</button>
        <button class="btn btn-sm btn-delete" onclick="deleteNews('${d.id}')">🗑️ 削除</button>
      </div>
    </div>`).join('');
}

/* ─── イベントバインド ─── */
function bindEvents() {
  document.getElementById('btn-new').addEventListener('click', () => openModal(null));
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);

  // 公開ラベルをリアルタイム更新
  document.getElementById('f-published').addEventListener('change', (e) => {
    document.getElementById('publish-label-text').textContent =
      e.target.checked ? '公開する' : '下書きとして保存する';
  });
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('news-form').addEventListener('submit', saveNews);
  document.getElementById('filter-cat').addEventListener('change', applyFilter);
  document.getElementById('filter-status').addEventListener('change', applyFilter);
  document.getElementById('search-input').addEventListener('input', applyFilter);

  // 画像アップロード
  const uploadArea = document.getElementById('image-upload-area');
  const fileInput  = document.getElementById('f-image');

  uploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFileSelect(fileInput.files[0]));

  // ドラッグ＆ドロップ
  uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFileSelect(e.dataTransfer.files[0]);
  });

  document.getElementById('btn-change-image').addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  document.getElementById('btn-remove-image').addEventListener('click', (e) => {
    e.stopPropagation();
    clearImagePreview();
    selectedFile = null;
    currentImageUrl = '';
  });
}

function handleFileSelect(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('画像ファイルを選択してください', 'error');
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => showImagePreview(e.target.result);
  reader.readAsDataURL(file);
}

function showImagePreview(src) {
  document.getElementById('image-placeholder').style.display = 'none';
  const preview = document.getElementById('image-preview');
  preview.src = src;
  preview.style.display = 'block';
  const actions = document.getElementById('image-actions');
  actions.style.display = 'flex';
}

function clearImagePreview() {
  document.getElementById('image-placeholder').style.display = '';
  document.getElementById('image-preview').style.display = 'none';
  document.getElementById('image-preview').src = '';
  document.getElementById('image-actions').style.display = 'none';
  document.getElementById('f-image').value = '';
  document.getElementById('f-image-url').value = '';
}

/* ─── フィルター ─── */
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
  selectedFile = null;
  currentImageUrl = '';
  document.getElementById('news-form').reset();
  clearImagePreview();

  if (id) {
    document.getElementById('modal-title').textContent = '記事を編集';
    const item = allDocs.find(d => d.id === id);
    if (!item) return;
    document.getElementById('f-title').value      = item.title;
    document.getElementById('f-category').value   = item.category;
    document.getElementById('f-body').value       = item.body || '';
    document.getElementById('f-published').checked = item.published;
    if (item.date) {
      const dt = item.date.toDate();
      document.getElementById('f-date').value = dt.toISOString().slice(0, 10);
    }
    if (item.imageUrl) {
      currentImageUrl = item.imageUrl;
      document.getElementById('f-image-url').value = item.imageUrl;
      showImagePreview(item.imageUrl);
    }
  } else {
    document.getElementById('modal-title').textContent = '新規記事を作成';
    document.getElementById('f-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('f-published').checked = true;
  }

  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('f-title').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  editingId = null;
  selectedFile = null;
}

/* ─── 画像圧縮 ─── */
async function compressImage(file, maxPx = 1920, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
        else                { width  = Math.round(width  * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

/* ─── 画像アップロード ─── */
async function uploadImage(file) {
  const progressEl = document.getElementById('upload-progress');
  progressEl.textContent = '圧縮中…';

  const compressed = await compressImage(file);
  progressEl.textContent = 'アップロード中…';

  const formData = new FormData();
  formData.append('file', compressed, 'image.jpg');
  formData.append('upload_preset', CLOUDINARY_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  progressEl.textContent = '';
  if (!data.secure_url) throw new Error(data.error?.message || 'アップロード失敗');
  return data.secure_url;
}

/* ─── 保存 ─── */
async function saveNews(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('btn-save');
  saveBtn.disabled = true;
  saveBtn.textContent = '保存中…';

  try {
    // 画像アップロード
    let imageUrl = currentImageUrl;
    if (selectedFile) {
      imageUrl = await uploadImage(selectedFile);
    }

    const dateVal = document.getElementById('f-date').value;
    const data = {
      title:     document.getElementById('f-title').value.trim(),
      category:  document.getElementById('f-category').value,
      body:      document.getElementById('f-body').value.trim(),
      published: document.getElementById('f-published').checked,
      date:      Timestamp.fromDate(new Date(dateVal)),
      imageUrl:  imageUrl || '',
      updatedAt: serverTimestamp(),
    };

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

/* ─── グローバル関数 ─── */
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
