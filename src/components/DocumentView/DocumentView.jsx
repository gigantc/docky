import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Pencil, Save, Trash2, X } from 'lucide-react'
import { renderMarkdownWithOutline } from '../../utils/markdown'
import './DocumentView.scss'

export default function DocumentView({
  activeDoc,
  briefGreeting,
  user,
  onSave,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [tagsDraft, setTagsDraft] = useState('')
  const [contentDraft, setContentDraft] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    setIsEditing(false)
    setTitleDraft(activeDoc.title || '')
    setTagsDraft((activeDoc.rawTags || activeDoc.tags || []).join(', '))
    setContentDraft(activeDoc.content || '')
    setShowPreview(true)
  }, [activeDoc.id, activeDoc.title, activeDoc.content, activeDoc.rawTags, activeDoc.tags])

  const previewHtml = useMemo(() => {
    if (!isEditing || !showPreview) return ''
    return renderMarkdownWithOutline(contentDraft || '').html
  }, [contentDraft, isEditing, showPreview])

  const handleSave = async () => {
    const tags = tagsDraft
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    await onSave(activeDoc, {
      title: titleDraft,
      content: contentDraft,
      tags,
    })
    setIsEditing(false)
  }

  return (
    <article className="doc">
      <header className="doc__header">
        <div className="doc__title">
          <h1>{briefGreeting || activeDoc.title}</h1>
          {activeDoc.isBrief && (
            <div className="doc__date">{activeDoc.title}</div>
          )}
          {!activeDoc.isBrief && activeDoc.created && (
            <div className="doc__date">{activeDoc.created}</div>
          )}
          {activeDoc.tags.length > 0 && !isEditing && (
            <div className="doc__tags">
              {activeDoc.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {user && (
          <div className="doc__panel">
            {!activeDoc.isBrief && !isEditing && (
              <button className="doc__icon" type="button" onClick={() => setIsEditing(true)} aria-label="Edit note" title="Edit note">
                <Pencil aria-hidden="true" size={16} strokeWidth={2} />
              </button>
            )}
            {!activeDoc.isBrief && isEditing && (
              <>
                <button className="doc__icon" type="button" onClick={handleSave} aria-label="Save note" title="Save note">
                  <Save aria-hidden="true" size={16} strokeWidth={2} />
                </button>
                <button
                  className="doc__icon"
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setTitleDraft(activeDoc.title || '')
                    setTagsDraft((activeDoc.rawTags || activeDoc.tags || []).join(', '))
                    setContentDraft(activeDoc.content || '')
                  }}
                  aria-label="Cancel edit"
                  title="Cancel edit"
                >
                  <X aria-hidden="true" size={16} strokeWidth={2} />
                </button>
                <button className="doc__icon" type="button" onClick={() => setShowPreview((prev) => !prev)} aria-label="Toggle preview" title="Toggle preview">
                  {showPreview ? <EyeOff aria-hidden="true" size={16} strokeWidth={2} /> : <Eye aria-hidden="true" size={16} strokeWidth={2} />}
                </button>
              </>
            )}
            <button className="doc__icon doc__icon--danger" type="button" onClick={() => onDelete(activeDoc)} aria-label={activeDoc.isBrief ? 'Delete brief' : 'Delete note'} title={activeDoc.isBrief ? 'Delete brief' : 'Delete note'}>
              <Trash2 aria-hidden="true" size={16} strokeWidth={2} />
            </button>
          </div>
        )}
      </header>

      {!isEditing ? (
        <div className="doc__content" dangerouslySetInnerHTML={{ __html: activeDoc.html }} />
      ) : (
        <div className="doc__editor">
          <label className="doc__label">Title</label>
          <input className="doc__input" type="text" value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} />

          <label className="doc__label">Tags</label>
          <input className="doc__input" type="text" value={tagsDraft} onChange={(event) => setTagsDraft(event.target.value)} placeholder="work, ideas" />

          <label className="doc__label">Content</label>
          <textarea
            className="doc__textarea"
            rows={14}
            value={contentDraft}
            onChange={(event) => setContentDraft(event.target.value)}
            placeholder="Write your note..."
          />

          {showPreview && (
            <div className="doc__preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          )}
        </div>
      )}
    </article>
  )
}
