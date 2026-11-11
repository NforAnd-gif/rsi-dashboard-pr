import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Store } from 'lucide-react'
import { getStall } from '../api/stallApi'
import { getApiError } from '../api/client'
import type { Stall } from '../types'
import Loading from '../components/Loading'
import Alert from '../components/Alert'

export default function StallDetailPage() {
  const { id } = useParams()
  const [stall, setStall] = useState<Stall | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    setStall(null)
    setError('')
    setLoading(true)

    if (!id || !/^\d+$/.test(id)) {
      setError('ID kantin tidak valid.')
      setLoading(false)

      return () => {
        active = false
      }
    }

    getStall(Number(id))
      .then((result) => {
        if (active) setStall(result)
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <main className="container page-content">
        <Loading label="Memuat detail kantin..." />
      </main>
    )
  }

  if (error || !stall) {
    return (
      <main className="container page-content">
        <Alert>{error || 'Kantin tidak ditemukan.'}</Alert>
        <Link className="back-link" to="/">
          <ArrowLeft size={16} /> Kembali ke daftar kantin
        </Link>
      </main>
    )
  }

  return (
    <main className="container page-content">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} /> Kembali ke daftar
      </Link>

      <section className="detail-hero">
        <div className="detail-icon">
          <Store size={38} />
        </div>

        <div>
          <span className="category-tag">{stall.category || 'Kantin'}</span>
          <h1>{stall.name}</h1>
          <p>
            <MapPin size={16} />
            {stall.location || 'Lokasi belum dicantumkan'}
          </p>
          <div className="rating">
            <Star size={15} fill="currentColor" />
            {Number(stall.avg_rating || 0).toFixed(1)}
            <small>· {stall.review_count || 0} ulasan</small>
          </div>
        </div>
      </section>

      <div className="detail-columns">
        <section className="panel">
          <h2>Tentang kantin</h2>
          <p className="body-copy">
            {stall.description || 'Belum ada deskripsi untuk kantin ini.'}
          </p>

          <div className="owner-info">
            <span className="avatar">
              {(stall.owner?.name || 'P').charAt(0).toUpperCase()}
            </span>
            <span>
              <small>Dikelola oleh</small>
              <b>{stall.owner?.name || `Pemilik #${stall.owner_id}`}</b>
            </span>
          </div>
        </section>

        <section className="panel">
          <h2>Menu kantin</h2>
          {stall.menuItems?.length ? (
            <div className="menu-list">
              {stall.menuItems.map((item) => (
                <div className="menu-row" key={item.id}>
                  <span>
                    {item.name}
                    <small>
                      {item.is_available ? 'Tersedia' : 'Tidak tersedia'}
                    </small>
                  </span>
                  <b>Rp {Number(item.price).toLocaleString('id-ID')}</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Belum ada data menu.</p>
          )}
        </section>
      </div>

      <section className="panel reviews-panel">
        <h2>Ulasan pengunjung</h2>
        {stall.reviews?.length ? (
          stall.reviews.map((review) => (
            <article className="review-row" key={review.id}>
              <div className="review-top">
                <b>{review.user?.name || 'Pengunjung'}</b>
                <span className="rating">
                  <Star size={13} fill="currentColor" />
                  {review.rating}/5
                </span>
              </div>
              <p>{review.comment || 'Tidak ada komentar.'}</p>
            </article>
          ))
        ) : (
          <p className="muted">Belum ada ulasan untuk kantin ini.</p>
        )}
      </section>
    </main>
  )
}
