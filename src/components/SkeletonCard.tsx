import React from 'react';

export default function SkeletonCard({ title = "Loading..." }: { title?: string }) {
  return (
    <div className="bento-item h-full" style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 className="text-secondary mb-md">{title}</h3>
      <div 
        style={{
          flex: 1,
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(90deg, #0f0f14 25%, #1a1a24 50%, #0f0f14 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear'
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
