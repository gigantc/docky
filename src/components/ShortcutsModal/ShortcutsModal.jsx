import './ShortcutsModal.scss'

export default function ShortcutsModal({ onClose }) {
  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__title">Keyboard shortcuts</div>
        <div className="modal__item"><span>/</span> Focus search</div>
        <div className="modal__item"><span>↑ / ↓</span> Navigate notes</div>
        <div className="modal__item"><span>Esc</span> Close search / dialog</div>
        <div className="modal__item"><span>?</span> Toggle this panel</div>
      </div>
    </div>
  )
}
