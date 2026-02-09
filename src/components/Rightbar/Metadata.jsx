export default function Metadata({ docStats, activeDoc }) {
  return (
    <div className="rightbar__section">
      <div className="rightbar__title">Metadata</div>
      <div className="rightbar__item">Words: {docStats.words}</div>
      <div className="rightbar__item">Reading time: {docStats.minutes} min</div>
      <div className="rightbar__item">
        Last updated: {activeDoc?.updated || activeDoc?.created || '—'}
      </div>
    </div>
  )
}
