import { Search } from 'lucide-react'
import Auth from '../Auth/Auth'
import './AppHeader.scss'

export default function AppHeader({
  user,
  version,
  query,
  onQueryChange,
}) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__brand-title">The Dock</div>
        <div className="app-header__brand-sub">dFree x Apollo</div>
      </div>

      <div className="app-header__search">
        <Search size={14} strokeWidth={2} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search archive..."
          value={query || ''}
          onChange={(event) => onQueryChange?.(event.target.value)}
        />
      </div>

      <div className="app-header__actions">
        <Auth user={user} version={version} />
      </div>
    </header>
  )
}
