export default function Barra({ valor, max }) {
  return (
    <div className="barra" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={max}>
      <div className="barra-llena" style={{ width: `${Math.min(100, (valor / max) * 100)}%` }} />
    </div>
  );
}
