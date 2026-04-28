import { Redis } from 'ioredis';

let globalRedis: Redis | null = null;

// Cloudflare 런타임 context에서 env를 동적으로 주입받아 Redis 클라이언트를 생성합니다.
export function getRedis(context?: any) {
  if (globalRedis) return globalRedis;

  // @ts-ignore
  const pEnvUrl = typeof process !== 'undefined' ? process.env.REDIS_URL : '';

  const url = context?.locals?.runtime?.env?.REDIS_URL || import.meta.env.REDIS_URL || pEnvUrl || '';

  globalRedis = new Redis(url);
  return globalRedis;
}

/**
 * 대용량 마켓 데이터를 Redis에 읽고 쓰는 헬퍼 함수
 */
export async function getGlobalMarketData(context?: any) {
  try {
    const redis = getRedis(context);
    const [marketData, holdingsData] = await Promise.all([
      redis.get('gidne_market_data'),
      redis.get('gidne_holdings_v2')
    ]);

    if (!marketData) return null;

    const parsedData = typeof marketData === 'string' ? JSON.parse(marketData) : marketData;
    const parsedHoldings = typeof holdingsData === 'string' ? JSON.parse(holdingsData) : holdingsData || {};
    
    // 프론트엔드 호환성을 위해 데이터를 병합하여 반환합니다.
    parsedData.holdings = parsedHoldings;
    return parsedData;
  } catch (error) {
    console.error('[Redis] GET Error:', error);
    return null;
  }
}

export async function setGlobalMarketData(data: any, context?: any) {
  try {
    const redis = getRedis(context);
    await redis.set('gidne_market_data', JSON.stringify(data), 'EX', 15);
  } catch (error) {
    console.error('[Redis] SET Error:', error);
  }
}
