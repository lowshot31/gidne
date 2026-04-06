import type { APIRoute } from 'astro';
import { getGlobalMarketData } from '../../lib/redis';

export const GET: APIRoute = async (context) => {
  try {
    const data = await getGlobalMarketData(context);
    
    // 만약 데이터 펌프가 죽어있거나 캐시가 만료된 경우
    if (!data) {
      return new Response(JSON.stringify({ error: 'Data pump is not running or cache missed.' }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Redis에서 성공적으로 가져온 데이터 서빙 (Cloudflare Edge에서 엄청 빠르게 응답)
    return new Response(typeof data === 'string' ? data : JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5', // 엣지 서버에서 5초만 자체 캐시
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch from global cache',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
