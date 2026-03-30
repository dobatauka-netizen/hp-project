export const prerender = false;

import Anthropic from '@anthropic-ai/sdk';
import type { APIRoute } from 'astro';
import { SITE, SERVICE_PAGE, ABOUT_PAGE, ASSISTANT_CONFIG } from '../../config/site';

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(): string {
  const services = SERVICE_PAGE.services
    .map((s) => `・${s.title}：${s.description}`)
    .join('\n');

  const companyInfo = ABOUT_PAGE.companyInfo
    .map((item) => `${item.label}：${item.value}`)
    .join('\n');

  return `あなたは「${SITE.name}」の公式AIアシスタントです。
サイトを訪問したユーザーからの質問に、親切・丁寧・簡潔に日本語で答えてください。

## 会社情報
${companyInfo}
電話番号：${SITE.contact.tel}
メール：${SITE.contact.email}
営業時間：${SITE.contact.hours}
住所：${SITE.contact.address}

## 提供サービス
${services}

## 企業理念
${ABOUT_PAGE.mission}

## 回答のガイドライン
- 回答は簡潔にまとめてください（200字以内を目安）
- 分からないことは正直に伝え、お問い合わせフォームや電話への誘導を行ってください
- 常に丁寧で親しみやすいトーンを保ってください
- 価格・納期など具体的な数値は「お問い合わせください」と案内してください
${ASSISTANT_CONFIG.systemPromptExtra ? `\n## 追加情報\n${ASSISTANT_CONFIG.systemPromptExtra}` : ''}`.trim();
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages が必要です' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: buildSystemPrompt(),
      messages,
    });

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    return new Response(JSON.stringify({ reply: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return new Response(
      JSON.stringify({ error: 'エラーが発生しました。しばらくしてからお試しください。' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
