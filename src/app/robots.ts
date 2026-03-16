import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 검색엔진 + 소셜 미리보기 + 사용자 요청 AI 브라우징
      {
        userAgent: [
          // 검색엔진
          'Googlebot',
          'Bingbot',
          'Yeti',
          'DuckDuckBot',
          'Applebot',            // Apple Spotlight 검색 (학습봇 Applebot-Extended와 다름)
          // 소셜 미리보기 (링크 카드/OG 이미지)
          'facebookexternalhit', // Facebook 링크 미리보기
          'Facebot',             // Facebook OG 이미지 fetcher
          'Twitterbot',          // X/Twitter 링크 미리보기
          'LinkedInBot',         // LinkedIn 링크 미리보기
          'Discordbot',          // Discord 링크 카드
          'Slackbot-LinkExpanding', // Slack 링크 카드
          'TelegramBot',         // Telegram 링크 미리보기
          'WhatsApp',            // WhatsApp 링크 카드
          // 사용자가 URL을 공유했을 때 AI가 읽는 봇 (학습 크롤러와 다름)
          'ChatGPT-User',        // ChatGPT에서 사용자가 URL 공유 시 읽기
          'Claude-Web',          // Claude에서 사용자가 URL 공유 시 읽기
          'PerplexityBot',       // Perplexity 실시간 검색 답변용
        ],
        allow: '/',
      },
      // AI 학습 크롤러 차단 (사이트 전체 수집 → 모델 학습 목적)
      {
        userAgent: [
          'GPTBot',              // OpenAI 학습 크롤러
          'CCBot',               // Common Crawl (AI 학습 데이터셋)
          'Google-Extended',     // Google Gemini 학습 크롤러
          'anthropic-ai',        // Anthropic 학습 크롤러
          'ClaudeBot',           // Anthropic 학습 크롤러 (구버전)
          'Bytespider',          // ByteDance/TikTok 학습 크롤러
          'Cohere-ai',           // Cohere 학습 크롤러
          'FacebookBot',         // Meta AI 학습 크롤러 (facebookexternalhit와 다름)
          'Meta-ExternalAgent',  // Meta AI 에이전트 크롤러
          'Applebot-Extended',   // Apple AI 학습 크롤러 (Applebot과 다름)
          'Omgilibot',           // Webz.io 데이터 수집
          'Diffbot',             // Diffbot AI 크롤러
          'ImagesiftBot',        // 이미지 수집 크롤러
          'Amazonbot',           // Amazon Alexa 학습 크롤러
        ],
        disallow: '/',
      },
      // 미확인 봇 기본 차단
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  };
}
