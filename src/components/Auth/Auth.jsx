import { useEffect, useMemo, useRef, useState } from 'react'
import { auth, signOut } from '../../firebase'
import './Auth.scss'

export default function Auth({ user }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = useMemo(() => {
    const email = user?.email || ''
    return email.slice(0, 1).toUpperCase() || 'A'
  }, [user])

  if (!user) return null

  const handleSignOut = async () => {
    await signOut(auth)
    setOpen(false)
  }

  return (
    <div className="auth-menu" ref={wrapRef}>
      <button
        className="auth-menu__avatar"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        {initials}
      </button>

      {open && (
        <div className="auth-menu__dropdown" role="menu">
          <div className="auth-menu__email">{user.email}</div>
          <button
            className="auth-menu__item"
            type="button"
            role="menuitem"
            onClick={handleSignOut}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
