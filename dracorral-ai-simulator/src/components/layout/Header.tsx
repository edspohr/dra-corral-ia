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
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        backgroundColor: 'var(--sage-dark)',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? 'var(--shadow-card)' : 'none',
        transition: 'box-shadow 300ms ease, backdrop-filter 300ms ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Logo mark */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '24px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.15em',
            lineHeight: 1,
          }}
        >
          D|C
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: '0.3em',
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
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'right',
        }}
      >
        Medicina Estética · Santiago
      </div>
    </header>
  );
}
