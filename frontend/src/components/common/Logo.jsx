/* QB Monogram + Wordmark */
export default function Logo({ size = 'md', showWordmark = true }) {
  const sizes = {
    sm: { box: 28, font: 10, wFont: '1rem' },
    md: { box: 36, font: 13, wFont: '1.25rem' },
    lg: { box: 48, font: 18, wFont: '1.625rem' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      <svg width={s.box} height={s.box} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="#F28C45"/>
        <text
          x="18" y="25"
          fontFamily="Inter, sans-serif"
          fontWeight="800"
          fontSize={s.font}
          fill="white"
          textAnchor="middle"
          letterSpacing="-0.5"
        >QB</text>
      </svg>
      {showWordmark && (
        <span style={{
          fontSize: s.wFont,
          fontWeight: 800,
          color: '#F5F5F5',
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}>
          Quick<span style={{ color: '#F28C45' }}>Bite</span>
        </span>
      )}
    </div>
  );
}
