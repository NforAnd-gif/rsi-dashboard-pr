import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  MapPin,
  Search,
  Star,
  Store,
  Utensils,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { getStalls } from '../api/stallApi'
import { getApiError } from '../api/client'
import type { Stall } from '../types'
import Loading from '../components/Loading'
import Alert from '../components/Alert'

export default function HomePage() {
  const [stalls, setStalls] = useState<Stall[]>([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Semua')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    setLoading(true)
    setError('')

    getStalls({
      search: query || undefined,
      page: 1,
      limit: 100,
    })
      .then((result) => {
        if (active) setStalls(result.data)
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiError(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [query])

  const categories = useMemo(() => {
    const values = stalls
      .map((stall) => stall.category)
      .filter((value): value is string => Boolean(value))

    return ['Semua', ...Array.from(new Set(values)).sort()]
  }, [stalls])

  const visibleStalls = useMemo(() => {
    if (category === 'Semua') return stalls

    return stalls.filter((stall) => stall.category === category)
  }, [stalls, category])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setQuery(search.trim())
    setCategory('Semua')
  }

  const resetSearch = () => {
    setSearch('')
    setQuery('')
    setCategory('Semua')
  }

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              DIREKTORI KULINER KAMPUS
            </div>

            <h1>
              Temukan rasa,
              <br />
              <em>di setiap sudut kampus.</em>
            </h1>

            <p>
              Jelajahi kantin, kenali pilihan menu, dan baca pengalaman
              pengunjung sebelum menentukan tempat makan berikutnya.
            </p>

            <form className="search-bar" onSubmit={submitSearch}>
              <Search size={19} />
              <input
                aria-label="Cari nama atau kategori kantin"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau kategori kantin..."
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={resetSearch}
                  aria-label="Hapus pencarian"
                >
                  <X size={16} />
                </button>
              )}

              <button type="submit" className="button button-primary">
                Jelajahi <ArrowUpRight size={16} />
              </button>
            </form>

            <div className="hero-proof">
              <span>
                <Store size={15} /> Direktori kantin kampus
              </span>
              <span>
                <Star size={15} /> Rating dari pengunjung
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="food-card">
              <div className="food-emoji">🍜</div>
              <div className="food-caption">
                <span>REKOMENDASI HARI INI</span>
                <b>Good food, good day.</b>
              </div>
            </div>
            <div className="floating-note note-rating">
              <Star size={15} fill="currentColor" /> Pilihan favorit
            </div>
            <div className="floating-note note-pin">
              <MapPin size={15} /> Informasi lokasi kantin
            </div>
          </div>
        </div>

        <div className="hero-bottom">
          <span>DISCOVER</span>
          <span className="hero-line" />
          <span>YOUR NEXT FAVORITE</span>
        </div>
      </section>

      <main className="container section">
        <div className="section-heading">
          <div>
            <div className="eyebrow dark">
              <Sparkles size={14} /> PILIHAN UNTUKMU
            </div>
            <h2>Jelajahi kantin</h2>
            <p className="muted">
              Temukan tempat makan dan informasi yang kamu butuhkan.
            </p>
          </div>

          <div className="result-count">
            <b>{stalls.length}</b> kantin terdaftar
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-label">
            <SlidersHorizontal size={16} /> Kategori
          </div>

          <div className="category-filters">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                className={
                  category === item ? 'filter-chip active' : 'filter-chip'
                }
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Loading label="Memuat direktori kantin..." />
        ) : error ? (
          <Alert>{error}</Alert>
        ) : visibleStalls.length === 0 ? (
          <div className="empty-state">
            <Store size={32} />
            <h3>
              {query || category !== 'Semua'
                ? 'Kantin tidak ditemukan'
                : 'Belum ada data kantin'}
            </h3>
            <p>
              {query || category !== 'Semua'
                ? 'Coba kata kunci lain atau atur ulang filter.'
                : 'Informasi kantin akan ditampilkan di sini setelah tersedia.'}
            </p>
            <button
              type="button"
              className="button button-ghost"
              onClick={resetSearch}
            >
              Atur ulang pencarian
            </button>
          </div>
        ) : (
          <div className="stall-grid">
            {visibleStalls.map((stall, index) => (
              <Link
                to={`/stalls/${stall.id}`}
                className="stall-card"
                key={stall.id}
              >
                <div className={`stall-visual tone-${index % 4}`}>
                  <div className="stall-visual-mark">
                    <Utensils size={27} />
                  </div>
                  <span className="category-tag">
                    {stall.category || 'Kantin'}
                  </span>
                  <span className="stall-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="stall-info">
                  <div className="stall-title-row">
                    <h3>{stall.name}</h3>
                    <span className="card-arrow">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>

                  <p className="stall-location">
                    <MapPin size={14} />
                    {stall.location || 'Lokasi belum dicantumkan'}
                  </p>

                  <div className="stall-card-bottom">
                    <span className="rating">
                      <Star size={14} fill="currentColor" />
                      {Number(stall.avg_rating || 0).toFixed(1)}
                      <small>({stall.review_count || 0} ulasan)</small>
                    </span>
                    <span className="card-detail">Lihat detail</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
