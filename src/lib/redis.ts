import { Redis } from '@upstash/redis';

// Upstash는 V8 Edge (Cloudflare Workers) 환경을 기본 지원합니다.
// @ts-ignore
const envUrl = typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_URL : '';
// @ts-ignore
const envToken = typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_TOKEN : '';

export function getRedis(context?: any) {
  // @ts-ignore
  const envUrl = typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_URL : '';
  // @ts-ignore
  const envToken = typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_TOKEN : '';

  const url = context?.locals?.runtime?.env?.UPSTASH_REDIS_REST_URL || import.meta.env.UPSTASH_REDIS_REST_URL || envUrl || '';
  const token = context?.locals?.runtime?.env?.UPSTASH_REDIS_REST_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN || envToken || '';

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

export async function setGlobalMarketData(data: any) {
  try {
    // 15초 TTL 부여 (데이터가 신선하도록 유지)
    await redis.set('gidne_market_data', JSON.stringify(data), { ex: 15 });
  } catch (error) {
    console.error('[Redis] SET Error:', error);
  }
}
