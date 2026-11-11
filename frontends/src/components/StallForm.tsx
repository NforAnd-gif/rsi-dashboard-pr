import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Stall, StallPayload } from '../types'

interface StallFormProps {
  initial?: Stall | null
  onSubmit: (payload: StallPayload) => Promise<void>
  onCancel: () => void
}

export default function StallForm({
  initial,
  onSubmit,
  onCancel,
}: StallFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (name.trim().length < 3) {
      setError('Nama kantin minimal terdiri dari 3 karakter.')
      return
    }

    setSaving(true)

    try {
      await onSubmit({
        name: name.trim(),
        category: category.trim(),
        location: location.trim(),
        description: description.trim(),
      })
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Gagal menyimpan data kantin.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <label>
        Nama kantin
        <input
          type="text"
          required
          minLength={3}
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Contoh: Kantin Bu Tini"
        />
      </label>

      <label>
        Kategori
        <input
          type="text"
          maxLength={50}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Contoh: Makanan, Minuman"
        />
      </label>

      <label>
        Lokasi
        <input
          type="text"
          maxLength={100}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Contoh: Gedung A"
        />
      </label>

      <label>
        Deskripsi
        <textarea
          maxLength={1000}
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Informasi singkat mengenai kantin..."
        />
      </label>

      <div className="form-actions">
        <button
          type="button"
          className="button button-ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Batal
        </button>

        <button
          type="submit"
          className="button button-primary"
          disabled={saving}
        >
          {saving
            ? 'Menyimpan...'
            : initial
              ? 'Simpan perubahan'
              : 'Tambah kantin'}
        </button>
      </div>
    </form>
  )
}
