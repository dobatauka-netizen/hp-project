import { db } from './firebase-config.js';
import { requireAuth, logout, formatDate, CATEGORY_LABELS, CATEGORY_CLASSES } from './auth.js';
import {
  collection, getDocs, query, orderBy, limit, where, getCountFromServer
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

requireAuth(async () => {
  document.getElementById('logout-btn').addEventListener('click', logout);
  await loadStats();
  await loadRecentNews();
});

async function loadStats() {
  const newsCol  = collection(db, 'news');
  const pubQuery = query(newsCol, where('published', '==', true));

  const [allSnap, pubSnap] = await Promise.all([
    getCountFromServer(newsCol),
    getCountFromServer(pubQuery),
  ]);

  document.getElementById('stat-news-all').textContent = allSnap.data().count;
  document.getElementById('stat-news-pub').textContent = pubSnap.data().count;
}

async function loadRecentNews() {
  const tbody = document.getElementById('recent-news-body');
  const q = query(collection(db, 'news'), orderBy('date', 'desc'), limit(5));
  const snap = await getDocs(q);

  if (snap.empty) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:32px;color:#64748B;">記事がありません</td></tr>';
    return;
  }

  tbody.innerHTML = snap.docs.map(doc => {
    const d = doc.data();
    return `
      <tr>
        <td>${formatDate(d.date)}</td>
        <td><span class="badge ${CATEGORY_CLASSES[d.category] || ''}">${CATEGORY_LABELS[d.category] || d.category}</span></td>
        <td>${escHtml(d.title)}</td>
        <td><span class="badge ${d.published ? 'badge-pub' : 'badge-draft'}">${d.published ? '公開中' : '下書き'}</span></td>
      </tr>`;
  }).join('');
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
