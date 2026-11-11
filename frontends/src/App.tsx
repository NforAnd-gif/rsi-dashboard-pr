import { Route, Routes, Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import StallDetailPage from './pages/StallDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import UnauthorizedPage from './pages/UnauthorizedPage'

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stalls/:id" element={<StallDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute roles={['admin', 'owner']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="*"
          element={
            <main className="container page-content">
              <div className="empty-state">
                <h2>Halaman tidak ditemukan</h2>
                <p>Alamat yang kamu buka tidak tersedia.</p>
                <Link className="button button-primary" to="/">
                  Kembali ke beranda <ArrowUpRight size={15} />
                </Link>
              </div>
            </main>
          }
        />
      </Routes>

      <footer className="footer">
        <div className="container footer-inner">
          <span>
            <b>RasaKampus</b> · © {new Date().getFullYear()}
          </span>
          <span>
            Informasi kantin kampus, lebih dekat dan mudah dijelajahi.
          </span>
        </div>
      </footer>
    </>
  )
}
