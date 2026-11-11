import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Stall, StallPayload } from '../types'
import {
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Store,
  Star,
  MapPin,
  Search,
  X,
  LayoutDashboard,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  createStall,
  deleteStall,
  getStalls,
  updateStall,
} from '../api/stallApi'
import { getApiError } from '../api/client'
import Loading from '../components/Loading'
import Alert from '../components/Alert'
import StallForm from '../components/StallForm'

export default function DashboardPage() {
  const { user } = useAuth()

  const [stalls, setStalls] = useState<Stall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<Stall | null>(null)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await getStalls({ page: 1, limit: 100 })
      setStalls(result.data)
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const canEdit = useCallback((stall: Stall) => {
    if (user?.role === 'admin') return true

    return (
      user?.role === 'owner' &&
      Number(stall.owner_id) === Number(user.id)
    )
  }, [user])

  const filteredStalls = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return stalls

    return stalls.filter((stall) => {
      const values = [
        stall.name,
        stall.category,
        stall.location,
        stall.owner?.name,
      ]

      return values.some((value) =>
        value?.toLowerCase().includes(keyword),
      )
    })
  }, [stalls, search])

  const saveNew = async (payload: StallPayload) => {
    try {
      await createStall(payload)
      setCreating(false)
      setNotice('Kantin berhasil ditambahkan.')
      await load()
    } catch (requestError) {
      throw new Error(getApiError(requestError))
    }
  }

  const saveEdit = async (payload: StallPayload) => {
    if (!editing) return

    try {
      await updateStall(editing.id, payload)
      setEditing(null)
      setNotice('Data kantin berhasil diperbarui.')
      await load()
    } catch (requestError) {
      throw new Error(getApiError(requestError))
    }
  }

  const remove = async (stall: Stall) => {
    const confirmed = window.confirm(
      `Hapus kantin "${stall.name}"? Tindakan ini tidak dapat dibatalkan.`,
    )

    if (!confirmed) return

    setBusyId(stall.id)
    setError('')
    setNotice('')

    try {
      await deleteStall(stall.id)
      setNotice('Kantin berhasil dihapus.')
      await load()
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setBusyId(null)
    }
  }

  const averageRating = stalls.length
    ? stalls.reduce(
        (total, stall) => total + Number(stall.avg_rating || 0),
        0,
      ) / stalls.length
    : 0

  const categoryCount = new Set(
    stalls.map((stall) => stall.category).filter(Boolean),
  ).size

  return (
    <main className="container page-content dashboard-page">
      <div className="dashboard-topline">
        <div>
          <div className="eyebrow dark">
            <LayoutDashboard size={14} /> RUANG KERJA
          </div>
          <h1>Dashboard pengelolaan</h1>
          <p className="muted">
            Selamat datang, {user?.name}. Kelola direktori kantin sesuai hak
            akses akunmu.
          </p>
        </div>

        <span className="role-pill">
          <ShieldCheck size={15} /> {user?.role}
        </span>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-icon"><Store size={19} /></span>
          <span className="stat-label">Total kantin</span>
          <b>{stalls.length}</b>
          <small>Data pada halaman yang dimuat</small>
        </article>

        <article className="stat-card">
          <span className="stat-icon gold"><Star size={19} /></span>
          <span className="stat-label">Rata-rata rating</span>
          <b>
            {averageRating.toFixed(1)}
            <small className="stat-suffix">/ 5</small>
          </b>
          <small>Berdasarkan data kantin yang dimuat</small>
        </article>

        <article className="stat-card">
          <span className="stat-icon blue"><MapPin size={19} /></span>
          <span className="stat-label">Kategori tersedia</span>
          <b>{categoryCount}</b>
          <small>Jenis pilihan kuliner</small>
        </article>
      </div>

      <div className="management-panel">
        <div className="management-heading">
          <div>
            <h2>Data kantin</h2>
            <p className="muted">
              Kelola informasi kantin sesuai hak akses akun.
            </p>
          </div>

          <div className="management-actions">
            {(user?.role === 'owner' || user?.role === 'admin') && (
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  setCreating(true)
                  setEditing(null)
                  setNotice('')
                  setError('')
                }}
              >
                <Plus size={17} /> Tambah kantin
              </button>
            )}

            <button
              type="button"
              className="button button-ghost"
              onClick={() => void load()}
              aria-label="Muat ulang data"
              disabled={loading}
            >
              <RefreshCw size={16} /> Muat ulang
            </button>
          </div>
        </div>

        {notice && <Alert type="success">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}

        {(creating || editing) && (
          <section className="panel editor-panel">
            <div className="editor-heading">
              <div>
                <span className="eyebrow dark">FORMULIR DATA</span>
                <h2>
                  {editing
                    ? 'Perbarui informasi kantin'
                    : 'Tambahkan kantin baru'}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setCreating(false)
                  setEditing(null)
                }}
                aria-label="Tutup formulir"
              >
                <X size={17} />
              </button>
            </div>

            <StallForm
              key={editing ? `edit-${editing.id}` : 'create-stall'}
              initial={editing}
              onSubmit={editing ? saveEdit : saveNew}
              onCancel={() => {
                setCreating(false)
                setEditing(null)
              }}
            />
          </section>
        )}

        <div className="table-tools">
          <div className="table-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, kategori, atau lokasi..."
              aria-label="Cari data kantin"
            />
          </div>

          <span className="result-count">
            {filteredStalls.length} dari {stalls.length} data
          </span>
        </div>

        {loading ? (
          <Loading label="Memuat data kantin..." />
        ) : filteredStalls.length === 0 ? (
          <div className="empty-state">
            <Store size={28} />
            <h3>Tidak ada data yang cocok</h3>
            <p>Ubah kata kunci pencarian atau tambahkan data baru.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama kantin</th>
                  <th>Kategori</th>
                  <th>Pemilik</th>
                  <th>Rating</th>
                  <th>Status akses</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredStalls.map((stall) => (
                  <tr key={stall.id}>
                    <td>
                      <div className="table-stall">
                        <span className="table-stall-icon">
                          <Store size={16} />
                        </span>
                        <span>
                          <b>{stall.name}</b>
                          <small>
                            {stall.location || 'Lokasi belum tersedia'}
                          </small>
                        </span>
                      </div>
                    </td>

                    <td>{stall.category || '—'}</td>
                    <td>{stall.owner?.name || `ID ${stall.owner_id}`}</td>

                    <td>
                      <span className="rating">
                        <Star size={13} fill="currentColor" />
                        {Number(stall.avg_rating || 0).toFixed(1)}
                      </span>
                    </td>

                    <td>
                      <span className="access-pill">
                        {canEdit(stall) ? 'Dapat dikelola' : 'Hanya lihat'}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        {canEdit(stall) && (
                          <button
                            type="button"
                            className="icon-button"
                            title="Ubah kantin"
                            aria-label={`Ubah ${stall.name}`}
                            onClick={() => {
                              setEditing(stall)
                              setCreating(false)
                              setNotice('')
                              setError('')
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                        )}

                        {user?.role === 'admin' && (
                          <button
                            type="button"
                            className="icon-button danger"
                            title="Hapus kantin"
                            aria-label={`Hapus ${stall.name}`}
                            disabled={busyId === stall.id}
                            onClick={() => void remove(stall)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}

                        {!canEdit(stall) && user?.role !== 'admin' && (
                          <span className="muted">Hanya lihat</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="dashboard-footnote">
        <ShieldCheck size={14} />
        Hak akses tetap divalidasi oleh backend melalui JWT dan middleware.
      </p>
    </main>
  )
}
