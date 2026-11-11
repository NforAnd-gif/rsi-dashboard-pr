import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (authLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <p className="muted">Memeriksa sesi pengguna...</p>
        </section>
      </main>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await login(email.trim(), password)

      const destination = (
        location.state as { from?: { pathname?: string } } | null
      )?.from?.pathname

      navigate(destination || '/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login gagal. Periksa email dan kata sandi.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-aside">
        <div className="eyebrow">RUANG KULINER KAMPUS</div>
        <h1>Selamat datang kembali.</h1>
        <p>
          Masuk untuk menjelajahi informasi kantin dan mengelola direktori
          sesuai peran akunmu.
        </p>
      </section>

      <section className="auth-card">
        <span className="eyebrow dark">RASAKAMPUS ACCOUNT</span>
        <h2>Masuk ke akun</h2>
        <p className="muted">
          Gunakan email dan kata sandi yang telah terdaftar.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form className="form-stack" onSubmit={submit}>
          <label>
            Email
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
              />
            </div>
          </label>

          <label>
            Kata sandi
            <div className="input-with-icon">
              <LockKeyhole size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan kata sandi"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword
                    ? 'Sembunyikan kata sandi'
                    : 'Tampilkan kata sandi'
                }
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="button button-primary button-wide"
            disabled={busy}
          >
            {busy ? 'Memverifikasi...' : 'Masuk'}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="auth-switch">
          Belum memiliki akun? <Link to="/register">Daftar sekarang</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Kembali ke halaman utama
        </Link>
      </section>
    </main>
  )
}
