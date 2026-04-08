#!/usr/bin/env node
/**
 * 新規プロジェクト セットアップスクリプト
 * 使い方: node setup.mjs
 *
 * package.json のプロジェクト名と astro.config.mjs のサイトURLを
 * 対話形式で設定します。
 * コンテンツの詳細は src/config/site.ts を直接編集してください。
 */

import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync } from 'node:fs';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  console.log('\n=== 企業サイト テンプレート セットアップ ===\n');

  const projectName = (await ask('プロジェクト名（英数字・ハイフン）: ')).trim() || 'my-project';
  const siteUrl = (await ask('サイトURL（例: https://example.com）: ')).trim() || 'https://example.com';
  const companyName = (await ask('会社名: ')).trim() || '会社名';

  // package.json
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  pkg.name = projectName;
  writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log(`  ✓ package.json — name: "${projectName}"`);

  // astro.config.mjs
  let astroConfig = readFileSync('astro.config.mjs', 'utf-8');
  astroConfig = astroConfig.replace(
    /site:\s*'[^']*'/,
    `site: '${siteUrl}'`,
  );
  writeFileSync('astro.config.mjs', astroConfig);
  console.log(`  ✓ astro.config.mjs — site: "${siteUrl}"`);

  // src/config/site.ts
  let siteTs = readFileSync('src/config/site.ts', 'utf-8');
  siteTs = siteTs.replace(
    /name:\s*'会社名'/,
    `name: '${companyName}'`,
  );
  siteTs = siteTs.replace(
    /url:\s*'https:\/\/example\.com'/,
    `url: '${siteUrl}'`,
  );
  writeFileSync('src/config/site.ts', siteTs);
  console.log(`  ✓ site.ts — name: "${companyName}", url: "${siteUrl}"`);

  // robots.txt
  let robots = readFileSync('public/robots.txt', 'utf-8');
  robots = robots.replace(
    /Sitemap:\s*.*/,
    `Sitemap: ${siteUrl}/sitemap-index.xml`,
  );
  writeFileSync('public/robots.txt', robots);
  console.log(`  ✓ robots.txt — Sitemap URL 更新`);

  console.log('\n✅ セットアップ完了！');
  console.log('   次のステップ:');
  console.log('   1. src/config/site.ts のコンテンツを編集');
  console.log('   2. public/ogp.png にOGP画像を配置');
  console.log('   3. npm run dev で開発サーバー起動\n');

  rl.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
