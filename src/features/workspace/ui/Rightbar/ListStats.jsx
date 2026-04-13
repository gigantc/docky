export default function ListStats({ listStats, activeList }) {
  return (
    <div className="rightbar__section">
      <div className="rightbar__title">List Stats</div>
      <div className="rightbar__item">
        Items: {listStats?.total ?? 0}
      </div>
      <div className="rightbar__item">
        Completed: {listStats?.completed ?? 0}
      </div>
      <div className="rightbar__item">
        Last updated: {activeList.updated || activeList.created || '—'}
      </div>
    </div>
  )
}
