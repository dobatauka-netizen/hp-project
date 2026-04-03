import { db } from './firebase-config.js';
import { requireAuth, logout, showToast } from './auth.js';
import {
  collection, getDocs, doc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ─── 編集可能テキスト定義 ─── */
const CONTENT_ITEMS = [
  /* トップページ */
  { page: 'トップページ', key: 'home-hero-sub',      label: 'ヒーロー サブテキスト',        rows: 3 },
  { page: 'トップページ', key: 'home-mission-desc',   label: 'ミッション セクション説明文',   rows: 3 },

  /* 団体概要 */
  { page: '団体概要', key: 'about-vision-text',    label: 'ビジョン 説明文',               rows: 4 },
  { page: '団体概要', key: 'about-mission-text',   label: 'ミッションカード テキスト',      rows: 2 },
  { page: '団体概要', key: 'about-vision-card-text', label: 'ビジョンカード テキスト',      rows: 2 },
  { page: '団体概要', key: 'about-value-text',     label: 'バリューカード テキスト',        rows: 2 },
  { page: '団体概要', key: 'about-address',        label: '所在地',                        rows: 2 },
  { page: '団体概要', key: 'about-tel',            label: '電話番号',                      rows: 1 },
  { page: '団体概要', key: 'about-story-1',        label: '設立の経緯 段落①',              rows: 4 },
  { page: '団体概要', key: 'about-story-2',        label: '設立の経緯 段落②',              rows: 4 },
  { page: '団体概要', key: 'about-story-3',        label: '設立の経緯 段落③',              rows: 4 },

  /* 活動内容 */
  { page: '活動内容', key: 'act-01-body',  label: '月1まぜこぜむら 説明文',        rows: 4 },
  { page: '活動内容', key: 'act-02-body',  label: 'まぜこぜカフェ 説明文',         rows: 4 },
  { page: '活動内容', key: 'act-03-body',  label: 'まぜこぜ菜園 説明文',           rows: 4 },
  { page: '活動内容', key: 'act-04-body',  label: 'デイサービス訪問 説明文',       rows: 4 },
  { page: '活動内容', key: 'act-05-body',  label: 'おにぎりユニバーサルカフェ 説明文', rows: 4 },
];

let contentData = {}; // { [key]: { text, updatedAt } }

requireAuth(async () => {
  document.getElementById('logout-btn').addEventListener('click', logout);
  try {
    await loadContent();
    renderContent();
  } catch (e) {
    console.error('[content.js] エラー:', e);
    document.getElementById('content-container').innerHTML =
      `<div style="color:#DC2626;padding:20px;background:#FEF2F2;border-radius:8px;">
        <strong>読み込みエラー:</strong> ${e.message || e}
      </div>`;
  }
});

async function loadContent() {
  const snap = await getDocs(collection(db, 'site-content'));
  snap.forEach(d => {
    contentData[d.id] = { text: d.data().text || '', updatedAt: d.data().updatedAt };
  });
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} 更新`;
}

function renderContent() {
  const container = document.getElementById('content-container');
  const pages = [...new Set(CONTENT_ITEMS.map(c => c.page))];

  container.innerHTML = pages.map(page => `
    <div class="admin-card" style="margin-bottom:28px;">
      <div class="admin-card-header">
        <h3>${page}</h3>
      </div>
      <div style="padding:20px;">
        ${CONTENT_ITEMS.filter(c => c.page === page).map(item => buildCard(item)).join('')}
      </div>
    </div>`).join('');
}

function buildCard(item) {
  const data = contentData[item.key] || { text: '', updatedAt: null };
  const updatedStr = data.updatedAt ? formatDate(data.updatedAt) : '未設定';
  return `
    <div class="content-card" id="card-${item.key}">
      <div class="content-label">
        ${item.label}
        <span class="updated-at" id="updated-${item.key}">${updatedStr}</span>
      </div>
      <textarea
        class="content-textarea"
        id="textarea-${item.key}"
        rows="${item.rows}"
        placeholder="ここにテキストを入力してください"
      >${escapeHtml(data.text)}</textarea>
      <div class="content-actions">
        <button class="btn btn-sm btn-primary" onclick="saveContent('${item.key}')">保存</button>
        <span class="content-status" id="status-${item.key}"></span>
      </div>
    </div>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.saveContent = async (key) => {
  const textarea  = document.getElementById(`textarea-${key}`);
  const statusEl  = document.getElementById(`status-${key}`);
  const updatedEl = document.getElementById(`updated-${key}`);
  const text = textarea.value.trim();

  statusEl.textContent = '保存中…';
  try {
    const ts = serverTimestamp();
    await setDoc(doc(db, 'site-content', key), { text, updatedAt: ts });
    contentData[key] = { text, updatedAt: null };
    statusEl.textContent = '✅ 保存しました';
    updatedEl.textContent = `${new Date().toLocaleString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })} 更新`;
    showToast(`「${CONTENT_ITEMS.find(c=>c.key===key)?.label}」を保存しました`);
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  } catch (e) {
    statusEl.textContent = '❌ 保存失敗';
    showToast('保存に失敗しました', 'error');
  }
};
