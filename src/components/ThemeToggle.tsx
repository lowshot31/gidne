import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('gidne-theme');
    if (saved === 'light') {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('gidne-theme', newTheme);
  };

  return (
    <button 
      onClick={toggle} 
      className="theme-toggle"
      title={theme === 'dark' ? "Light Mode" : "Dark Mode"}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
      <style>{`
        .theme-toggle {
          background: none;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: 0.3rem 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .theme-toggle:hover {
          border-color: var(--accent-primary);
          background: var(--card-bg-hover);
        }
      `}</style>
    </button>
  );
}
