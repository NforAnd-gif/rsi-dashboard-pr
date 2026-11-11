export default function Alert({ children, type = 'error' }: { children: string; type?: 'error' | 'success' | 'info' }) {
  return <div className={`alert alert-${type}`} role="alert">{children}</div>
}
