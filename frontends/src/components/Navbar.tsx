import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LogOut,
  Utensils,
  LayoutDashboard,
  Compass,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="topbar">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="RasaKampus, halaman utama">
          <span className="brand-icon">
            <Utensils size={19} />
          </span>
          <span>
            Rasa<span className="brand-accent">Kampus</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Navigasi utama">
          <NavLink to="/" end>
            <Compass size={16} />
            Jelajahi
          </NavLink>

          {(user?.role === 'admin' || user?.role === 'owner') && (
            <NavLink to="/dashboard">
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="nav-account">
          {loading ? (
            <span className="muted">Memuat sesi...</span>
          ) : user ? (
            <>
              <div className="user-chip">
                <span className="avatar">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span>
                  <b>{user.name}</b>
                  <small>{user.role}</small>
                </span>
              </div>

              <button
                type="button"
                className="button button-ghost button-small"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login">
                Masuk
              </Link>
              <Link to="/register" className="button button-primary button-small">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
