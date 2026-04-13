import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function DocListSection({ label, isOpen, onToggle, children }) {
  const contentRef = useRef(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    if (isOpen) {
      gsap.to(el, { height: 'auto', opacity: 1, duration: 0.2, ease: 'power1.out' })
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.2, ease: 'power1.in' })
    }
  }, [isOpen])

  return (
    <div className="doc-list__section">
      <button
        className="doc-list__heading doc-list__heading--toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{label}</span>
        <span className={`doc-list__chevron ${isOpen ? 'is-open' : ''}`}>
          ▾
        </span>
      </button>
      <div className="doc-list__content" ref={contentRef}>
        {children}
      </div>
    </div>
  )
}
