import { useState } from 'react'
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '../../firebase'
import './LoginPage.scss'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAuth = async (mode) => {
    setError('')
    setSubmitting(true)
    try {
      const cleanEmail = email.trim()
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, cleanEmail, password)
      } else {
        await createUserWithEmailAndPassword(auth, cleanEmail, password)
      }
    } catch (authError) {
      setError(authError.message || 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-label="Login">
        <div className="login-card__brand">The Dock</div>
        <div className="login-card__subtitle">dFree × Apollo</div>

        <div className="login-card__form">
          <input
            className="login-card__input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
          <input
            className="login-card__input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          <div className="login-card__actions">
            <button
              className="login-card__button"
              onClick={() => handleAuth('signin')}
              disabled={submitting}
              type="button"
            >
              Sign in
            </button>
            <button
              className="login-card__button login-card__button--ghost"
              onClick={() => handleAuth('signup')}
              disabled={submitting}
              type="button"
            >
              Sign up
            </button>
          </div>

          {error && <div className="login-card__error">{error}</div>}
        </div>
      </section>
    </main>
  )
}
