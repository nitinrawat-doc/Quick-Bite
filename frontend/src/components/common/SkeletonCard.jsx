/* Skeleton loader for food cards */
export default function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 180, borderRadius: '16px 16px 0 0' }} />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <div className="skeleton" style={{ height: 14, width: '60%' }} />
        <div className="skeleton" style={{ height: 12, width: '90%' }} />
        <div className="skeleton" style={{ height: 12, width: '70%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <div className="skeleton" style={{ height: 18, width: '30%' }} />
          <div className="skeleton" style={{ height: 36, width: 80, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}
