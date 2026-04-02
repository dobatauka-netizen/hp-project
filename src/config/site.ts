/**
 * ============================================================
 * サイト設定ファイル（テンプレート）
 *
 * 【使い方】
 * 1. 「★必須」マークの項目をすべて埋める
 * 2. 「☆任意」マークの項目は必要に応じて変更
 * 3. 各ページのコンテンツを書き換える
 *
 * このファイルだけ編集すれば全ページに反映されます
 * ============================================================
 */

// ─── ★必須：サイト基本情報 ─────────────────────────
export const SITE = {
  name: '会社名',                                      // ★必須
  tagline: 'キャッチコピー',                             // ★必須
  description: 'meta descriptionを120字以内で入力',      // ★必須
  url: 'https://example.com',                           // ★必須：本番URL
  locale: 'ja_JP',                                      // ☆任意

  // ★必須：連絡先
  contact: {
    address: '〒000-0000 都道府県市区町村番地',
    tel: '000-0000-0000',
    email: 'info@example.com',
    hours: '平日 9:00〜18:00',
  },

  // ☆任意：外部サービス連携
  formspreeId: '',    // Formspree フォームID（https://formspree.io）
  ga4Id: '',          // GA4 Measurement ID（例: G-XXXXXXXXXX）
  ogpImage: '/ogp.png',  // public/ogp.png を配置
} as const;

// ─── ☆任意：ナビゲーション ──────────────────────────
export const NAV_LINKS = [
  { href: '/', label: 'ホーム' },
  { href: '/service', label: 'サービス' },
  { href: '/about', label: '会社概要' },
  { href: '/contact', label: 'お問い合わせ' },
] as const;

// ─── トップページ ───────────────────────────────────
export const HOME_PAGE = {
  hero: {
    title: 'メインキャッチコピー',
    subtitle: 'サブキャッチコピー。ターゲットの悩みに刺さる一文。',
    ctaLabel: '無料相談はこちら',
    ctaHref: '/contact',
  },
  features: [
    {
      title: '強み・特徴 01',
      description: 'お客様にとってのベネフィットを記述。',
    },
    {
      title: '強み・特徴 02',
      description: 'お客様にとってのベネフィットを記述。',
    },
    {
      title: '強み・特徴 03',
      description: 'お客様にとってのベネフィットを記述。',
    },
  ],
  reasons: [
    { num: '01', title: '選ばれる理由 01', description: '理由の説明文。' },
    { num: '02', title: '選ばれる理由 02', description: '理由の説明文。' },
    { num: '03', title: '選ばれる理由 03', description: '理由の説明文。' },
    { num: '04', title: '選ばれる理由 04', description: '理由の説明文。' },
  ],
  cta: {
    title: 'まずはお気軽にご相談ください',
    subtitle: '無料相談を承っております。お気軽にお問い合わせください。',
    label: '無料相談する',
  },
} as const;

// ─── サービスページ ─────────────────────────────────
export const SERVICE_PAGE = {
  heading: 'サービス',
  subheading: 'お客様のニーズに合わせたサービスをご提供しています。',
  services: [
    {
      title: 'サービス名 01',
      description: 'サービスの詳細説明文。',
      features: ['特徴 1', '特徴 2', '特徴 3'],
    },
    {
      title: 'サービス名 02',
      description: 'サービスの詳細説明文。',
      features: ['特徴 1', '特徴 2', '特徴 3'],
    },
    {
      title: 'サービス名 03',
      description: 'サービスの詳細説明文。',
      features: ['特徴 1', '特徴 2', '特徴 3'],
    },
  ],
} as const;

// ─── 会社概要ページ ─────────────────────────────────
export const ABOUT_PAGE = {
  mission: '企業理念・ミッション。',
  message: `代表メッセージ。

改行も反映されます。`,
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

// ─── プライバシーポリシーページ ──────────────────────
export const PRIVACY_PAGE = {
  lastUpdated: '2024年4月1日',
  sections: [
    {
      title: '個人情報の収集',
      content: '当社は、お問い合わせフォームを通じて、お名前、メールアドレス、会社名等の個人情報を収集することがあります。',
    },
    {
      title: '個人情報の利用目的',
      content: '収集した個人情報は、お問い合わせへの対応、サービスのご案内、その他当社事業に関連する目的に利用いたします。',
    },
    {
      title: '個人情報の第三者提供',
      content: '当社は、法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供することはありません。',
    },
    {
      title: '個人情報の管理',
      content: '当社は、個人情報の正確性及び安全性を確保するために、セキュリティ対策を講じ、個人情報の漏洩、紛失、改ざん等の防止に努めます。',
    },
    {
      title: 'Cookieの使用',
      content: '当サイトでは、利便性の向上やアクセス解析のためにCookieを使用する場合があります。ブラウザの設定により、Cookieの受け取りを拒否することができます。',
    },
    {
      title: 'お問い合わせ',
      content: '個人情報の取り扱いに関するお問い合わせは、当サイトのお問い合わせフォームよりご連絡ください。',
    },
  ],
} as const;
