import './MorningBriefView.scss'
import { getMorningBriefIcon } from '../../utils/morningBriefIcons'

function SourceLine({ sources = [] }) {
  if (!sources.length) return null

  return (
    <p className="brief-template__source">
      Source:{' '}
      {sources.map((source, index) => (
        <span key={`${source.label}-${source.url || index}`}>
          {index > 0 ? ', ' : ''}
          {source.url ? (
            <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
          ) : source.label}
        </span>
      ))}
    </p>
  )
}

function InstrumentCard({ item }) {
  const tone = item.direction === 'down' ? 'is-down' : item.direction === 'up' ? 'is-up' : ''

  return (
    <div className={`brief-template__market-card ${tone}`}>
      <div className="brief-template__market-top">
        <span className="brief-template__market-key">{item.key}</span>
        <span className="brief-template__market-pct">{item.pct || '—'}</span>
      </div>
      <div className="brief-template__market-value">{item.valueDisplay || item.value || '—'}</div>
      <SourceLine sources={item.sources} />
    </div>
  )
}

function TrendCard({ item }) {
  const Icon = getMorningBriefIcon(item.icon)

  return (
    <article className="brief-template__trend-card">
      <div className="brief-template__trend-icon">
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
      </div>
      <h3 className="brief-template__trend-head">{item.headline || 'Signal'}</h3>
      <p className="brief-template__trend-body">{item.body}</p>
      <SourceLine sources={item.sources} />
    </article>
  )
}

function HighlightCard({ item }) {
  return (
    <article className="brief-template__highlight">
      <p className="brief-template__highlight-kicker">{item.topic || (item.kind === 'apollo-pick' ? 'Apollo Pick' : 'Signal')}</p>
      <h3 className="brief-template__highlight-title">{item.headline || 'Untitled'}</h3>
      <p className="brief-template__highlight-body">{item.body}</p>
      <SourceLine sources={item.sources} />
    </article>
  )
}

export default function MorningBriefView({ activeDoc, briefGreeting }) {
  const brief = activeDoc.briefData
  if (!brief) return null

  const heroGreeting = brief.greeting || briefGreeting || brief.title || 'Morning Brief'
  const topMarkets = brief.markets.instruments.slice(0, 3)
  const bottomMarkets = brief.markets.instruments.slice(3, 5)
  const apolloPicks = brief.highlights.filter((item) => item.kind === 'apollo-pick')
  const insightStream = brief.highlights.filter((item) => item.kind !== 'apollo-pick')
  const leftColumn = insightStream.filter((_, index) => index % 2 === 0)
  const rightColumn = insightStream.filter((_, index) => index % 2 === 1)

  return (
    <article className="brief-template">
      <header className="brief-template__hero">
        <p className="brief-template__eyebrow">{brief.title || 'Morning Brief'}</p>
        <h1>{heroGreeting}</h1>
        {brief.intro && <p className="brief-template__intro">"{brief.intro}"</p>}
      </header>

      <section id="weather" className="brief-template__section brief-template__section--weather">
        <div className="brief-template__weather-grid">
          <div className="brief-template__weather-block">
            <div className="brief-template__weather-temp">{brief.weather.highF || '—'}°</div>
            <div className="brief-template__weather-copy">
              <p className="brief-template__weather-label">Local Conditions: {brief.weather.location}</p>
              <p className="brief-template__weather-summary">
                {brief.weather.highF || '—'}° / {brief.weather.lowF || '—'}° with {brief.weather.summary || 'quiet skies'}
              </p>
              <p className="brief-template__weather-meta">
                Sunrise is {brief.weather.sunrise || '—'} and sunset is {brief.weather.sunset || '—'}.
                {brief.weather.pressureValue ? ` Pressure: ${brief.weather.pressureValue}` : ''}
                {brief.weather.pressureTrend ? ` (${brief.weather.pressureTrend})` : ''}
              </p>
              <SourceLine sources={brief.weather.sources} />
            </div>
          </div>

          <div className="brief-template__weather-block">
            <div className="brief-template__moon-glyph">{brief.moon.phaseEmoji || '☾'}</div>
            <div className="brief-template__weather-copy">
              <p className="brief-template__weather-label">Lunar Cycle</p>
              <p className="brief-template__weather-summary">
                {brief.moon.phase || '—'}
                {brief.moon.illumination ? `, about ${brief.moon.illumination} illuminated` : ''}
              </p>
              <p className="brief-template__weather-meta">Next major phase: {brief.moon.nextMajorPhase || '—'}</p>
              <SourceLine sources={brief.moon.sources} />
            </div>
          </div>
        </div>

        <div className="brief-template__moon-watch">
          <p className="brief-template__moon-watch-label">Moon Watch</p>
          <p className="brief-template__moon-watch-body">{brief.moon.watchNote || 'No lunar note for today.'}</p>
        </div>
      </section>

      <section id="markets" className="brief-template__section">
        <div className="brief-template__section-tag">
          <span className="brief-template__pulse" />
          Market Volatility Report
        </div>

        <div className="brief-template__markets-grid brief-template__markets-grid--three">
          {topMarkets.map((item) => <InstrumentCard key={item.key} item={item} />)}
        </div>

        <div className="brief-template__markets-grid brief-template__markets-grid--two">
          {bottomMarkets.map((item) => <InstrumentCard key={item.key} item={item} />)}
        </div>

        {brief.markets.summary && (
          <div className="brief-template__market-summary">
            <p className="brief-template__market-summary-label">Market Watch</p>
            <p className="brief-template__market-summary-body">{brief.markets.summary}</p>
          </div>
        )}
      </section>

      <section id="trending-topics-roundup" className="brief-template__section">
        <div className="brief-template__section-tag">Signals of the Hour</div>
        <div className="brief-template__trends-grid">
          {brief.trends.map((item, index) => <TrendCard key={`${item.headline}-${index}`} item={item} />)}
        </div>
      </section>

      <section id="topic-highlights" className="brief-template__section">
        <div className="brief-template__section-tag">Insight Stream</div>

        <div className="brief-template__insight-grid">
          <div className="brief-template__insight-column">
            {leftColumn.map((item, index) => <HighlightCard key={`${item.headline}-${index}`} item={item} />)}
          </div>
          <div className="brief-template__insight-column">
            {rightColumn.map((item, index) => <HighlightCard key={`${item.headline}-${index}`} item={item} />)}
          </div>
        </div>

        {apolloPicks.length > 0 && (
          <div className="brief-template__apollo-band">
            <p className="brief-template__apollo-label">Apollo&apos;s Neural Picks</p>
            <div className="brief-template__apollo-grid">
              {apolloPicks.map((item, index) => <HighlightCard key={`${item.headline}-${index}`} item={item} />)}
            </div>
          </div>
        )}
      </section>

    </article>
  )
}
