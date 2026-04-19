import { X } from 'lucide-react'
import { LOCATIONS } from '../../utils/locations'
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
  locationId,
  onLocationChange,
  onClose,
}) {
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
            {LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                className={`settings__location ${locationId === loc.id ? 'is-active' : ''}`}
                onClick={() => onLocationChange?.(loc.id)}
              >
                <div>
                  <div className="settings__location-name">{loc.name}</div>
                  <div className="settings__location-coords">{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
