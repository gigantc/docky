export default function Related({ relatedDocs, onNavigate }) {
  return (
    <div className="rightbar__section">
      <div className="rightbar__title">Related</div>
      {relatedDocs.length ? (
        relatedDocs.map(({ doc, overlap }) => (
          <div key={doc.path} className="rightbar__backlink">
            <button
              className="rightbar__link"
              onClick={() => onNavigate(doc.path)}
            >
              {doc.title}
            </button>
            <div className="rightbar__snippet">
              Tags: {overlap.join(', ')}
            </div>
          </div>
        ))
      ) : (
        <div className="rightbar__item">No related docs.</div>
      )}
    </div>
  )
}
