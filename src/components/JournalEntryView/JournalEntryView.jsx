import { useEffect, useMemo, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Bold, Heading1, Heading2, Italic, List, ListChecks, ListOrdered, Link as LinkIcon, Pencil, Save, Trash2, Underline as UnderlineIcon, X } from 'lucide-react'
import { markdownToInitialHtml, richTextExtensions } from '../../utils/richText'
import '../DocumentView/DocumentView.scss'
import './JournalEntryView.scss'

export default function JournalEntryView({
  entry,
  journal,
  user,
  onSave,
  onRequestDiscardNew,
  onDelete,
  autoStartEdit = false,
}) {
  const editable = Boolean(user)
  const [isEditing, setIsEditing] = useState(Boolean(autoStartEdit && editable))
  const [titleDraft, setTitleDraft] = useState(entry.title || '')
  const [chapterDraft, setChapterDraft] = useState(entry.chapter || 'General')
  const isDraftEntry = Boolean(autoStartEdit)

  const initialContent = useMemo(() => {
    if (entry.contentJson) return entry.contentJson
    return markdownToInitialHtml(entry.content || '')
  }, [entry.contentJson, entry.content])

  const editor = useEditor({
    extensions: richTextExtensions,
    content: initialContent,
    editable: isEditing,
    immediatelyRender: false,
  })

  useEffect(() => {
    setIsEditing(Boolean(autoStartEdit && editable))
    setTitleDraft(entry.title || '')
    setChapterDraft(entry.chapter || 'General')

    if (editor) {
      editor.setEditable(Boolean(autoStartEdit && editable))
      editor.commands.setContent(entry.contentJson || markdownToInitialHtml(entry.content || ''), false)
    }
  }, [entry.id, entry.title, entry.chapter, entry.content, entry.contentJson, editor, autoStartEdit, editable])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(isEditing)
  }, [editor, isEditing])

  const saveEntry = async () => {
    if (!editor) return
    await onSave(entry, {
      title: titleDraft,
      chapter: chapterDraft,
      contentJson: editor.getJSON(),
      content: editor.getText(),
    })
    setIsEditing(false)
  }

  const cancelEdit = () => {
    if (isDraftEntry) {
      onRequestDiscardNew?.(entry)
      return
    }
    setIsEditing(false)
    setTitleDraft(entry.title || '')
    setChapterDraft(entry.chapter || 'General')
    if (editor) editor.commands.setContent(entry.contentJson || markdownToInitialHtml(entry.content || ''), false)
  }

  const tool = (label, action, active = false, icon = null) => (
    <button className={`doc__icon ${active ? 'is-active' : ''}`} type="button" onClick={action} aria-label={label}>
      {icon}
    </button>
  )

  return (
    <article className="doc journal-entry">
      <header className="doc__header">
        <div className="doc__title">
          <div className="journal-entry__breadcrumb">
            <span className="journal-entry__crumb">{journal?.title || 'Journal'}</span>
            <span className="journal-entry__sep">/</span>
            <span className="journal-entry__crumb">{entry.chapter || 'General'}</span>
          </div>
          {isEditing && editable ? (
            <input
              className="doc__title-input"
              type="text"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              placeholder="Untitled"
            />
          ) : (
            <h1>{entry.title || 'Untitled Entry'}</h1>
          )}
          <div className="doc__kind">Journal Entry</div>
        </div>

        {user && (
          <div className="doc__panel">
            {editable && !isEditing && tool('Edit entry', () => setIsEditing(true), false, <Pencil aria-hidden="true" size={16} />)}
            {editable && isEditing && (
              <>
                {tool('Save entry', saveEntry, false, <Save aria-hidden="true" size={16} />)}
                {tool('Cancel edit', cancelEdit, false, <X aria-hidden="true" size={16} />)}
              </>
            )}
            {tool('Delete entry', () => onDelete(entry), false, <Trash2 aria-hidden="true" size={16} />)}
          </div>
        )}
        {isEditing && editable && (
          <div className="doc__editor-meta is-sticky">
            <label className="doc__label">Chapter</label>
            <input
              className="doc__input"
              type="text"
              value={chapterDraft}
              onChange={(event) => setChapterDraft(event.target.value)}
              placeholder="General"
            />

            {editor && (
              <div className="doc__toolbar">
                {tool('Bold', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), <Bold aria-hidden="true" size={14} />)}
                {tool('Italic', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), <Italic aria-hidden="true" size={14} />)}
                {tool('Underline', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), <UnderlineIcon aria-hidden="true" size={14} />)}
                {tool('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }), <Heading1 aria-hidden="true" size={14} />)}
                {tool('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), <Heading2 aria-hidden="true" size={14} />)}
                {tool('Bullet list', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), <List aria-hidden="true" size={14} />)}
                {tool('Numbered list', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), <ListOrdered aria-hidden="true" size={14} />)}
                {tool('Checklist', () => editor.chain().focus().toggleTaskList().run(), editor.isActive('taskList'), <ListChecks aria-hidden="true" size={14} />)}
                {tool('Link', () => {
                  const url = window.prompt('Enter URL')
                  if (url) editor.chain().focus().setLink({ href: url }).run()
                }, editor.isActive('link'), <LinkIcon aria-hidden="true" size={14} />)}
              </div>
            )}
          </div>
        )}
      </header>

      <div className={`doc__content ${isEditing ? 'is-editing' : ''}`}>
        <EditorContent editor={editor} />
      </div>
    </article>
  )
}
