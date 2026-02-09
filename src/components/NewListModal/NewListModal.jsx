import './NewListModal.scss'

export default function NewListModal({
  listTitle,
  onTitleChange,
  onClose,
  onCreate,
  saving,
}) {
  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__title">New List</div>
        <label className="modal__label">Title</label>
        <input
          className="modal__input"
          type="text"
          placeholder="Untitled List"
          value={listTitle}
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <div className="modal__actions">
          <button className="modal__button modal__button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="modal__button" onClick={onCreate} disabled={saving}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
