import type { APIRoute } from 'astro';
import { getRedis } from '../../lib/redis';

export const GET: APIRoute = async (context) => {
  const redis = getRedis(context);
  const CACHE_KEY = 'gidne_calendar_v2';

  try {
    const cached = await redis.get(CACHE_KEY);
    if (!cached) {
      return new Response(JSON.stringify({ error: 'Data pump is not running or cache missed.' }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('[API] /api/calendar error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch from global cache' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};
