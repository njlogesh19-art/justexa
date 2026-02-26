import React, { useEffect, useState } from 'react';

const ThemeToggle = () => {
    const [dark, setDark] = useState(() => {
        return localStorage.getItem('justexa_theme') === 'dark';
    });

    useEffect(() => {
        if (dark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('justexa_theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('justexa_theme', 'light');
        }
    }, [dark]);

    return (
        <button
            id="theme-toggle"
            onClick={() => setDark(d => !d)}
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px',
                borderRadius: '50%',
                border: '1.5px solid var(--gray-200)',
                background: 'var(--gray-100)',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s',
                color: 'var(--black)',
                flexShrink: 0,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--black)';
                e.currentTarget.style.color = 'var(--white)';
                e.currentTarget.style.borderColor = 'var(--black)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--gray-100)';
                e.currentTarget.style.color = 'var(--black)';
                e.currentTarget.style.borderColor = 'var(--gray-200)';
            }}
        >
            {dark ? '☀️' : '🌙'}
        </button>
    );
};

export default ThemeToggle;
