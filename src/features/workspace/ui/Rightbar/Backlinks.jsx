export default function Backlinks({ backlinks, snippetMap, onNavigate }) {
  return (
    <div className="rightbar__section">
      <div className="rightbar__title">Backlinks</div>
      {backlinks.length ? (
        backlinks.map((doc) => (
          <div key={doc.path} className="rightbar__backlink">
            <button
              className="rightbar__link"
              onClick={() => onNavigate(doc.path)}
            >
              {doc.title}
            </button>
            <div className="rightbar__snippet">
              {snippetMap.get(doc.path)}
            </div>
          </div>
        ))
      ) : (
        <div className="rightbar__item">No backlinks found.</div>
      )}
    </div>
  )
}
