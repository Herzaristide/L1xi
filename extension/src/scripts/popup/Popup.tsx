import React, { useState, useEffect } from 'react'
import LoginForm from '../../components/LoginForm'
import RegisterForm from '../../components/RegisterForm'
import Dashboard from '../../components/Dashboard'
import Loading from '../../components/Loading'
import DebugPanel from '../../components/DebugPanel'
import { AuthStorage } from '@/utils/storage'
import { AuthService } from '@/services/authService'
import { User } from '@/types/auth'
import { browser } from 'webextension-polyfill-ts'
import config from '@/config'

type ViewState = 'loading' | 'login' | 'register' | 'authenticated'

const Popup = () => {
    const [viewState, setViewState] = useState<ViewState>('loading')
    const [user, setUser] = useState<User | null>(null)
    const [isVerifying, setIsVerifying] = useState(false)

    useEffect(() => {
        checkAuthStatus()

        // Listen for storage changes to update auth state in real-time
        const handleStorageChange = (changes: any, area: string) => {
            if (area === 'sync' || area === 'local') {
                const authKey = config.storage.keys.auth
                if (changes[authKey]) {
                    console.log('[Popup] Storage change detected, rechecking auth')
                    checkAuthStatus()
                }
            }
        }

        browser.storage.onChanged.addListener(handleStorageChange)

        return () => {
            browser.storage.onChanged.removeListener(handleStorageChange)
        }
    }, [])

    const checkAuthStatus = async () => {
        try {
            console.log('[Popup] Checking authentication status...')

            // First check website authentication
            const websiteAuth = await AuthService.checkWebsiteAuth()

            if (websiteAuth.isAuthenticated && websiteAuth.user) {
                console.log('[Popup] Found website auth state, user:', websiteAuth.user.email)
                setUser(websiteAuth.user)
                setViewState('authenticated')
                return
            }

            // Fallback to extension storage auth
            const authState = await AuthStorage.getAuth()

            if (authState?.isAuthenticated && authState?.token && authState?.user) {
                console.log('[Popup] Found existing auth state, user:', authState.user.email)
                setUser(authState.user)
                setViewState('authenticated')

                // Verify token in background without blocking UI
                setIsVerifying(true)
                AuthService.verify()
                    .then(isValid => {
                        setIsVerifying(false)
                        if (!isValid) {
                            console.log(
                                '[Popup] Token verification failed, redirecting to website login'
                            )
                            handleNoAuth()
                        } else {
                            console.log('[Popup] Token verification passed')
                        }
                    })
                    .catch(error => {
                        setIsVerifying(false)
                        console.warn('[Popup] Token verification error:', error)
                        // For network errors, keep user logged in but show a warning
                        if (
                            error.message?.includes('fetch') ||
                            error.message?.includes('network')
                        ) {
                            console.warn(
                                '[Popup] Network error during verification, keeping user logged in'
                            )
                        } else {
                            // For other errors, redirect to website login
                            console.error(
                                '[Popup] Unknown verification error, redirecting to website login'
                            )
                            handleNoAuth()
                        }
                    })
            } else {
                console.log('[Popup] No valid auth state found, redirecting to website login')
                handleNoAuth()
            }
        } catch (error) {
            console.error('[Popup] Error checking auth status:', error)
            handleNoAuth()
        }
    }

    const handleNoAuth = () => {
        setUser(null)
        setViewState('login')
        // Auto-open website login after a short delay
        setTimeout(() => {
            AuthService.openWebsiteLogin()
        }, 1000)
    }

    const handleLoginSuccess = async () => {
        // Refresh auth state after successful login
        const authState = await AuthStorage.getAuth()
        if (authState?.user) {
            setUser(authState.user)
            setViewState('authenticated')
        }
    }

    const handleLogout = async () => {
        try {
            console.log('[Popup] Logging out user')
            await AuthService.logout()
            setUser(null)
            setViewState('login')
        } catch (error) {
            console.error('[Popup] Error during logout:', error)
            // Force logout even if there's an error
            setUser(null)
            setViewState('login')
        }
    }

    const renderView = () => {
        switch (viewState) {
            case 'loading':
                return <Loading />

            case 'login':
                return (
                    <LoginForm
                        onLoginSuccess={handleLoginSuccess}
                        onSwitchToRegister={() => setViewState('register')}
                    />
                )

            case 'register':
                return (
                    <RegisterForm
                        onRegisterSuccess={handleLoginSuccess}
                        onSwitchToLogin={() => setViewState('login')}
                    />
                )

            case 'authenticated':
                return user ? <Dashboard user={user} onLogout={handleLogout} /> : <Loading />

            default:
                return <Loading />
        }
    }

    return (
        <div className="p-2">
            {renderView()}
            {process.env.NODE_ENV === 'development' && <DebugPanel />}
        </div>
    )
}

export default Popup
