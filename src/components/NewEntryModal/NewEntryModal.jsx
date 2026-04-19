import { FileText, BookOpen, ListTodo, X } from 'lucide-react'
import './NewEntryModal.scss'

const OPTIONS = [
  { id: 'note', label: 'Note', description: 'A free-form rich-text note', Icon: FileText },
  { id: 'journal', label: 'Journal', description: 'A dated daily journal entry', Icon: BookOpen },
  { id: 'list', label: 'List', description: 'A checklist with drag-and-drop', Icon: ListTodo },
]

export default function NewEntryModal({ onClose, onSelect }) {
  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="new-entry" onClick={(event) => event.stopPropagation()}>
        <div className="new-entry__head">
          <div>
            <div className="new-entry__eyebrow">Create</div>
            <h2 className="new-entry__title">New Entry</h2>
          </div>
          <button type="button" className="new-entry__close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="new-entry__grid">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="new-entry__option"
              onClick={() => onSelect?.(opt.id)}
            >
              <opt.Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <div>
                <div className="new-entry__option-label">{opt.label}</div>
                <div className="new-entry__option-desc">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
