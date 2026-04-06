import React, { useEffect, useState } from 'react';

// API 연동을 위한 규격
interface CalendarEvent {
  id: string;
  title: string;
  country: string;
  time: string;
  impact: string;
  forecast: string;
  previous: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', JP: '🇯🇵', CN: '🇨🇳'
};

// 무료 공개 API가 모두 막혀있으므로, .env에 API 키를 넣기 전까지 보여줄 더미 데이터
const FALLBACK_EVENTS: CalendarEvent[] = [
  { id: '1', time: '22:30', country: 'US', title: '소비자물가지수 (CPI)', impact: 'high', forecast: '3.1%', previous: '3.2%' },
  { id: '2', time: '22:30', country: 'US', title: '신규 실업수당청구건수', impact: 'medium', forecast: '210K', previous: '212K' },
  { id: '3', time: '04:00', country: 'US', title: 'FOMC 기자회견', impact: 'high', forecast: '-', previous: '-' },
  { id: '4', time: '11:00', country: 'CN', title: '중국 제조업 PMI', impact: 'medium', forecast: '50.1', previous: '49.8' }
];

export default function EconomicCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(FALLBACK_EVENTS);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    fetch('/api/calendar')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setIsDemo(false);
        }
      })
      .catch(err => {
        console.log('Using fallback demo data for calendar:', err);
      });
  }, []);

  return (
    <div className="bento-item h-full" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <h3 className="text-secondary" style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <span>🗓️</span> MAJOR EVENTS
        </h3>
        <span style={{ 
          fontSize: '0.7rem', 
          color: isDemo ? 'var(--bear)' : 'var(--accent-primary)', 
          background: isDemo ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0,180,216,0.1)', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontWeight: isDemo ? 500 : 600
        }}>
          {isDemo ? '⚠️ Offline' : 'Live'}
        </span>
      </div>

      <div className="calendar-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px' }}>
        {events.map(ev => {
          const isHigh = ev.impact === 'high';
          const isTBD = ev.time.toLowerCase() === 'tentative' || ev.time === 'All Day';
          
          return (
            <div key={ev.id} className="calendar-card">
              <div className="calendar-time-col">
                <span style={{ fontSize: '1.2rem' }}>{COUNTRY_FLAGS[ev.country] || '🌍'}</span>
                <div style={{ marginTop: '4px', fontSize: '0.7rem', fontWeight: 600, color: isHigh ? 'var(--bear)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {isTBD ? 'TBD' : ev.time}
                </div>
              </div>
              <div className="calendar-data-col">
                <div className="event-title" title={ev.title}>{ev.title}</div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  <div className="stat-pill"><span className="text-muted">Prev</span><span className="text-primary">{ev.previous}</span></div>
                  <div className="stat-pill"><span className="text-muted">Est</span><span className="text-primary">{ev.forecast}</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .calendar-card { display: flex; align-items: stretch; background: rgba(200, 200, 200, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; transition: all 0.2s ease; }
        .calendar-card:hover { background: var(--card-bg-hover); border-color: var(--border-hover); }
        .calendar-time-col { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 45px; padding-right: 0.75rem; border-right: 1px solid var(--glass-border); }
        .calendar-data-col { flex: 1; min-width: 0; padding-left: 0.75rem; display: flex; flex-direction: column; justify-content: center; }
        .event-title { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; cursor: default; }
        .stat-pill { display: flex; gap: 4px; background: rgba(0, 0, 0, 0.2); padding: 2px 6px; border-radius: 4px; }
        [data-theme='light'] .stat-pill { background: rgba(0, 0, 0, 0.04); }
        [data-theme='light'] .calendar-card { background: rgba(0, 0, 0, 0.01); }
        [data-theme='light'] .calendar-card:hover { background: var(--card-bg-hover); }
      `}</style>
    </div>
  );
}
