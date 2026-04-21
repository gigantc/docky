import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, BookOpen, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun,
  Plus, Square, SquareCheck, Sun, Wind,
} from 'lucide-react'
import { buildSnippet } from '../../utils/string.jsx'
import { conditionLabel, fetchCurrentWeather, iconKeyFor } from '../../utils/weather'
import './Home.scss'

const WEATHER_ICONS = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  wind: Wind,
}

function formatRelative(iso) {
  if (!iso) return ''
  const then = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(then.getTime())) return iso
  const now = new Date()
  const msPerDay = 86_400_000
  const diff = Math.floor((now - then) / msPerDay)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function textFromDoc(doc) {
  if (doc.briefData?.intro) return doc.briefData.intro
  if (doc.briefData?.greeting) return doc.briefData.greeting
  // Prefer raw markdown content; strip heading/markdown noise for a single-line snippet.
  const raw = doc.content || ''
  return raw.replace(/^#+\s.*$/gm, '').replace(/\s+/g, ' ').trim().slice(0, 140)
}

export default function Home({
  docs = [],
  lists = [],
  location,
  onSelectDoc,
  onSelectList,
  onNewEntry,
}) {
  const featuredBrief = useMemo(() => {
    return docs.find((doc) => doc.isBrief) || null
  }, [docs])

  const recentNotes = useMemo(() => {
    return docs.filter((doc) => !doc.isBrief && !doc.isJournal).slice(0, 5)
  }, [docs])

  const recentJournals = useMemo(() => {
    return docs.filter((doc) => doc.isJournal).slice(0, 6)
  }, [docs])

  const activeLists = useMemo(() => {
    return lists.slice(0, 1) // featured most-recently-updated list
  }, [lists])

  const [weather, setWeather] = useState(null)

  useEffect(() => {
    if (!location?.lat || !location?.lon) return
    let cancelled = false
    const load = () => {
      fetchCurrentWeather({ lat: location.lat, lon: location.lon })
        .then((data) => { if (!cancelled) setWeather(data) })
        .catch(() => { if (!cancelled) setWeather(null) })
    }
    load()
    const interval = setInterval(load, 15 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [location?.lat, location?.lon])

  const WeatherIcon = useMemo(() => {
    if (!weather) return CloudSun
    const key = iconKeyFor(weather)
    return WEATHER_ICONS[key] || CloudSun
  }, [weather])

  const condition = weather ? conditionLabel(weather) : '—'
  const shortLoc = (location?.name || 'Chandler, AZ').split(',')[0]

  return (
    <section className="home">
      {/* Hero */}
      <header className="home__hero">
        <div>
          <div className="home__eyebrow">Daily Intelligence</div>
          <h1 className="home__title">The Morning Brief</h1>
        </div>
        <div className="home__weather">
          <div className="home__weather-left">
            <div className="home__weather-loc">{shortLoc}</div>
            <div className="home__weather-temp">
              {weather?.temperature != null ? `${weather.temperature}°` : '—°'}
            </div>
          </div>
          <div className="home__weather-right">
            <WeatherIcon size={28} strokeWidth={1.5} aria-hidden="true" />
            <div className="home__weather-condition">{condition}</div>
            <div className="home__weather-hilo">
              H:{weather?.high != null ? `${weather.high}°` : '—'} L:{weather?.low != null ? `${weather.low}°` : '—'}
            </div>
          </div>
        </div>
      </header>

      <div className="home__hero-grid">
        {/* Featured brief */}
        {featuredBrief ? (
          <button
            type="button"
            className="home__featured"
            onClick={() => onSelectDoc?.(featuredBrief.path)}
          >
            <span className="home__chip">High Signal</span>
            <h2 className="home__featured-title">{featuredBrief.title}</h2>
            <p className="home__featured-excerpt">
              {featuredBrief.briefData?.intro || buildSnippet(featuredBrief.content, featuredBrief.title, 260) || textFromDoc(featuredBrief)}
            </p>
            <span className="home__featured-cta">
              Read Full Analysis
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="home__featured-glow" aria-hidden="true" />
          </button>
        ) : (
          <div className="home__featured home__featured--empty">
            <span className="home__chip home__chip--muted">No briefs yet</span>
            <h2 className="home__featured-title">Your Morning Brief will appear here</h2>
            <p className="home__featured-excerpt">
              Create a Brief entry to anchor your daily dashboard.
            </p>
            <button type="button" className="home__featured-cta" onClick={() => onNewEntry?.('brief')}>
              New Brief
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Quick Metrics — empty shell */}
        <aside className="home__metrics">
          <h4 className="home__metrics-label">Quick Metrics</h4>
          <div className="home__metrics-body" aria-hidden="true" />
        </aside>
      </div>

      {/* Bento grid */}
      <div className="home__bento">
        <div className="home__bento-notes">
          <div className="home__bento-head">
            <h3>Recent Notes</h3>
            <button type="button" className="home__bento-link">View All</button>
          </div>
          <div className="home__note-list">
            {recentNotes.length === 0 && (
              <div className="home__empty">No notes yet. Create one to get started.</div>
            )}
            {recentNotes.map((doc) => (
              <button
                key={doc.path}
                type="button"
                className="home__note"
                onClick={() => onSelectDoc?.(doc.path)}
              >
                <div className="home__note-accent" aria-hidden="true" />
                <div className="home__note-body">
                  <div className="home__note-row">
                    <h4>{doc.title}</h4>
                    <span>{formatRelative(doc.updated || doc.created)}</span>
                  </div>
                  <p>{textFromDoc(doc) || 'Empty note'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="home__bento-lists">
          <h3>Active Lists</h3>
          <div className="home__list-card">
            {activeLists.length === 0 && (
              <div className="home__empty">No lists yet.</div>
            )}
            {activeLists.map((list) => (
              <button
                type="button"
                key={list.id}
                className="home__list"
                onClick={() => onSelectList?.(list.id)}
              >
                <div className="home__list-title">{list.title}</div>
                <ul>
                  {(list.items || []).slice(0, 4).map((item) => (
                    <li key={item.id} className={item.completed ? 'is-done' : ''}>
                      {item.completed
                        ? <SquareCheck size={14} strokeWidth={2} aria-hidden="true" />
                        : <Square size={14} strokeWidth={1.5} aria-hidden="true" />}
                      <span>{item.text}</span>
                    </li>
                  ))}
                  {(list.items?.length || 0) === 0 && <li className="is-empty">No items</li>}
                </ul>
              </button>
            ))}
          </div>
        </div>

        <div className="home__bento-journals">
          <h3>Journals</h3>
          <div className="home__journal-list">
            {recentJournals.length === 0 && (
              <div className="home__empty">No journals yet.</div>
            )}
            {recentJournals.map((doc) => (
              <button
                key={doc.path}
                type="button"
                className="home__journal-item"
                onClick={() => onSelectDoc?.(doc.path)}
              >
                <BookOpen size={14} strokeWidth={1.8} aria-hidden="true" />
                <div className="home__journal-item-body">
                  <div className="home__journal-item-title">{doc.title}</div>
                  <div className="home__journal-item-date">{doc.created || formatRelative(doc.updated)}</div>
                </div>
              </button>
            ))}
            <button
              type="button"
              className="home__journal-new"
              onClick={() => onNewEntry?.('journal')}
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              Write New Entry
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
