import { memo } from 'react'
import { BookOpen, Home as HomeIcon, ListTodo, Newspaper, Plus, Settings, StickyNote } from 'lucide-react'
import './Sidebar.scss'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'briefs', label: 'Briefs', Icon: Newspaper },
  { id: 'notes', label: 'Notes', Icon: StickyNote },
  { id: 'journals', label: 'Journals', Icon: BookOpen },
  { id: 'lists', label: 'Lists', Icon: ListTodo },
]

function Sidebar({
  view,
  onViewChange,
  onNewEntry,
  sidebarMode = 'full', // 'full' | 'rail'
}) {
  const isRail = sidebarMode === 'rail'

  return (
    <aside className={`sidebar ${isRail ? 'sidebar--rail' : 'sidebar--full'}`}>
      <div className="sidebar__brand">
        {isRail
          ? <span className="sidebar__brand-mark">D.</span>
          : (
            <>
              <div className="sidebar__brand-title">The Dock</div>
              <div className="sidebar__brand-sub">dFree x Apollo</div>
            </>
          )}
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const isActive = view === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar__nav-item ${isActive ? 'is-active' : ''}`}
              onClick={() => onViewChange?.(item.id)}
              data-tooltip={isRail ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span className="sidebar__nav-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        {!isRail && (
          <button
            type="button"
            className="sidebar__new"
            onClick={onNewEntry}
            data-tooltip="New entry"
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            <span className="sidebar__nav-label">New Entry</span>
          </button>
        )}

        <button
          type="button"
          className="sidebar__nav-item"
          disabled
          data-tooltip={isRail ? 'Settings (coming soon)' : undefined}
          aria-label="Settings"
        >
          <Settings size={16} strokeWidth={1.8} aria-hidden="true" />
          <span className="sidebar__nav-label">Settings</span>
        </button>
      </div>
    </aside>
  )
}

export default memo(Sidebar)
