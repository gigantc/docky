import { forwardRef } from 'react'
import SearchBar from '../SearchBar/SearchBar'
import DocList from '../DocList/DocList'
import './Sidebar.scss'

const Sidebar = forwardRef(function Sidebar({
  query,
  onQueryChange,
  filteredCount,
  totalCount,
  grouped,
  filteredLists,
  openSections,
  onToggleSection,
  activeDoc,
  activeListId,
  onSelectDoc,
  onSelectList,
}, searchRef) {
  return (
    <aside className="sidebar">
      <SearchBar
        ref={searchRef}
        query={query}
        onQueryChange={onQueryChange}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />
      <DocList
        grouped={grouped}
        filteredLists={filteredLists}
        filteredCount={filteredCount}
        openSections={openSections}
        onToggleSection={onToggleSection}
        activeDoc={activeDoc}
        activeListId={activeListId}
        query={query}
        onSelectDoc={onSelectDoc}
        onSelectList={onSelectList}
      />
    </aside>
  )
})

export default Sidebar
