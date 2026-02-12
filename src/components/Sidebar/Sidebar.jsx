import { forwardRef, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
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
  sidebarOpen,
  onToggleSidebar,
}, searchRef) {
  const contentRef = useRef(null)

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return

    gsap.killTweensOf(content)

    if (sidebarOpen) {
      gsap.set(content, { display: 'block' })
      gsap.to(content, {
        autoAlpha: 1,
        x: 0,
        duration: 0.24,
        ease: 'power2.out',
      })
      return
    }

    gsap.to(content, {
      autoAlpha: 0,
      x: -14,
      duration: 0.18,
      ease: 'power2.out',
      onComplete: () => gsap.set(content, { display: 'none' }),
    })
  }, [sidebarOpen])

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}>
      <div className="sidebar__top">
        <button
          className="sidebar__toggle"
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen
            ? <PanelLeftClose aria-hidden="true" size={16} strokeWidth={2} />
            : <PanelLeft aria-hidden="true" size={16} strokeWidth={2} />}
        </button>
      </div>

      <div className="sidebar__content" ref={contentRef}>
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
      </div>
    </aside>
  )
})

export default Sidebar
