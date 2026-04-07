import React, { useEffect, useState } from 'react';
import SegmentedControl from './SegmentedControl';

interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  type?: 'article' | 'squawk';
}

export default function WatchlistNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'ticker'>('all');

  // Poll news every 1 minute
  useEffect(() => {
    const fetchNews = async () => {
      try {
        // 실제 워치리스트 키: 'gidne-watchlist', 형태: {ticker: string, addedAt: string}[]
        const savedTickersStr = localStorage.getItem('gidne-watchlist') || '[]';
        const parsed = JSON.parse(savedTickersStr);
        const tickers: string[] = Array.isArray(parsed) 
          ? parsed.map((item: any) => typeof item === 'string' ? item : item?.ticker).filter(Boolean)
          : [];
        // 검색 쿼리가 너무 길면 야후 파이낸스에서 결과가 떨어지므로 최근 3개만 대표로 쿼리
        const query = (tickers.length > 0 ? tickers.slice(0, 3).join(',') : 'finance');
        
        const res = await fetch(`/api/news?q=${query}&count=15`);
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        setNews(data);
      } catch (err) {
        console.error('Failed to fetch news', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
    
    // 워치리스트 변경 이벤트를 수신해서 즉시 뉴스 업데이트
    const handleStorageChange = () => { fetchNews(); };
    window.addEventListener('gidne_watchlist_updated', handleStorageChange);
    
    const iv = setInterval(fetchNews, 60000);
    return () => {
      clearInterval(iv);
      window.removeEventListener('gidne_watchlist_updated', handleStorageChange);
    };
  }, []);

  const timeAgo = (publishTime: string | number | Date) => {
    if (!publishTime) return '';
    
    // Date 객체 생성 (문자열이든 밀리초든 모두 커버)
    let pubDate = new Date(publishTime);
    
    // 만약 timestamp가 (밀리초가 아닌) '초(seconds)' 단위라면 1970년대로 파싱됨
    if (typeof publishTime === 'number' && publishTime < 10000000000) {
      pubDate = new Date(publishTime * 1000);
    }
    
    if (isNaN(pubDate.getTime())) return '얼마 전';
    
    const diffMs = Date.now() - pubDate.getTime();
    if (diffMs < 0) return '방금 전'; // 시스템 시간 오차 방지
    
    const diff = Math.floor(diffMs / 60000);
    if (diff < 1) return '방금 전';
    if (diff < 60) return `${diff}분 전`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const filteredNews = news.filter((item) => {
    if (activeTab === 'ticker') return item.type === 'article';
    return true;
  });

  return (
    <div className="bento-item h-full flex flex-col" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <h3 className="text-secondary" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>🗞️</span> NEWS 
          {loading && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginLeft: '4px', fontWeight: 'normal' }}>...</span>}
        </h3>
        <SegmentedControl 
          tabs={[
            { id: 'all', label: '📰 전체' },
            { id: 'ticker', label: '🎯 종목' }
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as any)}
          size="sm"
          suffix={
            <a href="https://www.saveticker.com/app/news" target="_blank" rel="noopener noreferrer" className="live-squawk-btn" title="세이브티커 실시간 뉴스 열기">
              세이브티커 ↗
            </a>
          }
        />
      </div>

      <div className="news-scroll-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '4px' }}>
        {!loading && filteredNews.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
            해당 탭에 뉴스가 없습니다.
          </div>
        ) : (
          filteredNews.map((item) => {
            return (
              <a key={item.uuid} href={item.link} target="_blank" rel="noopener noreferrer" className="news-card">
                <div className="news-meta">
                  <span className="news-publisher">
                    {item.publisher}
                  </span>
                  <span className="news-time">{timeAgo(item.providerPublishTime)}</span>
                </div>
                <div className="news-title">
                  {item.title}
                </div>
              </a>
            );
          })
        )}
      </div>

      <style>{`
        .news-scroll-container::-webkit-scrollbar { width: 4px; }
        .news-scroll-container::-webkit-scrollbar-track { background: transparent; }
        .news-scroll-container::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .news-scroll-container:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
        


        .live-squawk-btn {
          background: rgba(239, 83, 80, 0.1) !important;
          color: var(--bear) !important;
          border: 1px solid rgba(239, 83, 80, 0.3) !important;
          text-decoration: none;
          font-size: 0.65rem;
          font-family: var(--font-mono);
          padding: 3px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }
        .live-squawk-btn:hover {
          background: rgba(239, 83, 80, 0.2) !important;
          box-shadow: 0 0 8px rgba(239, 83, 80, 0.2);
        }

        .news-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          background: rgba(200, 200, 200, 0.02);
          border: 1px solid var(--border-color);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .news-squawk {
          background: rgba(239, 83, 80, 0.05);
          border-color: rgba(239, 83, 80, 0.2);
        }
        .news-card:hover {
          background: var(--card-bg-hover);
          border-color: var(--accent-primary);
        }
        .news-squawk:hover {
          background: rgba(239, 83, 80, 0.1);
          border-color: rgba(239, 83, 80, 0.5);
          box-shadow: 0 0 10px rgba(239, 83, 80, 0.1);
        }
        [data-theme='light'] .news-card { background: rgba(0,0,0,0.02); }
        [data-theme='light'] .news-card:hover { background: rgba(0,0,0,0.05); border-color: var(--accent-primary); }
        
        .news-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.65rem;
          font-family: var(--font-mono);
        }
        .news-publisher {
          color: var(--accent-primary);
          font-weight: 700;
          letter-spacing: 0.2px;
        }
        .news-time {
          color: var(--text-muted);
        }
        .news-title {
          font-size: 0.85rem;
          color: var(--text-primary);
          line-height: 1.4;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
