import { useEffect, useState } from 'react';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--sage-100)',
        boxShadow: scrolled ? '0 1px 0 rgba(90,114,72,0.10)' : 'none',
        transition: 'box-shadow 300ms ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Logo mark */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--sage-700)',
            letterSpacing: '0.12em',
            lineHeight: 1,
          }}
        >
          D|C
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            fontWeight: 400,
            color: 'var(--text-muted)',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            marginTop: '3px',
          }}
        >
          DANIELA CORRAL
        </div>
      </div>

      {/* Location tag */}
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          color: 'var(--text-hint)',
          textAlign: 'right',
        }}
      >
        Medicina Estética · Santiago
      </div>
    </header>
  );
}
