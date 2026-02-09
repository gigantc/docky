import { useState } from 'react'
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '../../firebase'
import './Auth.scss'

export default function Auth({ user }) {
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const handleSignIn = async () => {
    setAuthError('')
    try {
      await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword)
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleSignUp = async () => {
    setAuthError('')
    try {
      await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword)
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
  }

  return (
    <div className="auth">
      {user ? (
        <div className="auth__signed-in">
          <div className="auth__label">Signed in as</div>
          <div className="auth__value">{user.email}</div>
          <button className="auth__button auth__button--ghost" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <>
          <input
            className="auth__input"
            type="email"
            placeholder="Email"
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
          />
          <input
            className="auth__input"
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(event) => setAuthPassword(event.target.value)}
          />
          <div className="auth__actions">
            <button className="auth__button" onClick={handleSignIn}>Sign in</button>
            <button className="auth__button auth__button--ghost" onClick={handleSignUp}>Sign up</button>
          </div>
          {authError && <div className="auth__error">{authError}</div>}
        </>
      )}
    </div>
  )
}
