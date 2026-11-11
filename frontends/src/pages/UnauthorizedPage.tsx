import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
export default function UnauthorizedPage() {
  return <main className="container page-content"><div className="empty-state"><ShieldAlert size={38} /><h2>Akses tidak diizinkan</h2><p>Role akunmu tidak memiliki izin untuk membuka halaman tersebut.</p><Link className="button button-primary" to="/">Kembali ke beranda</Link></div></main>
}
