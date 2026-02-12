import Auth from '../Auth/Auth'
import './AppHeader.scss'

export default function AppHeader({ user, onNewNote, onNewList, theme, onThemeChange, version }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand__title">The Dock</div>
        <div className="brand__subtitle">dFree × Apollo</div>
      </div>

      <div className="app-header__actions">
        {user && (
          <>
            <button className="icon-button icon-button--primary" onClick={onNewNote} type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5V6a1 1 0 0 1 1-1Z" />
              </svg>
              <span>New</span>
            </button>
            <button className="icon-button" onClick={onNewList} type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm5.5-.5a1 1 0 1 1 0 2H20a1 1 0 1 1 0-2H9.5Zm-5.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm5.5-.5a1 1 0 1 1 0 2H20a1 1 0 1 1 0-2H9.5Zm-5.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm5.5-.5a1 1 0 1 1 0 2H20a1 1 0 1 1 0-2H9.5Z" />
              </svg>
              <span>New List</span>
            </button>
          </>
        )}
        <Auth user={user} theme={theme} onThemeChange={onThemeChange} version={version} />
      </div>
    </header>
  )
}
