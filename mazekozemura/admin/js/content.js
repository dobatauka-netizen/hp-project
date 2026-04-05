import { db } from './firebase-config.js';
import { requireAuth, logout, showToast } from './auth.js';
import {
  collection, getDocs, doc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ─── 編集可能テキスト定義 ─── */
const CONTENT_ITEMS = [
  /* ── トップページ ── */
  {
    page: 'top', pageLabel: 'トップページ',
    key: 'home-hero-sub',
    label: '① キャッチコピー（写真の下の説明文）',
    icon: '✨',
    location: 'トップページ ＞ メインビジュアル直下',
    hint: '大きな写真のすぐ下に表示される、2〜3行の短い説明文です。',
    defaultText: '障がい者・健常者・高齢者・マイノリティ・子どもたち。\nちがいを超えて、ともに笑い、ともに育つコミュニティをつくります。',
    previewStyle: 'text-align:center; font-size:16px; line-height:1.9; color:#374151;',
  },
  {
    page: 'top', pageLabel: 'トップページ',
    key: 'home-mission-desc',
    label: '② ミッション説明文',
    icon: '🎯',
    location: 'トップページ ＞ 「まぜこぜむらが大切にしていること」の下',
    hint: 'ミッションセクションのタイトル直下にある2行の説明文です。',
    defaultText: '社会にいつの間にか生まれてしまったバリアをなくし、\nだれもが自分らしく生きられる場所をつくります。',
    previewStyle: 'text-align:center; font-size:15px; line-height:1.9; color:#374151;',
  },

  /* ── 団体概要 ── */
  {
    page: 'about', pageLabel: '団体概要',
    key: 'about-vision-text',
    label: '① ビジョン説明文（長い段落）',
    icon: '🌟',
    location: '団体概要 ＞ 「わたしたちのビジョン」セクション',
    hint: 'ビジョンの見出しの下にある長めの説明文です（1段落）。',
    defaultText: '社会においていつの間にか作られてしまったバリアをなくし、障がい者、健常者、高齢者、マイノリティ、子どもたちが「まぜこぜ」で共存共栄できる社会を創ることを目的としています。わたしたちは、「まぜこぜが当たり前の世の中」になる日を目指して、地域に根ざした活動を続けています。',
    previewStyle: 'font-size:16px; line-height:2.1; color:#374151;',
  },
  {
    page: 'about', pageLabel: '団体概要',
    key: 'about-mission-text',
    label: '② ミッションカードの説明文',
    icon: '🎯',
    location: '団体概要 ＞ オレンジのカード「ミッション」',
    hint: 'オレンジ色のカードの中の説明文です。',
    defaultText: '障がいの有無、年齢、国籍、あらゆる違いによって生まれる見えないバリアをなくし、すべての人が自分らしく参加できる地域コミュニティをつくります。',
    previewStyle: 'font-size:14px; line-height:1.9; color:#64748B; background:#FFF7ED; padding:12px 16px; border-radius:8px;',
  },
  {
    page: 'about', pageLabel: '団体概要',
    key: 'about-vision-card-text',
    label: '③ ビジョンカードの説明文',
    icon: '👁️',
    location: '団体概要 ＞ 緑のカード「ビジョン」',
    hint: '緑色のカードの中の説明文です。',
    defaultText: '障がいのある人もない人も、お年寄りも子どもも、ともに笑い合える「まぜこぜむら」を実現します。やがて「まぜこぜが当たり前」の社会になる日まで、活動を続けます。',
    previewStyle: 'font-size:14px; line-height:1.9; color:#64748B; background:#F0FDF4; padding:12px 16px; border-radius:8px;',
  },
  {
    page: 'about', pageLabel: '団体概要',
    key: 'about-value-text',
    label: '④ バリューカードの説明文',
    icon: '💎',
    location: '団体概要 ＞ 青のカード「バリュー」',
    hint: '青色のカードの中の説明文です。',
    defaultText: '多様性の尊重・継続的なつながり・地域に根ざした活動・誰も排除しない包摂性。ユニバーサルデザインの精神で、すべての人が「ここにいていい」と感じられる場をつくります。',
    previewStyle: 'font-size:14px; line-height:1.9; color:#64748B; background:#EFF6FF; padding:12px 16px; border-radius:8px;',
  },
  {
    page: 'about', pageLabel: '団体概要',
    key: 'about-address',
    label: '⑤ 団体情報テーブル ＞ 所在地',
    icon: '📍',
    location: '団体概要 ＞ 団体情報の表 ＞「所在地」の欄',
    hint: '団体情報の表の中の住所の欄です。',
    defaultText: '〒812-0036　福岡市博多区古門戸町7-8　大串公認会計士・税理士事務所 201号室',
    previewStyle: 'font-size:15px; color:#374151; background:#F9FAFB; padding:8px 12px; border-radius:6px;',
  },
  {
    page: 'about', pageLabel: '団体概要',
    key: 'about-tel',
    label: '⑥ 団体情報テーブル ＞ 電話番号',
    icon: '📞',
    location: '団体概要 ＞ 団体情報の表 ＞「電話番号」の欄',
    hint: '団体情報の表の中の電話番号の欄です。',
    defaultText: '092-263-8060',
    previewStyle: 'font-size:15px; color:#374151; background:#F9FAFB; padding:8px 12px; border-radius:6px;',
  },
  {
    page: 'about', pageLabel: '団体概要',
    key: 'about-story-1',
    label: '⑦ 設立のきっかけ ＞ 1段落目',
    icon: '📖',
    location: '団体概要 ＞「まぜこぜむらが生まれた理由」＞ 1つ目の段落',
    hint: '設立の経緯の最初の段落です。',
    defaultText: 'まぜこぜむらは、「障がい者も健常者もお年寄りも子どもも、まぜこぜで共存共栄しよう」という想いのもとに生まれました。地域の中で「なんとなく分断されている」と感じる場面を目の当たりにするたびに、「だれもが一緒に過ごせる場所を作りたい」という思いが強くなっていきました。',
    previewStyle: 'font-size:15px; line-height:2.1; color:#374151;',
  },
  {
    page: 'about', pageLabel: '団体概要',
    key: 'about-story-2',
    label: '⑧ 設立のきっかけ ＞ 2段落目',
    icon: '📖',
    location: '団体概要 ＞「まぜこぜむらが生まれた理由」＞ 2つ目の段落',
    hint: '設立の経緯の2番目の段落です。',
    defaultText: 'はじめは任意団体として活動をスタートし、毎月の集まりやイベントを重ねながら、少しずつ仲間の輪を広げてきました。「社会にとって必要な存在となるべく」、2021年（令和3年）6月に一般社団法人として法人化。活動をより多くの人に届けられるよう、組織としての体制を整えました。',
    previewStyle: 'font-size:15px; line-height:2.1; color:#374151;',
  },
  {
    page: 'about', pageLabel: '団体概要',
    key: 'about-story-3',
    label: '⑨ 設立のきっかけ ＞ 3段落目',
    icon: '📖',
    location: '団体概要 ＞「まぜこぜむらが生まれた理由」＞ 3つ目の段落',
    hint: '設立の経緯の最後の段落です。',
    defaultText: '将来は常設のユニバーサルデザインカフェの設立を目指しています。「おにぎり」のようにいろんな具が一緒に包まれた、だれもが気軽に立ち寄れる場所。いつか「まぜこぜが当たり前」の世の中になり、わたしたちが不要な存在となる日まで、活動を続けていきます。',
    previewStyle: 'font-size:15px; line-height:2.1; color:#374151;',
  },

  /* ── 活動内容 ── */
  {
    page: 'activities', pageLabel: '活動内容',
    key: 'act-01-body',
    label: '① 月1まぜこぜむら ＞ 説明文',
    icon: '🎪',
    location: '活動内容 ＞ ACTIVITY 01「月1まぜこぜむら」',
    hint: '活動01の説明文（太い文字の段落）です。',
    defaultText: '月に1度、さまざまな背景を持つ人たちが一堂に集まる憩いの場です。\n特別なプログラムはなく、ただ「ここにいる」ことができる時間。',
    previewStyle: 'font-size:15px; line-height:2.1; color:#374151;',
  },
  {
    page: 'activities', pageLabel: '活動内容',
    key: 'act-02-body',
    label: '② まぜこぜカフェ ＞ 説明文',
    icon: '☕',
    location: '活動内容 ＞ ACTIVITY 02「まぜこぜカフェ」',
    hint: '活動02の説明文（太い文字の段落）です。',
    defaultText: 'お茶やコーヒーを飲みながら、隣り合った人とゆっくり話す2時間。\nテーブルを囲んでいれば、自然と会話が生まれます。',
    previewStyle: 'font-size:15px; line-height:2.1; color:#374151;',
  },
  {
    page: 'activities', pageLabel: '活動内容',
    key: 'act-03-body',
    label: '③ まぜこぜ菜園 ＞ 説明文',
    icon: '🌱',
    location: '活動内容 ＞ ACTIVITY 03「まぜこぜ菜園」',
    hint: '活動03の説明文（太い文字の段落）です。',
    defaultText: 'みんなで畑を耕し、種をまき、野菜を育てます。\n土に触れ、自然の中で体を動かすことで、言葉がなくても通じ合えるものがあります。',
    previewStyle: 'font-size:15px; line-height:2.1; color:#374151;',
  },
  {
    page: 'activities', pageLabel: '活動内容',
    key: 'act-04-body',
    label: '④ デイサービス訪問 ＞ 説明文',
    icon: '🏥',
    location: '活動内容 ＞ ACTIVITY 04「デイサービス訪問」',
    hint: '活動04の説明文（太い文字の段落）です。',
    defaultText: '地域のデイサービス施設を訪問し、利用者のみなさんと交流・慰問を行います。\n歌や体操、おしゃべりなど、その日の雰囲気に合わせた時間を過ごします。',
    previewStyle: 'font-size:15px; line-height:2.1; color:#374151;',
  },
  {
    page: 'activities', pageLabel: '活動内容',
    key: 'act-05-body',
    label: '⑤ おにぎりユニバーサルカフェ ＞ 説明文',
    icon: '🍙',
    location: '活動内容 ＞ ACTIVITY 05「おにぎりユニバーサルカフェ計画」',
    hint: '活動05の説明文（太い文字の段落）です。',
    defaultText: '誰もが気軽に立ち寄れる、常設のカフェスペースを地域に設けることを計画しています。\n「おにぎり」のように、いろんな具が一緒に包まれた、ユニバーサルな空間。',
    previewStyle: 'font-size:15px; line-height:2.1; color:#374151;',
  },
];

let contentData = {};
let currentPage = 'top';

requireAuth(async () => {
  document.getElementById('logout-btn').addEventListener('click', logout);
  try {
    await loadContent();
    renderTabs();
    renderContent(currentPage);
    setTimeout(autoResizeAll, 80);
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
    contentData[d.id] = { text: d.data().text ?? null, updatedAt: d.data().updatedAt };
  });
}

function renderTabs() {
  const pages = [
    { id: 'top',        label: '🏠 トップページ', count: CONTENT_ITEMS.filter(c=>c.page==='top').length },
    { id: 'about',      label: '🏢 団体概要',      count: CONTENT_ITEMS.filter(c=>c.page==='about').length },
    { id: 'activities', label: '🎪 活動内容',      count: CONTENT_ITEMS.filter(c=>c.page==='activities').length },
  ];
  document.getElementById('page-tabs').innerHTML = pages.map(p => `
    <button class="tab-btn ${p.id === currentPage ? 'active' : ''}" onclick="switchTab('${p.id}')">
      ${p.label} <span class="tab-count">${p.count}項目</span>
    </button>
  `).join('');
}

window.switchTab = (pageId) => {
  currentPage = pageId;
  renderTabs();
  renderContent(pageId);
  setTimeout(autoResizeAll, 80);
};

function renderContent(pageId) {
  const items = CONTENT_ITEMS.filter(c => c.page === pageId);
  document.getElementById('content-container').innerHTML = items.map(item => buildCard(item)).join('');
}

function buildCard(item) {
  const saved = contentData[item.key];
  const hasFirestore = saved && saved.text !== null && saved.text !== '';
  const displayText = hasFirestore ? saved.text : item.defaultText;
  const updatedStr = saved?.updatedAt ? formatDate(saved.updatedAt) : '';
  const notSavedBadge = !hasFirestore
    ? `<span class="not-saved-badge">⚠️ 未保存（デフォルト表示中）</span>`
    : `<span class="saved-badge">✅ 保存済み</span>`;

  return `
    <div class="content-card" id="card-${item.key}">

      <!-- 場所バッジ -->
      <div class="location-badge">
        <span class="location-icon">📍</span> ${item.location}
      </div>

      <!-- ヘッダー -->
      <div class="content-card-header">
        <span class="content-icon">${item.icon}</span>
        <div class="content-meta">
          <div class="content-label">${item.label}</div>
          <div class="content-hint">${item.hint}</div>
        </div>
        ${notSavedBadge}
      </div>

      <!-- サイトでの見た目プレビュー -->
      <div class="preview-section">
        <div class="preview-label">▼ サイト上での見た目（現在の表示）</div>
        <div class="preview-box" id="preview-${item.key}" style="${item.previewStyle}">${nl2br(escapeHtml(displayText))}</div>
      </div>

      <!-- 編集エリア -->
      <div class="edit-section">
        <div class="edit-label">✏️ ここで文章を書きかえてください</div>
        <textarea
          class="content-textarea"
          id="textarea-${item.key}"
          oninput="onTextareaInput(this, '${item.key}')"
          placeholder="${escapeHtml(item.defaultText)}"
        >${escapeHtml(displayText)}</textarea>
      </div>

      <!-- フッター -->
      <div class="content-footer">
        <span class="updated-at" id="updated-${item.key}">${updatedStr ? '🕐 最終更新：' + updatedStr : ''}</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="content-status" id="status-${item.key}"></span>
          <button class="save-btn" id="savebtn-${item.key}" onclick="saveContent('${item.key}')">
            💾 保存する
          </button>
        </div>
      </div>
    </div>`;
}

window.onTextareaInput = (el, key) => {
  // テキストエリア自動リサイズ
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
  // プレビューもリアルタイム更新
  const preview = document.getElementById(`preview-${key}`);
  if (preview) preview.innerHTML = nl2br(escapeHtml(el.value));
};

window.autoResize = (el) => {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
};

function autoResizeAll() {
  document.querySelectorAll('.content-textarea').forEach(el => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
}

function nl2br(str) {
  return str.replace(/\n/g, '<br>');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

window.saveContent = async (key) => {
  const textarea  = document.getElementById(`textarea-${key}`);
  const statusEl  = document.getElementById(`status-${key}`);
  const updatedEl = document.getElementById(`updated-${key}`);
  const saveBtn   = document.getElementById(`savebtn-${key}`);
  const text = textarea.value.trim();

  saveBtn.disabled = true;
  saveBtn.textContent = '保存中…';

  try {
    await setDoc(doc(db, 'site-content', key), { text, updatedAt: serverTimestamp() });
    contentData[key] = { text, updatedAt: null };

    // バッジを「保存済み」に更新
    const card = document.getElementById(`card-${key}`);
    const badge = card.querySelector('.not-saved-badge');
    if (badge) {
      badge.className = 'saved-badge';
      badge.textContent = '✅ 保存済み';
    }

    const now = new Date();
    updatedEl.textContent = `🕐 最終更新：${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    saveBtn.textContent = '✅ 保存しました！';
    saveBtn.style.background = '#16A34A';
    showToast(`「${CONTENT_ITEMS.find(c=>c.key===key)?.label}」を保存しました`);
    setTimeout(() => {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 保存する';
      saveBtn.style.background = '';
    }, 2500);
  } catch (e) {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 保存する';
    statusEl.textContent = '❌ 保存に失敗しました';
    showToast('保存に失敗しました', 'error');
  }
};
