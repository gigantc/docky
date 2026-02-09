import './EditorModal.scss'

export default function EditorModal({
  editorId,
  editorTitle,
  editorContent,
  editorTags,
  editorSaving,
  onTitleChange,
  onContentChange,
  onTagsChange,
  onSave,
  onDelete,
  onClose,
}) {
  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal modal--editor" onClick={(event) => event.stopPropagation()}>
        <div className="modal__title">{editorId ? 'Edit Note' : 'New Note'}</div>
        <label className="modal__label">Title</label>
        <input
          className="modal__input"
          type="text"
          placeholder="Untitled"
          value={editorTitle}
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <label className="modal__label">Tags (comma separated)</label>
        <input
          className="modal__input"
          type="text"
          placeholder="ideas, docky"
          value={editorTags}
          onChange={(event) => onTagsChange(event.target.value)}
        />
        <label className="modal__label">Content</label>
        <textarea
          className="modal__textarea"
          rows={12}
          value={editorContent}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Write your note in markdown..."
        />
        <div className="modal__actions">
          {editorId && (
            <button
              className="modal__button modal__button--danger"
              onClick={onDelete}
            >
              Delete
            </button>
          )}
          <button className="modal__button modal__button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="modal__button" onClick={onSave} disabled={editorSaving}>
            {editorSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
