/**
 * ============================================================
 * サイト設定ファイル
 * ここを書き換えるだけで全ページに反映されます
 * Claude の設計・コピーフェーズの出力をここに貼り込んでください
 * ============================================================
 */

export const SITE = {
  // 基本情報
  name: '会社名をここに入力',
  tagline: 'キャッチコピーをここに入力',
  description: 'meta descriptionをここに入力（120字以内）',
  url: 'https://example.com', // 本番URLに変更
  locale: 'ja_JP',

  // 連絡先
  contact: {
    address: '〒000-0000 都道府県市区町村番地',
    tel: '000-0000-0000',
    email: 'info@example.com',
    hours: '平日 9:00〜18:00',
  },

  // お問い合わせフォーム（Formspree）
  // https://formspree.io でフォームIDを取得して入力
  formspreeId: 'YOUR_FORMSPREE_ID',

  // Google Analytics 4
  // GA4のMeasurement IDを入力（例: G-XXXXXXXXXX）
  ga4Id: '', // 空文字のままにするとGA4は無効

  // OGP画像（public/ogp.png を配置してください）
  ogpImage: '/ogp.png',
} as const;

// ナビゲーション
export const NAV_LINKS = [
  { href: '/', label: 'ホーム' },
  { href: '/service', label: 'サービス' },
  { href: '/about', label: '会社概要' },
  { href: '/contact', label: 'お問い合わせ' },
] as const;

// トップページ コンテンツ
export const HOME_PAGE = {
  hero: {
    title: 'メインキャッチコピー\n（20字以内）',
    subtitle: 'サブキャッチコピー。ターゲットの悩みに刺さる一文を入れてください。（40字以内）',
    ctaLabel: '無料相談はこちら',
    ctaHref: '/contact',
  },
  features: [
    {
      title: '強み・特徴 01',
      description: '強みの説明文。お客様にとってのベネフィットを80字程度で記述してください。',
    },
    {
      title: '強み・特徴 02',
      description: '強みの説明文。お客様にとってのベネフィットを80字程度で記述してください。',
    },
    {
      title: '強み・特徴 03',
      description: '強みの説明文。お客様にとってのベネフィットを80字程度で記述してください。',
    },
  ],
  reasons: [
    { num: '01', title: '選ばれる理由 01', description: '理由の説明文をここに入力してください。' },
    { num: '02', title: '選ばれる理由 02', description: '理由の説明文をここに入力してください。' },
    { num: '03', title: '選ばれる理由 03', description: '理由の説明文をここに入力してください。' },
    { num: '04', title: '選ばれる理由 04', description: '理由の説明文をここに入力してください。' },
  ],
  cta: {
    title: 'まずはお気軽にご相談ください',
    subtitle: '無料相談を承っております。お気軽にお問い合わせください。',
    label: '無料相談する',
  },
} as const;

// サービスページ コンテンツ
export const SERVICE_PAGE = {
  heading: 'サービス',
  subheading: 'お客様のニーズに合わせたサービスをご提供しています。',
  services: [
    {
      title: 'サービス名 01',
      description: 'サービスの詳細説明文（150字程度）をここに入力してください。',
      features: ['特徴・ポイント 1', '特徴・ポイント 2', '特徴・ポイント 3'],
    },
    {
      title: 'サービス名 02',
      description: 'サービスの詳細説明文（150字程度）をここに入力してください。',
      features: ['特徴・ポイント 1', '特徴・ポイント 2', '特徴・ポイント 3'],
    },
    {
      title: 'サービス名 03',
      description: 'サービスの詳細説明文（150字程度）をここに入力してください。',
      features: ['特徴・ポイント 1', '特徴・ポイント 2', '特徴・ポイント 3'],
    },
  ],
} as const;

// 会社概要ページ コンテンツ
export const ABOUT_PAGE = {
  mission: '企業理念・ミッションをここに入力してください。（50字以内）',
  message: `代表メッセージをここに入力してください。

  300〜400字程度の文章を入れてください。改行も反映されます。`,
  companyInfo: [
    { label: '会社名', value: '株式会社〇〇' },
    { label: '設立', value: '年月' },
    { label: '代表者', value: '代表取締役 氏名' },
    { label: '所在地', value: '〒000-0000 都道府県市区町村番地' },
    { label: '電話番号', value: '000-0000-0000' },
    { label: 'メール', value: 'info@example.com' },
    { label: '事業内容', value: 'サービス01、サービス02' },
  ],
} as const;

// カラー設定（CSS変数として global.css に反映されます）
export const COLORS = {
  primary: '#2563eb',   // メインカラー（青）
  accent: '#f59e0b',    // アクセントカラー（黄）
  dark: '#111827',      // 濃色テキスト
  light: '#f9fafb',     // 背景色
} as const;
