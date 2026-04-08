# 企業サイト テンプレート

Astro + Tailwind CSS で構築された日本語企業サイトのテンプレートです。  
`src/config/site.ts` を編集するだけで、全ページのコンテンツ・メタ情報が反映されます。

## クイックスタート

```bash
# 1. リポジトリをクローン（またはテンプレートから作成）
git clone <repository-url> my-new-site
cd my-new-site

# 2. 依存パッケージをインストール
npm install

# 3. セットアップ（プロジェクト名・URL・会社名を対話形式で設定）
node setup.mjs

# 4. コンテンツを編集
#    src/config/site.ts を開いて各ページの内容を書き換え

# 5. 開発サーバーを起動
npm run dev
```

## プロジェクト構成

```
src/
├── config/
│   └── site.ts           ← 全設定・コンテンツを一元管理
├── components/
│   ├── Header.astro      … ヘッダー（PC + モバイル対応）
│   ├── Footer.astro      … フッター
│   ├── Hero.astro         … ヒーローセクション
│   ├── PageHeader.astro   … 下層ページ共通ヘッダー
│   ├── CTAButton.astro    … CTAボタン
│   ├── CTASection.astro   … CTA共通セクション
│   └── SEOHead.astro      … SEO・OGP・GA4メタタグ
├── layouts/
│   └── BaseLayout.astro   … 共通レイアウト
├── pages/
│   ├── index.astro        … トップページ
│   ├── service.astro      … サービス一覧
│   ├── about.astro        … 会社概要
│   ├── contact.astro      … お問い合わせ（Formspree）
│   └── privacy.astro      … プライバシーポリシー
└── styles/
    └── global.css         … Tailwind CSS + カラー変数
```

## 設定ファイル（site.ts）の構成

| セクション | 内容 |
|:-----------|:-----|
| `SITE` | 会社名・URL・連絡先・外部サービスID |
| `NAV_LINKS` | ナビゲーションメニュー |
| `HOME_PAGE` | トップページ（ヒーロー・特徴・選ばれる理由・CTA） |
| `SERVICE_PAGE` | サービス一覧 |
| `ABOUT_PAGE` | 会社概要・ミッション・代表メッセージ |
| `PRIVACY_PAGE` | プライバシーポリシー |

## 新規プロジェクトの作り方

1. このテンプレートをコピー
2. `node setup.mjs` を実行
3. `src/config/site.ts` のコンテンツを編集
4. `public/ogp.png` にOGP画像を配置
5. `public/favicon.svg` / `favicon.ico` を差し替え
6. `npm run build` でビルド → デプロイ

## コマンド

| コマンド | 内容 |
|:---------|:-----|
| `npm run dev` | 開発サーバー起動（localhost:4321） |
| `npm run build` | 本番ビルド（`./dist/`） |
| `npm run preview` | ビルド結果をローカルプレビュー |
| `node setup.mjs` | プロジェクト初期セットアップ |

## 技術スタック

- [Astro](https://astro.build) v6
- [Tailwind CSS](https://tailwindcss.com) v4
- [Formspree](https://formspree.io) （お問い合わせフォーム）
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) （サイトマップ自動生成）
