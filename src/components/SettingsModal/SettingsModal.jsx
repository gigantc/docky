import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import './SettingsModal.scss'

const THEMES = [
  { id: 'green', label: 'Green', color: '#4de082' },
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'pink', label: 'Pink', color: '#ec4899' },
  { id: 'red', label: 'Red', color: '#ef4444' },
  { id: 'gold', label: 'Gold', color: '#d4a017' },
  { id: 'teal', label: 'Teal', color: '#14b8a6' },
]

export default function SettingsModal({
  theme,
  onThemeChange,
  locations = [],
  locationId,
  onLocationChange,
  onAddLocation,
  onDeleteLocation,
  onClose,
}) {
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleAdd = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    const result = await onAddLocation?.(query)
    setSaving(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setQuery('')
    }
  }

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="settings" onClick={(event) => event.stopPropagation()}>
        <div className="settings__head">
          <div>
            <div className="settings__eyebrow">Preferences</div>
            <h2 className="settings__title">Settings</h2>
          </div>
          <button type="button" className="settings__close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <section className="settings__section">
          <h3 className="settings__section-title">Theme</h3>
          <div className="settings__themes">
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`settings__theme ${theme === item.id ? 'is-active' : ''}`}
                onClick={() => onThemeChange?.(item.id)}
              >
                <span className="settings__swatch" style={{ background: item.color }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings__section">
          <h3 className="settings__section-title">Weather Location</h3>
          <div className="settings__locations">
            {locations.length === 0 && (
              <div className="settings__empty">No locations yet. Add one below.</div>
            )}
            {locations.map((loc) => (
              <div key={loc.id} className="settings__location-row">
                <button
                  type="button"
                  className={`settings__location ${locationId === loc.id ? 'is-active' : ''}`}
                  onClick={() => onLocationChange?.(loc.id)}
                >
                  <div>
                    <div className="settings__location-name">{loc.name}</div>
                    <div className="settings__location-coords">{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="settings__location-delete"
                  onClick={() => onDeleteLocation?.(loc.id)}
                  aria-label={`Delete ${loc.name}`}
                  disabled={locations.length <= 1}
                >
                  <Trash2 size={14} strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>

          <form className="settings__location-add" onSubmit={handleAdd}>
            <input
              type="text"
              placeholder="Add city (e.g. Portland, OR)"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setError(null) }}
            />
            <button type="submit" disabled={saving || !query.trim()} aria-label="Add location">
              <Plus size={14} strokeWidth={2.5} />
              {saving ? 'Adding…' : 'Add'}
            </button>
          </form>
          {error && <div className="settings__location-error">{error}</div>}
        </section>
      </div>
    </div>
  )
}
