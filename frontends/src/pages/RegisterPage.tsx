import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { user, register, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
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
      await register(name.trim(), email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Registrasi gagal. Silakan coba kembali.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-aside">
        <div className="eyebrow">MULAI JELAJAHI</div>
        <h1>Temukan tempat makan favoritmu.</h1>
        <p>
          Buat akun RasaKampus untuk menikmati pengalaman direktori kantin
          kampus yang lebih praktis.
        </p>
      </section>

      <section className="auth-card">
        <span className="eyebrow dark">RASAKAMPUS ACCOUNT</span>
        <h2>Buat akun baru</h2>
        <p className="muted">
          Lengkapi informasi berikut untuk mendaftar sebagai pengunjung.
          Akun publik akan dibuat dengan role customer.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form className="form-stack" onSubmit={submit}>
          <label>
            Nama lengkap
            <div className="input-with-icon">
              <UserRound size={16} />
              <input
                type="text"
                required
                minLength={3}
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama lengkap"
              />
            </div>
          </label>

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
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
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
            {busy ? 'Mendaftarkan...' : 'Buat akun'}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="auth-switch">
          Sudah memiliki akun? <Link to="/login">Masuk</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Kembali ke halaman utama
        </Link>
      </section>
    </main>
  )
}
