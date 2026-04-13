import { forwardRef } from 'react'
import './SearchBar.scss'

const SearchBar = forwardRef(function SearchBar({ query, onQueryChange, filteredCount, totalCount }, ref) {
  return (
    <div className="sidebar__search search">
      <input
        ref={ref}
        className="search__input"
        type="search"
        placeholder="Search docs..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <div className="search__hint">
        Showing {filteredCount} of {totalCount}
      </div>
    </div>
  )
})

export default SearchBar
