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
  const [generalNews, setGeneralNews] = useState<NewsItem[]>([]);
  const [tickerNews, setTickerNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'ticker'>('all');

  // 전체 시장 뉴스 가져오기
  const fetchGeneralNews = async () => {
    try {
      const res = await fetch(`/api/news?q=stock market&count=15`);
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setGeneralNews(data);
    } catch (err) {
      console.error('Failed to fetch general news', err);
    }
  };

  // 워치리스트 종목 뉴스 가져오기
  const fetchTickerNews = async () => {
    try {
      const savedTickersStr = localStorage.getItem('gidne-watchlist') || '[]';
      const parsed = JSON.parse(savedTickersStr);
      const tickers: string[] = Array.isArray(parsed) 
        ? parsed.map((item: any) => typeof item === 'string' ? item : item?.ticker).filter(Boolean)
        : [];
      if (tickers.length === 0) {
        setTickerNews([]);
        return;
      }
      const query = tickers.slice(0, 5).join(',');
      const res = await fetch(`/api/news?q=${encodeURIComponent(query)}&count=15`);
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setTickerNews(data);
    } catch (err) {
      console.error('Failed to fetch ticker news', err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([fetchGeneralNews(), fetchTickerNews()]);
      setLoading(false);
    };
    fetchAll();

    const handleStorageChange = () => { fetchTickerNews(); };
    window.addEventListener('gidne_watchlist_updated', handleStorageChange);
    
    const iv = setInterval(() => {
      fetchGeneralNews();
      fetchTickerNews();
    }, 60000);
    return () => {
      clearInterval(iv);
      window.removeEventListener('gidne_watchlist_updated', handleStorageChange);
    };
  }, []);

  const timeAgo = (publishTime: string | number | Date) => {
    if (!publishTime) return '';
    let pubDate = new Date(publishTime);
    if (typeof publishTime === 'number' && publishTime < 10000000000) {
      pubDate = new Date(publishTime * 1000);
    }
    if (isNaN(pubDate.getTime())) return '얼마 전';
    const diffMs = Date.now() - pubDate.getTime();
    if (diffMs < 0) return '방금 전';
    const diff = Math.floor(diffMs / 60000);
    if (diff < 1) return '방금 전';
    if (diff < 60) return `${diff}분 전`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const displayedNews = activeTab === 'all' ? generalNews : tickerNews;

  return (
    <div className="bento-item h-full flex flex-col" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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
              <img src="https://www.google.com/s2/favicons?domain=saveticker.com&sz=16" alt="" style={{ width: '14px', height: '14px', borderRadius: '2px' }} />
              세이브티커 ↗
            </a>
          }
        />
      </div>

      <div className="gidne-list-container" style={{ flex: 1, paddingRight: '4px' }}>
        {!loading && displayedNews.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
            {activeTab === 'ticker' ? '워치리스트에 종목을 추가하면 관련 뉴스가 표시됩니다.' : '뉴스를 불러오는 중...'}
          </div>
        ) : (
          displayedNews.map((item: NewsItem) => {
            return (
              <a key={item.uuid} href={item.link} target="_blank" rel="noopener noreferrer" className="gidne-list-row news-card-override">
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


        .live-squawk-btn {
          text-decoration: none;
          font-size: 0.75rem;
          padding: 0.35rem 0.7rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-muted);
          background: transparent;
          border: none;
          white-space: nowrap;
        }
        .live-squawk-btn:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .news-card-override {
          align-items: flex-start !important;
          flex-direction: column !important;
          gap: 6px;
          text-decoration: none;
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
