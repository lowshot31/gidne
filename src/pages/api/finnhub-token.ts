// src/pages/api/finnhub-token.ts
// Finnhub WebSocket 토큰을 클라이언트에 안전하게 전달하는 엔드포인트
// .env 파일의 FINNHUB_API_KEY를 서버에서만 읽고, 클라이언트에는 토큰만 노출
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const token = import.meta.env.FINNHUB_API_KEY;

  if (!token) {
    return new Response(JSON.stringify({ error: 'FINNHUB_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
