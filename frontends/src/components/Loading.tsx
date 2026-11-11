export default function Loading({ label = 'Memuat data...' }: { label?: string }) {
  return <div className="state-message"><span className="spinner" />{label}</div>
}
