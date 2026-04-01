/* ================================================
   まぜこぜむら メインJS
   - ハンバーガーメニュー
   - アクセシビリティウィジェット（文字サイズ・ハイコントラスト・ふりがな）
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── ハンバーガーメニュー ────────────────── */
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.querySelector('.hamburger-label').textContent = isOpen ? '閉じる' : 'メニュー';
    });
    // メニュー内リンクをクリックしたら閉じる
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('.hamburger-label').textContent = 'メニュー';
      });
    });
  }

  /* ── 文字サイズ変更 ──────────────────────── */
  const sizes = { small: '14px', medium: '16px', large: '19px' };
  const saved = localStorage.getItem('fontSize') || 'medium';
  applyFontSize(saved);

  document.querySelectorAll('[data-font-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.fontSize;
      applyFontSize(size);
      localStorage.setItem('fontSize', size);
    });
  });

  function applyFontSize(size) {
    document.documentElement.style.fontSize = sizes[size] || '16px';
    document.querySelectorAll('[data-font-size]').forEach(b => {
      b.classList.toggle('active', b.dataset.fontSize === size);
    });
  }

  /* ── ハイコントラスト ────────────────────── */
  const savedContrast = localStorage.getItem('highContrast') === 'true';
  if (savedContrast) document.body.classList.add('high-contrast');

  const contrastBtn = document.getElementById('contrast-toggle');
  if (contrastBtn) {
    contrastBtn.addEventListener('click', () => {
      const on = document.body.classList.toggle('high-contrast');
      localStorage.setItem('highContrast', on);
      contrastBtn.setAttribute('aria-pressed', on);
      contrastBtn.textContent = on ? '標準表示' : 'コントラスト';
    });
    contrastBtn.setAttribute('aria-pressed', savedContrast);
    if (savedContrast) contrastBtn.textContent = '標準表示';
  }

  /* ── ふりがな表示 ────────────────────────── */
  const savedRuby = localStorage.getItem('showRuby') === 'true';
  if (savedRuby) document.body.classList.add('show-ruby');

  const rubyBtn = document.getElementById('ruby-toggle');
  if (rubyBtn) {
    rubyBtn.addEventListener('click', () => {
      const on = document.body.classList.toggle('show-ruby');
      localStorage.setItem('showRuby', on);
      rubyBtn.setAttribute('aria-pressed', on);
    });
    rubyBtn.setAttribute('aria-pressed', savedRuby);
  }

  /* ── スクロール時フローティングCTAを表示 ── */
  const floatCta = document.getElementById('float-cta');
  if (floatCta) {
    window.addEventListener('scroll', () => {
      floatCta.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
  }

});
