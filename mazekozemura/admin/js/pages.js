import { db, storage } from './firebase-config.js';
import { requireAuth, logout, showToast } from './auth.js';
import {
  collection, getDocs, doc, setDoc, deleteField, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

/* ─── 画像スロット定義 ─── */
const SLOTS = [
  /* トップページ */
  { page: 'トップページ', key: 'hero-main',           label: 'ヒーロー メインビジュアル' },
  { page: 'トップページ', key: 'mission-barrier',     label: 'ミッション①バリアをなくす' },
  { page: 'トップページ', key: 'mission-support',     label: 'ミッション②ともに支え合う' },
  { page: 'トップページ', key: 'mission-connect',     label: 'ミッション③つながりを育む' },
  { page: 'トップページ', key: 'mission-place',       label: 'ミッション④居場所をつくる' },
  /* 活動内容 */
  { page: '活動内容',     key: 'activity-01-visual',  label: '月1まぜこぜむら 写真' },
  { page: '活動内容',     key: 'activity-02-visual',  label: 'まぜこぜカフェ 写真' },
  { page: '活動内容',     key: 'activity-03-visual',  label: 'まぜこぜ菜園 写真' },
  { page: '活動内容',     key: 'activity-04-visual',  label: 'デイサービス訪問 写真' },
  { page: '活動内容',     key: 'activity-05-visual',  label: 'おにぎりカフェ 写真（計画中）' },
  /* 団体概要 */
  { page: '団体概要',     key: 'vision-mission',      label: 'ビジョン①ミッション' },
  { page: '団体概要',     key: 'vision-vision',       label: 'ビジョン②ビジョン' },
  { page: '団体概要',     key: 'vision-value',        label: 'ビジョン③バリュー' },
  { page: '団体概要',     key: 'about-representative',label: '代表者 写真' },
  { page: '団体概要',     key: 'story-image',          label: '設立の経緯 イメージ' },
  /* 支援ページ */
  { page: '支援ページ',   key: 'support-main',         label: '支援ページ メインビジュアル' },
  { page: '支援ページ',   key: 'support-donate',       label: '支援方法①オンライン寄付' },
  { page: '支援ページ',   key: 'support-join',         label: '支援方法②活動に参加する' },
  { page: '支援ページ',   key: 'support-share',        label: '支援方法③広めてもらう' },
  /* お問い合わせ */
  { page: 'お問い合わせ', key: 'contact-main',         label: 'お問い合わせ メイン画像' },
];

let imageData = {}; // { [key]: url }

requireAuth(async () => {
  document.getElementById('logout-btn').addEventListener('click', logout);
  await loadImages();
  renderSlots();
});

async function loadImages() {
  const snap = await getDocs(collection(db, 'site-images'));
  snap.forEach(d => { imageData[d.id] = d.data().url || ''; });
}

function renderSlots() {
  const container = document.getElementById('slots-container');
  const pages = [...new Set(SLOTS.map(s => s.page))];

  container.innerHTML = pages.map(page => `
    <div class="admin-card" style="margin-bottom:28px;">
      <div class="admin-card-header">
        <h3>${page}</h3>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;padding:20px;">
        ${SLOTS.filter(s => s.page === page).map(slot => buildCard(slot)).join('')}
      </div>
    </div>`).join('');

  // ファイルinput イベント
  SLOTS.forEach(slot => {
    const input = document.getElementById(`input-${slot.key}`);
    input.addEventListener('change', () => handleUpload(slot.key, input.files[0]));
  });
}

function buildCard(slot) {
  const url = imageData[slot.key] || '';
  return `
    <div class="img-slot-card" id="card-${slot.key}">
      <div class="img-slot-preview" id="preview-${slot.key}"
           style="${url ? `background-image:url('${url}')` : ''}">
        ${url ? '' : '<div class="img-slot-empty"><div style="font-size:28px;margin-bottom:6px;">📷</div><p>未設定</p></div>'}
      </div>
      <div class="img-slot-footer">
        <div class="img-slot-label">${slot.label}</div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="btn btn-sm btn-primary" onclick="document.getElementById('input-${slot.key}').click()">
            ${url ? '変更' : 'アップロード'}
          </button>
          ${url ? `<button class="btn btn-sm btn-delete" onclick="removeImage('${slot.key}')">削除</button>` : ''}
        </div>
        <div class="img-slot-progress" id="progress-${slot.key}"></div>
      </div>
      <input type="file" id="input-${slot.key}" accept="image/*" style="display:none;">
    </div>`;
}

async function handleUpload(key, file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('画像ファイルを選択してください', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('5MB以下の画像を選択してください', 'error');
    return;
  }

  const progressEl = document.getElementById(`progress-${key}`);
  const ext        = file.name.split('.').pop();
  const storageRef = ref(storage, `site-images/${key}.${ext}`);

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed',
      snap => {
        const pct = Math.round(snap.bytesTransferred / snap.totalBytes * 100);
        progressEl.textContent = `アップロード中… ${pct}%`;
      },
      err => { progressEl.textContent = ''; reject(err); },
      async () => {
        progressEl.textContent = '';
        const url = await getDownloadURL(task.snapshot.ref);
        await setDoc(doc(db, 'site-images', key), { url, updatedAt: serverTimestamp() });
        imageData[key] = url;
        showToast(`「${SLOTS.find(s=>s.key===key)?.label}」を保存しました`);
        renderSlots();
        resolve();
      }
    );
  });
}

window.removeImage = async (key) => {
  try {
    await updateDoc(doc(db, 'site-images', key), { url: '' });
    imageData[key] = '';
    showToast('画像を削除しました');
    renderSlots();
  } catch (e) {
    showToast('削除に失敗しました', 'error');
  }
};
