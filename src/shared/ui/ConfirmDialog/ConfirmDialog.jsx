import './ConfirmDialog.scss'

export default function ConfirmDialog({ dialog, onClose, onConfirm }) {
  if (!dialog) return null

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal modal--confirm" onClick={(event) => event.stopPropagation()}>
        <div className="modal__title">{dialog.title}</div>
        {dialog.body && (
          <p className="modal__body">
            {dialog.body}
          </p>
        )}
        <div className="modal__actions">
          <button
            className="modal__button modal__button--ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="modal__button modal__button--danger" onClick={onConfirm}>
            {dialog.confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
