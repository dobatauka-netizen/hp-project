#!/usr/bin/env node
/**
 * ============================================================
 * 企業サイト 自動検証エージェント
 * 使い方: node verify.mjs
 *
 * Astro + Tailwind CSS テンプレートの品質を自動チェックします。
 * どのプロジェクトでもコピーして利用可能です。
 * ============================================================
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, extname, basename } from 'node:path';

// ─── ユーティリティ ─────────────────────────────────

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const results = { pass: 0, warn: 0, fail: 0, items: [] };

function pass(msg) {
  results.pass++;
  results.items.push({ level: 'pass', msg });
  console.log(`  ${GREEN}✓${RESET} ${msg}`);
}

function warn(msg) {
  results.warn++;
  results.items.push({ level: 'warn', msg });
  console.log(`  ${YELLOW}⚠${RESET} ${msg}`);
}

function fail(msg) {
  results.fail++;
  results.items.push({ level: 'fail', msg });
  console.log(`  ${RED}✗${RESET} ${msg}`);
}

function heading(title) {
  console.log(`\n${CYAN}${BOLD}── ${title} ──${RESET}`);
}

function readFile(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

function findFiles(dir, ext, fileList = []) {
  if (!existsSync(dir)) return fileList;
  for (const file of readdirSync(dir)) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      findFiles(fullPath, ext, fileList);
    } else if (extname(file) === ext) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// ─── 1. ビルド検証 ─────────────────────────────────

function checkBuild() {
  heading('1. ビルド検証');

  // package.json
  if (!existsSync('package.json')) {
    fail('package.json が見つかりません');
    return;
  }
  pass('package.json 存在確認');

  const pkg = JSON.parse(readFile('package.json'));

  if (pkg.name && pkg.name !== 'my-project') {
    pass(`プロジェクト名設定済み: "${pkg.name}"`);
  } else {
    warn('package.json の name がデフォルト ("my-project") のままです → setup.mjs を実行してください');
  }

  if (!pkg.scripts?.build) {
    fail('build スクリプトが定義されていません');
    return;
  }
  pass('build スクリプト定義済み');

  // astro.config
  if (!existsSync('astro.config.mjs')) {
    fail('astro.config.mjs が見つかりません');
    return;
  }
  pass('astro.config.mjs 存在確認');

  const astroConfig = readFile('astro.config.mjs');
  if (astroConfig.includes("'https://example.com'")) {
    warn('astro.config.mjs の site が "https://example.com" のままです');
  } else {
    pass('astro.config.mjs の site URL 設定済み');
  }

  // ビルド実行
  try {
    execSync('npx astro build', { stdio: 'pipe', timeout: 60000 });
    pass('ビルド成功');
  } catch (e) {
    fail(`ビルド失敗: ${e.stderr?.toString().split('\n')[0] || '不明なエラー'}`);
  }
}

// ─── 2. site.ts 必須項目チェック ────────────────────

function checkSiteConfig() {
  heading('2. サイト設定（site.ts）');

  const siteTs = readFile('src/config/site.ts');
  if (!siteTs) {
    fail('src/config/site.ts が見つかりません');
    return;
  }
  pass('site.ts 存在確認');

  // プレースホルダー検出パターン
  const placeholders = [
    { pattern: /name:\s*'会社名'/, label: 'SITE.name（会社名）', required: true },
    { pattern: /tagline:\s*'キャッチコピー'/, label: 'SITE.tagline', required: true },
    { pattern: /description:\s*'meta description/, label: 'SITE.description', required: true },
    { pattern: /url:\s*'https:\/\/example\.com'/, label: 'SITE.url', required: true },
    { pattern: /formspreeId:\s*''/, label: 'SITE.formspreeId（空文字）', required: false },
    { pattern: /address:\s*'〒000-0000/, label: 'contact.address', required: true },
    { pattern: /tel:\s*'000-0000-0000'/, label: 'contact.tel', required: true },
    { pattern: /email:\s*'info@example\.com'/, label: 'contact.email', required: true },
    { pattern: /value:\s*'株式会社〇〇'/, label: 'companyInfo.会社名', required: true },
    { pattern: /value:\s*'代表取締役 氏名'/, label: 'companyInfo.代表者', required: true },
    { pattern: /title:\s*'メインキャッチコピー'/, label: 'HOME_PAGE.hero.title', required: false },
    { pattern: /title:\s*'サービス名 01'/, label: 'SERVICE_PAGE サービス名', required: false },
    { pattern: /mission:\s*'企業理念/, label: 'ABOUT_PAGE.mission', required: false },
  ];

  for (const { pattern, label, required } of placeholders) {
    if (pattern.test(siteTs)) {
      if (required) {
        fail(`★必須 ${label} がプレースホルダーのままです`);
      } else {
        warn(`☆任意 ${label} が未設定です`);
      }
    } else {
      pass(`${label} 設定済み`);
    }
  }
}

// ─── 3. リンク整合性チェック ────────────────────────

function checkLinks() {
  heading('3. リンク整合性');

  const pages = findFiles('src/pages', '.astro');
  const pageRoutes = pages.map((p) => {
    const name = basename(p, '.astro');
    return name === 'index' ? '/' : `/${name}`;
  });

  if (pages.length === 0) {
    fail('src/pages にページファイルがありません');
    return;
  }
  pass(`${pages.length} ページ検出: ${pageRoutes.join(', ')}`);

  // NAV_LINKS のリンク先を検証
  const siteTs = readFile('src/config/site.ts');
  if (siteTs) {
    const navHrefs = [...siteTs.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]);
    for (const href of navHrefs) {
      if (pageRoutes.includes(href)) {
        pass(`ナビリンク ${href} → ページ存在`);
      } else {
        fail(`ナビリンク ${href} → ページが見つかりません`);
      }
    }
  }

  // 全ページ内のhref="/xxx" を検証
  const internalLinkPattern = /href=["'{]\/([a-z-]*)["'}]/g;
  for (const page of pages) {
    const content = readFile(page);
    if (!content) continue;
    const links = [...content.matchAll(internalLinkPattern)].map((m) => `/${m[1]}`);
    const unique = [...new Set(links)];
    for (const link of unique) {
      if (!pageRoutes.includes(link)) {
        fail(`${basename(page)}: リンク ${link} → ページが見つかりません`);
      }
    }
  }

  // コンポーネント内のリンクも検証
  const components = findFiles('src/components', '.astro');
  for (const comp of components) {
    const content = readFile(comp);
    if (!content) continue;
    const links = [...content.matchAll(internalLinkPattern)].map((m) => `/${m[1]}`);
    const unique = [...new Set(links)];
    for (const link of unique) {
      if (!pageRoutes.includes(link)) {
        fail(`${basename(comp)}: リンク ${link} → ページが見つかりません`);
      }
    }
  }

  if (results.items.filter((i) => i.level === 'fail' && i.msg.includes('ページが見つかりません')).length === 0) {
    pass('全内部リンクの遷移先が存在');
  }
}

// ─── 4. SEO検証 ────────────────────────────────────

function checkSEO() {
  heading('4. SEO');

  // SEOHead コンポーネント
  const seoHead = readFile('src/components/SEOHead.astro');
  if (!seoHead) {
    fail('SEOHead.astro が見つかりません');
    return;
  }
  pass('SEOHead.astro 存在確認');

  const seoChecks = [
    { pattern: /og:title/, label: 'og:title' },
    { pattern: /og:description/, label: 'og:description' },
    { pattern: /og:image/, label: 'og:image' },
    { pattern: /og:url/, label: 'og:url' },
    { pattern: /twitter:card/, label: 'twitter:card' },
    { pattern: /canonical/, label: 'canonical URL' },
    { pattern: /meta name="description"/, label: 'meta description' },
  ];

  for (const { pattern, label } of seoChecks) {
    if (pattern.test(seoHead)) {
      pass(`${label} メタタグ実装済み`);
    } else {
      fail(`${label} メタタグが未実装`);
    }
  }

  // OGP画像
  if (existsSync('public/ogp.png')) {
    pass('public/ogp.png 存在確認');
  } else {
    warn('public/ogp.png が存在しません → SNSシェア時に画像が表示されません');
  }

  // favicon
  if (existsSync('public/favicon.svg') || existsSync('public/favicon.ico')) {
    pass('favicon 存在確認');
  } else {
    warn('favicon が見つかりません');
  }

  // robots.txt
  const robots = readFile('public/robots.txt');
  if (!robots) {
    fail('public/robots.txt が見つかりません');
  } else if (robots.includes('example.com')) {
    warn('robots.txt の Sitemap URL が example.com のままです');
  } else {
    pass('robots.txt 設定済み');
  }

  // サイトマップ統合
  const astroConfig = readFile('astro.config.mjs');
  if (astroConfig && astroConfig.includes('sitemap')) {
    pass('サイトマップ統合設定済み');
  } else {
    warn('サイトマップ統合が未設定です（@astrojs/sitemap）');
  }
}

// ─── 5. アクセシビリティ検証 ────────────────────────

function checkAccessibility() {
  heading('5. アクセシビリティ');

  const allAstro = [
    ...findFiles('src/components', '.astro'),
    ...findFiles('src/pages', '.astro'),
    ...findFiles('src/layouts', '.astro'),
  ];

  let imgWithoutAlt = 0;
  let svgWithoutLabel = 0;
  let formInputWithoutLabel = 0;
  let buttonWithoutLabel = 0;

  for (const file of allAstro) {
    const content = readFile(file);
    if (!content) continue;
    const name = basename(file);

    // <img> without alt
    const imgs = content.match(/<img\b[^>]*>/g) || [];
    for (const img of imgs) {
      if (!/alt=/.test(img)) {
        imgWithoutAlt++;
        warn(`${name}: <img> に alt 属性がありません`);
      }
    }

    // <svg> in interactive context without aria
    const svgs = content.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/g) || [];
    for (const svg of svgs) {
      if (!/aria-label|aria-hidden|role="img"/.test(svg)) {
        svgWithoutLabel++;
      }
    }

    // <input>/<textarea> without associated label
    const inputs = content.match(/<(?:input|textarea)\b[^>]*>/g) || [];
    for (const input of inputs) {
      if (/type=["']hidden["']/.test(input)) continue;
      if (!/id=/.test(input) && !/aria-label/.test(input)) {
        formInputWithoutLabel++;
        warn(`${name}: フォーム入力要素に id/aria-label がありません`);
      }
    }

    // <button> without accessible name
    const buttons = content.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || [];
    for (const button of buttons) {
      if (!/aria-label|aria-labelledby/.test(button) && /<button[^>]*>\s*<svg/.test(button)) {
        buttonWithoutLabel++;
        warn(`${name}: アイコンのみの <button> に aria-label がありません`);
      }
    }
  }

  if (svgWithoutLabel > 0) {
    warn(`${svgWithoutLabel} 個の <svg> に aria-hidden または aria-label がありません`);
  }

  if (imgWithoutAlt === 0) pass('全 <img> に alt 属性あり');
  if (formInputWithoutLabel === 0) pass('全フォーム要素に id/aria-label あり');
  if (buttonWithoutLabel === 0) pass('全ボタンにアクセシブルな名前あり');

  // lang属性
  const layout = readFile('src/layouts/BaseLayout.astro');
  if (layout && /lang=["']ja["']/.test(layout)) {
    pass('html lang="ja" 設定済み');
  } else {
    warn('html 要素に lang 属性がありません');
  }
}

// ─── 6. CSS変数使用状況チェック ─────────────────────

function checkCSS() {
  heading('6. CSS / スタイル');

  const globalCss = readFile('src/styles/global.css');
  if (!globalCss) {
    warn('src/styles/global.css が見つかりません');
    return;
  }
  pass('global.css 存在確認');

  // CSS変数定義を抽出
  const varDefs = [...globalCss.matchAll(/--([a-z-]+):/g)].map((m) => m[1]);
  if (varDefs.length === 0) {
    pass('カスタムCSS変数なし');
    return;
  }

  // 全ファイルで使用状況を確認
  const allFiles = [
    ...findFiles('src/components', '.astro'),
    ...findFiles('src/pages', '.astro'),
    ...findFiles('src/layouts', '.astro'),
    'src/styles/global.css',
  ];

  const allContent = allFiles.map((f) => readFile(f) || '').join('\n');

  for (const varName of varDefs) {
    const usagePattern = new RegExp(`var\\(--${varName}\\)`);
    if (usagePattern.test(allContent)) {
      pass(`CSS変数 --${varName} 使用中`);
    } else {
      warn(`CSS変数 --${varName} が定義済みですが未使用です`);
    }
  }
}

// ─── 7. ファイル構成チェック ────────────────────────

function checkFileStructure() {
  heading('7. ファイル構成');

  // 必須ディレクトリ
  const requiredDirs = [
    'src/components',
    'src/config',
    'src/layouts',
    'src/pages',
    'src/styles',
    'public',
  ];

  for (const dir of requiredDirs) {
    if (existsSync(dir)) {
      pass(`${dir}/ 存在確認`);
    } else {
      fail(`${dir}/ が見つかりません`);
    }
  }

  // 必須ファイル
  const requiredFiles = [
    'src/config/site.ts',
    'src/layouts/BaseLayout.astro',
    'src/styles/global.css',
    'src/pages/index.astro',
    'public/robots.txt',
    'astro.config.mjs',
    'tsconfig.json',
  ];

  for (const file of requiredFiles) {
    if (existsSync(file)) {
      pass(`${file} 存在確認`);
    } else {
      fail(`${file} が見つかりません`);
    }
  }

  // コンポーネント命名規則（PascalCase）
  const components = existsSync('src/components')
    ? readdirSync('src/components').filter((f) => f.endsWith('.astro'))
    : [];

  for (const comp of components) {
    const name = comp.replace('.astro', '');
    if (/^[A-Z][a-zA-Z]*$/.test(name)) {
      pass(`${comp} — PascalCase ✓`);
    } else {
      warn(`${comp} — PascalCase命名規則に従っていません`);
    }
  }

  // ページ命名規則（lowercase）
  const pages = existsSync('src/pages')
    ? readdirSync('src/pages').filter((f) => f.endsWith('.astro'))
    : [];

  for (const page of pages) {
    const name = page.replace('.astro', '');
    if (/^[a-z][a-z-]*$|^index$/.test(name)) {
      pass(`${page} — lowercase ✓`);
    } else {
      warn(`${page} — ページは lowercase 命名が推奨です`);
    }
  }
}

// ─── 実行 ──────────────────────────────────────────

function main() {
  console.log(`\n${BOLD}╔════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║   企業サイト 自動検証エージェント      ║${RESET}`);
  console.log(`${BOLD}╚════════════════════════════════════════╝${RESET}`);

  checkBuild();
  checkSiteConfig();
  checkLinks();
  checkSEO();
  checkAccessibility();
  checkCSS();
  checkFileStructure();

  // サマリー
  console.log(`\n${BOLD}── 検証結果サマリー ──${RESET}\n`);

  const total = results.pass + results.warn + results.fail;
  const score = total > 0 ? Math.round((results.pass / total) * 100) : 0;

  console.log(`  ${GREEN}✓ 合格: ${results.pass}${RESET}`);
  console.log(`  ${YELLOW}⚠ 警告: ${results.warn}${RESET}`);
  console.log(`  ${RED}✗ 失敗: ${results.fail}${RESET}`);
  console.log(`  ${DIM}─────────────${RESET}`);
  console.log(`  ${BOLD}スコア: ${score}/100${RESET}\n`);

  if (results.fail > 0) {
    console.log(`${RED}${BOLD}  ❌ デプロイ前に ${results.fail} 件の問題を修正してください${RESET}\n`);
    process.exit(1);
  } else if (results.warn > 0) {
    console.log(`${YELLOW}${BOLD}  ⚡ ${results.warn} 件の警告があります（推奨改善）${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${GREEN}${BOLD}  🎉 全チェック合格！デプロイ準備完了${RESET}\n`);
    process.exit(0);
  }
}

main();
