import React, { useEffect, useState } from 'react';

// API 연동을 위한 규격
interface CalendarEvent {
  id: string;
  title: string;
  country: string;
  date?: string;
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
  { id: '1', date: '04-10-2026', time: '8:30am', country: 'US', title: '소비자물가지수 (CPI)', impact: 'high', forecast: '3.1%', previous: '3.2%' },
  { id: '2', date: '04-10-2026', time: '8:30am', country: 'US', title: '신규 실업수당청구건수', impact: 'medium', forecast: '210K', previous: '212K' },
  { id: '3', date: '04-11-2026', time: '2:00pm', country: 'US', title: 'FOMC 기자회견', impact: 'high', forecast: '-', previous: '-' },
  { id: '4', date: '04-12-2026', time: '10:00am', country: 'CN', title: '중국 제조업 PMI', impact: 'medium', forecast: '50.1', previous: '49.8' }
];

// ForexFactory의 US Eastern Time을 KST(한국 표준시)로 변환하는 함수
function parseFFDateTimeToKST(dateStr?: string, timeStr?: string) {
  if (!dateStr || !timeStr) return { date: dateStr || '', time: timeStr || '' };

  const isTBD = timeStr.toLowerCase().includes('tentative') || timeStr.toLowerCase().includes('all day');
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return { date: dateStr, time: timeStr };
  // ForexFactory date format is typically MM-DD-YYYY
  const [mm, dd, yyyy] = parts;

  if (isTBD) {
    return { date: `${mm}.${dd}`, time: timeStr.toLowerCase().includes('all') ? '종일' : '미정' };
  }

  let hours = 0; let min = 0;
  const timeMatch = timeStr.match(/(\d+):(\d+)([ap]m)/i);
  if (timeMatch) {
    const [, h, m, ap] = timeMatch;
    hours = parseInt(h, 10);
    min = parseInt(m, 10);
    if (ap.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (ap.toLowerCase() === 'am' && hours === 12) hours = 0;
  } else if (timeStr.includes(':')) {
    // 24-hour format contingency
    const [h, m] = timeStr.split(':');
    hours = parseInt(h, 10);
    min = parseInt(m, 10);
  }

  try {
    // US Eastern Time의 서머타임(EDT)/표준시(EST) 오프셋 자동 판별
    const testDate = new Date(Date.UTC(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd)));
    const offsetStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }).format(testDate);
    const offset = offsetStr.includes('EDT') ? '-04:00' : '-05:00';
    
    // ISO 8601 포맷으로 변환 -> 브라우저가 자동 파싱 & 로컬 타임(KST)으로 자동 변환
    const isoString = `${yyyy}-${mm}-${dd}T${hours.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00${offset}`;
    const d = new Date(isoString);

    if (isNaN(d.getTime())) throw new Error('Invalid Date');

    const kstM = (d.getMonth() + 1).toString().padStart(2, '0');
    const kstD = d.getDate().toString().padStart(2, '0');
    const dow = ['일','월','화','수','목','금','토'][d.getDay()];
    const kstH = d.getHours().toString().padStart(2, '0');
    const kstMin = d.getMinutes().toString().padStart(2, '0');

    return {
      rawDateObj: d,
      date: `${kstM}.${kstD}(${dow})`,
      time: `${kstH}:${kstMin}`
    };
  } catch (e) {
    return { rawDateObj: new Date(), date: `${mm}.${dd}`, time: timeStr };
  }
}

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
        {events.map((ev, i) => {
          const { date, time } = parseFFDateTimeToKST(ev.date, ev.time);
          const isHigh = ev.impact === 'high';
          const isTBD = time === '종일' || time === '미정';
          
          let showDateHeader = false;
          if (i === 0) {
            showDateHeader = true;
          } else {
            const prev = parseFFDateTimeToKST(events[i-1].date, events[i-1].time);
            if (prev.date !== date) showDateHeader = true;
          }
          
          return (
            <React.Fragment key={ev.id}>
              {showDateHeader && date && (
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginTop: i === 0 ? '0' : '0.75rem', marginBottom: '-0.2rem', paddingLeft: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  📅 {date}
                </div>
              )}
              <div className="calendar-card">
                <div className="calendar-time-col">
                  <span style={{ fontSize: '1.2rem' }}>{COUNTRY_FLAGS[ev.country] || '🌍'}</span>
                  <div style={{ marginTop: '4px', fontSize: '0.75rem', fontWeight: 600, color: isHigh ? 'var(--bear)' : 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                    {time}
                  </div>
                </div>
                <div className="calendar-data-col">
                  <div className="event-title" title={ev.title}>{ev.title}</div>
                  <div className="calendar-stats">
                    <div className="stat-group">
                      <span className="stat-label">Prev</span>
                      <span className="stat-value">{ev.previous}</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-group">
                      <span className="stat-label" style={{ color: 'var(--accent-primary)' }}>Est</span>
                      <span className="stat-value" style={{ color: 'var(--text-primary)' }}>{ev.forecast}</span>
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <style>{`
        .calendar-card { display: flex; align-items: stretch; background: rgba(200, 200, 200, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; transition: all 0.2s ease; }
        .calendar-card:hover { background: var(--card-bg-hover); border-color: var(--border-hover); }
        .calendar-time-col { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 45px; padding-right: 0.75rem; border-right: 1px solid var(--glass-border); }
        .calendar-data-col { flex: 1; min-width: 0; padding-left: 0.75rem; display: flex; flex-direction: column; justify-content: center; }
        .event-title { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; cursor: default; }
        .calendar-stats { display: flex; align-items: flex-end; gap: 0.85rem; margin-top: 8px; font-family: var(--font-mono); }
        .stat-group { display: flex; flex-direction: column; gap: 2px; }
        .stat-label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; }
        .stat-value { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); line-height: 1; letter-spacing: -0.2px; }
        .stat-divider { width: 1px; height: 18px; background: var(--border-color); margin-bottom: 2px; }
        [data-theme='light'] .calendar-card { background: rgba(0, 0, 0, 0.01); }
        [data-theme='light'] .calendar-card:hover { background: var(--card-bg-hover); }
      `}</style>
    </div>
  );
}
