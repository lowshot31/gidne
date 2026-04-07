import React, { useEffect, useRef, useState, memo } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';

interface Props {
  ticker: string;
  name: string;
}

function CustomLightweightChart({ ticker, name }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAndRender = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/chart?ticker=${encodeURIComponent(ticker)}&interval=1d`);
        if (!res.ok) throw new Error('Data fetch failed');
        const data = await res.json();
        
        if (!isMounted) return;

        if (!chartContainerRef.current) return;

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const bgColor = isLight ? '#ffffff' : '#161616';
        const textColor = isLight ? '#333333' : '#d1d4dc';
        const gridColor = isLight ? 'rgba(229, 229, 234, 1)' : 'rgba(42, 42, 42, 1)';
        const lineColor = '#2962FF';
        const topColor = isLight ? 'rgba(41, 98, 255, 0.2)' : 'rgba(41, 98, 255, 0.4)';

        // Determine if bull or bear overall trend for color
        let trendBull = true;
        if (data.length > 2) {
          trendBull = data[data.length - 1].close >= data[0].close;
        }
        
        const finalLineColor = trendBull ? '#22c55e' : '#ef5350';
        const finalTopColor = trendBull ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 83, 80, 0.3)';

        if (!chartRef.current) {
          const chart = createChart(chartContainerRef.current, {
            layout: {
              background: { type: ColorType.Solid, color: bgColor },
              textColor: textColor,
            },
            grid: {
              vertLines: { color: gridColor },
              horzLines: { color: gridColor },
            },
            timeScale: {
              timeVisible: true,
              secondsVisible: false,
              borderColor: gridColor,
            },
            rightPriceScale: {
              borderColor: gridColor,
            },
            autoSize: true,
          });

          const series = chart.addSeries(AreaSeries, {
            lineColor: finalLineColor,
            topColor: finalTopColor,
            bottomColor: 'rgba(0, 0, 0, 0)',
            lineWidth: 2,
          });

          chartRef.current = chart;
          seriesRef.current = series;
        } else {
          // Update colors if theme changed
          chartRef.current.applyOptions({
            layout: {
              background: { type: ColorType.Solid, color: bgColor },
              textColor: textColor,
            },
            grid: {
              vertLines: { color: gridColor },
              horzLines: { color: gridColor },
            }
          });
          seriesRef.current?.applyOptions({
            lineColor: finalLineColor,
            topColor: finalTopColor,
          });
        }

        const formattedData = data.map((d: any) => ({
          time: d.time as Time,
          value: d.close,
        }));

        seriesRef.current?.setData(formattedData);
        chartRef.current.timeScale().fitContent();
        
        setLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchAndRender();

    const handleThemeChange = () => {
      fetchAndRender();
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          handleThemeChange();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      isMounted = false;
      observer.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [ticker]);

  return (
    <div className="bento-item h-full price-chart-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem 1rem 0 1rem' }}>
        <h3 className="text-secondary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          {name}
        </h3>
        <div style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--bull)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          ✅ Gidne Native 실시간 차트
        </div>
      </div>
      
      {loading && <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading Chart Data...</div>}
      {error && <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="text-bear">Fail: {error}</div>}
      
      <div ref={chartContainerRef} style={{ flex: 1, width: '100%', minHeight: '350px', padding: '0 1rem 1rem 1rem' }} />
    </div>
  );
}

export default memo(CustomLightweightChart);
