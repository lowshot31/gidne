import React, { useEffect, useRef, useState, memo } from 'react';
import { createChart, ColorType, AreaSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';

interface Props {
  ticker: string;
  name: string;
  hideWrapper?: boolean;
  compareTicker?: string;
  compareName?: string;
}

function CustomLightweightChart({ ticker, name, hideWrapper, compareTicker, compareName }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const compareSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAndRender = async () => {
      try {
        setLoading(true);
        const fetches = [fetch(`/api/chart?ticker=${encodeURIComponent(ticker)}&interval=1d`)];
        if (compareTicker) {
          fetches.push(fetch(`/api/chart?ticker=${encodeURIComponent(compareTicker)}&interval=1d`));
        }

        const responses = await Promise.all(fetches);
        for (const res of responses) {
          if (!res.ok) throw new Error('Data fetch failed');
        }

        const data = await responses[0].json();
        const compareData = compareTicker ? await responses[1].json() : null;
        
        if (!isMounted) return;

        if (!chartContainerRef.current) return;

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const cs = getComputedStyle(document.documentElement);
        const bgColor = cs.getPropertyValue('--card-bg').trim();
        const textColor = cs.getPropertyValue('--text-secondary').trim();
        const gridColor = cs.getPropertyValue('--glass-border').trim();
        const compColor = isLight ? 'rgba(163, 117, 28, 0.8)' : 'rgba(200, 155, 60, 0.8)'; // accent-primary 계열

        // Determine if bull or bear overall trend for color
        let trendBull = true;
        if (data.length > 2) {
          trendBull = data[data.length - 1].close >= data[0].close;
        }
        
        const bullColor = cs.getPropertyValue('--bull').trim();
        const bearColor = cs.getPropertyValue('--bear').trim();
        const finalLineColor = trendBull ? bullColor : bearColor;
        const finalTopColor = trendBull ? `${bullColor}4D` : `${bearColor}4D`; // ~30% opacity hex suffix

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
            priceScaleId: 'right',
          });

          chartRef.current = chart;
          seriesRef.current = series;

          if (compareTicker) {
            chart.priceScale('left').applyOptions({
              visible: true,
              borderColor: gridColor,
            });
            const cSeries = chart.addSeries(LineSeries, {
              color: compColor,
              lineWidth: 2,
              lineStyle: 0,
              priceScaleId: 'left',
            });
            compareSeriesRef.current = cSeries;
          }
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
          if (compareSeriesRef.current) {
            compareSeriesRef.current.applyOptions({ color: compColor });
          }
        }

        const formattedData = data.map((d: any) => ({
          time: d.time as Time,
          value: d.close,
        }));
        seriesRef.current?.setData(formattedData);

        if (compareData && compareSeriesRef.current) {
          const fmtComp = compareData.map((d: any) => ({
            time: d.time as Time,
            value: d.close,
          }));
          compareSeriesRef.current.setData(fmtComp);
        }

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

  const chartContent = (
    <>
      {loading && <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading Chart Data...</div>}
      {error && <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="text-bear">Fail: {error}</div>}
      <div ref={chartContainerRef} style={{ flex: 1, width: '100%', minHeight: hideWrapper ? '100%' : '350px', padding: hideWrapper ? '0' : '0 1rem 1rem 1rem' }} />
    </>
  );

  if (hideWrapper) {
    return (
      <div className="price-chart-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
        {chartContent}
      </div>
    );
  }

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
      
      {chartContent}
    </div>
  );
}

export default memo(CustomLightweightChart);
