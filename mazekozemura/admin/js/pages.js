import { db } from './firebase-config.js';
import { requireAuth, logout, showToast } from './auth.js';
import {
  collection, getDocs, doc, setDoc, deleteField, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const CLOUDINARY_CLOUD = 'dv2getmk7';
const CLOUDINARY_PRESET = 'mazekozemura';

/* ─── 画像スロット定義 ─── */
const SLOTS = [
  /* トップページ */
  { page: 'トップページ', key: 'hero-main',              label: 'ヒーロー メインビジュアル' },
  { page: 'トップページ', key: 'mission-barrier',        label: 'ミッション①バリアをなくす' },
  { page: 'トップページ', key: 'mission-support',        label: 'ミッション②ともに支え合う' },
  { page: 'トップページ', key: 'mission-connect',        label: 'ミッション③つながりを育む' },
  { page: 'トップページ', key: 'mission-place',          label: 'ミッション④居場所をつくる' },
  { page: 'トップページ', key: 'home-activities-visual', label: '活動セクション バナー画像' },
  { page: 'トップページ', key: 'home-support-visual',    label: '支援CTA 背景画像' },
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
  try {
    await loadImages();
    renderSlots();
  } catch (e) {
    console.error('[pages.js] エラー:', e);
    document.getElementById('slots-container').innerHTML =
      `<div style="color:#DC2626;padding:20px;background:#FEF2F2;border-radius:8px;">
        <strong>読み込みエラー:</strong> ${e.message || e}
      </div>`;
  }
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
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-primary" onclick="document.getElementById('input-${slot.key}').click()">
            ${url ? '変更' : 'アップロード'}
          </button>
          <button class="btn btn-sm btn-secondary" onclick="toggleUrlInput('${slot.key}')">URL指定</button>
          ${url ? `<button class="btn btn-sm btn-delete" onclick="removeImage('${slot.key}')">削除</button>` : ''}
        </div>
        <!-- URL先込め入力欄 -->
        <div id="url-input-wrap-${slot.key}" style="display:none;margin-top:10px;">
          <div style="display:flex;gap:6px;">
            <input type="url" id="url-input-${slot.key}"
              placeholder="https://example.com/image.jpg"
              style="flex:1;padding:6px 10px;border:1px solid #CBD5E1;border-radius:6px;font-size:12px;"
            >
            <button class="btn btn-sm btn-primary" onclick="handleUrlSet('${slot.key}')">設定</button>
          </div>
        </div>
        <div class="img-slot-progress" id="progress-${slot.key}"></div>
      </div>
      <input type="file" id="input-${slot.key}" accept="image/*" style="display:none;">
    </div>`;
}

window.toggleUrlInput = (key) => {
  const wrap = document.getElementById(`url-input-wrap-${key}`);
  const isHidden = wrap.style.display === 'none';
  wrap.style.display = isHidden ? 'block' : 'none';
  if (isHidden) document.getElementById(`url-input-${key}`).focus();
};

window.handleUrlSet = async (key) => {
  const input = document.getElementById(`url-input-${key}`);
  const url = input.value.trim();
  if (!url || !url.startsWith('http')) {
    showToast('正しいURLを入力してください', 'error');
    return;
  }
  const progressEl = document.getElementById(`progress-${key}`);
  progressEl.textContent = '保存中…';
  try {
    await setDoc(doc(db, 'site-images', key), { url, updatedAt: serverTimestamp() });
    imageData[key] = url;
    showToast(`「${SLOTS.find(s=>s.key===key)?.label}」のURLを設定しました`);
    renderSlots();
  } catch(e) {
    progressEl.textContent = '';
    showToast('保存に失敗しました', 'error');
  }
};

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

async function handleUpload(key, file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('画像ファイルを選択してください', 'error');
    return;
  }

  const progressEl = document.getElementById(`progress-${key}`);
  progressEl.textContent = '圧縮中…';

  try {
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
    if (!data.secure_url) throw new Error(data.error?.message || 'アップロード失敗');

    await setDoc(doc(db, 'site-images', key), { url: data.secure_url, updatedAt: serverTimestamp() });
    imageData[key] = data.secure_url;
    progressEl.textContent = '';
    showToast(`「${SLOTS.find(s=>s.key===key)?.label}」を保存しました`);
    renderSlots();
  } catch (err) {
    progressEl.textContent = '❌ エラー: ' + (err.message || err);
    showToast('アップロードに失敗しました: ' + err.message, 'error');
  }
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
