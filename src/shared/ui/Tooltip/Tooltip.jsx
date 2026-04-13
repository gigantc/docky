import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './Tooltip.scss'

const DELAY = 500
const WARM_WINDOW = 300
const VIEWPORT_PAD = 8

export default function Tooltip() {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')
  const [pos, setPos] = useState({ x: 0, y: 0, arrowX: 0, above: false })
  const timerRef = useRef(null)
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const lastHideRef = useRef(0)

  const hide = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = null
    triggerRef.current = null
    lastHideRef.current = Date.now()
    setVisible(false)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return

    function show(trigger) {
      const tip = trigger.getAttribute('data-tooltip')
      if (!tip) return
      setText(tip)
      setVisible(true)
    }

    function handleOver(e) {
      const el = e.target.nodeType === 1 ? e.target : e.target.parentElement
      if (!el) return
      const trigger = el.closest('[data-tooltip]')
      if (!trigger) return

      // Still inside the same trigger — nothing to do
      if (trigger === triggerRef.current) return

      // Entering a new trigger — clear any pending timer from a previous one
      clearTimeout(timerRef.current)
      triggerRef.current = trigger

      const warm = Date.now() - lastHideRef.current < WARM_WINDOW
      if (warm) {
        show(trigger)
      } else {
        timerRef.current = setTimeout(() => {
          if (!triggerRef.current) return
          show(triggerRef.current)
        }, DELAY)
      }
    }

    function handleOut(e) {
      const el = e.target.nodeType === 1 ? e.target : e.target.parentElement
      if (!el) return
      const trigger = el.closest('[data-tooltip]')
      if (!trigger || trigger !== triggerRef.current) return

      // Check if we're moving to another element inside the same trigger
      const related = e.relatedTarget
      if (related && trigger.contains(related)) return

      hide()
    }

    function handleScroll() {
      if (triggerRef.current) hide()
    }

    document.addEventListener('mouseover', handleOver)
    document.addEventListener('mouseout', handleOut)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      clearTimeout(timerRef.current)
      document.removeEventListener('mouseover', handleOver)
      document.removeEventListener('mouseout', handleOut)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [hide])

  // Position once visible & text set
  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const tip = tooltipRef.current
    const tipW = tip.offsetWidth
    const tipH = tip.offsetHeight

    const spaceBelow = window.innerHeight - rect.bottom
    const above = spaceBelow < tipH + 16

    const triggerCenter = rect.left + rect.width / 2
    let x = triggerCenter - tipW / 2
    let y = above
      ? rect.top - tipH - 8
      : rect.bottom + 8

    x = Math.max(VIEWPORT_PAD, Math.min(x, window.innerWidth - tipW - VIEWPORT_PAD))
    y = Math.max(VIEWPORT_PAD, y)

    const arrowX = Math.max(10, Math.min(triggerCenter - x, tipW - 10))

    setPos({ x, y, arrowX, above })
  }, [visible, text])

  if (!visible) return null

  return createPortal(
    <div
      ref={tooltipRef}
      className={`tooltip-portal ${pos.above ? 'tooltip-portal--above' : ''}`}
      style={{ left: pos.x, top: pos.y, '--arrow-x': `${pos.arrowX}px` }}
      role="tooltip"
    >
      {text}
    </div>,
    document.body
  )
}
