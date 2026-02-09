export default function BriefCompare({ briefCompare }) {
  if (!briefCompare) return null

  return (
    <div className="rightbar__section">
      <div className="rightbar__title">Yesterday vs Today</div>
      <div className="rightbar__item">
        Today: {briefCompare.today.created}
      </div>
      <div className="rightbar__item">
        Yesterday: {briefCompare.yesterday.created}
      </div>
      {['S&P 500', 'Nasdaq', 'Dow', 'BTC', 'ETH'].map((key) => (
        <div key={key} className="rightbar__snippet">
          <strong>{key}:</strong>{' '}
          {briefCompare.yesterdayMarkets[key] || '—'} →{' '}
          {briefCompare.todayMarkets[key] || '—'}
        </div>
      ))}
    </div>
  )
}
