import { Redis } from '@upstash/redis';

// Cloudflare 런타임 context에서 env를 동적으로 주입받아 Redis 클라이언트를 생성합니다.
export function getRedis(context?: any) {
  // @ts-ignore
  const pEnvUrl = typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_URL : '';
  // @ts-ignore
  const pEnvToken = typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_TOKEN : '';

  const url = context?.locals?.runtime?.env?.UPSTASH_REDIS_REST_URL || import.meta.env.UPSTASH_REDIS_REST_URL || pEnvUrl || '';
  const token = context?.locals?.runtime?.env?.UPSTASH_REDIS_REST_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN || pEnvToken || '';

  return new Redis({ url, token });
}

/**
 * 대용량 마켓 데이터를 Redis에 읽고 쓰는 헬퍼 함수
 */
export async function getGlobalMarketData(context?: any) {
  try {
    const redis = getRedis(context);
    return await redis.get('gidne_market_data');
  } catch (error) {
    console.error('[Redis] GET Error:', error);
    return null;
  }
}

export async function setGlobalMarketData(data: any, context?: any) {
  try {
    const redis = getRedis(context);
    // 15초 TTL 부여 (데이터가 신선하도록 유지)
    await redis.set('gidne_market_data', JSON.stringify(data), { ex: 15 });
  } catch (error) {
    console.error('[Redis] SET Error:', error);
  }
}
