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
  onOpenSettings,
  sidebarMode = 'full', // 'full' | 'rail'
}) {
  const isRail = sidebarMode === 'rail'

  return (
    <aside className={`sidebar ${isRail ? 'sidebar--rail' : 'sidebar--full'}`}>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const isActive = view === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar__nav-item ${isActive ? 'is-active' : ''}`}
              onClick={() => onViewChange?.(item.id)}
             
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
           
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            <span className="sidebar__nav-label">New Entry</span>
          </button>
        )}

        <button
          type="button"
          className="sidebar__nav-item"
          onClick={onOpenSettings}
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
