import { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth'
import { AuthStorage } from '@/utils/storage'
import { ErrorHandler } from '@/utils/errorHandler'
import config from '@/config'
import { browser } from 'webextension-polyfill-ts'

const WEBSITE_URL = 'http://localhost:3000'
const API_BASE_URL = config.api.baseUrl

export class AuthService {
    /**
     * Check authentication status from the L1xi website
     */
    static async checkWebsiteAuth(): Promise<{
        isAuthenticated: boolean
        user?: any
        token?: string
    }> {
        try {
            console.log('[AuthService] Checking website authentication...')

            // Try to get auth from website's localStorage via content script
            const tabs = await browser.tabs.query({ url: `${WEBSITE_URL}/*` })

            if (tabs.length > 0) {
                // Website is open, get auth from it
                const authData = await this.getAuthFromWebsite(tabs[0].id!)
                if (authData.isAuthenticated) {
                    // Save to extension storage
                    await AuthStorage.saveAuth(authData.user, authData.token)
                    return authData
                }
            }

            // Fallback: try to verify existing token
            const existingAuth = await AuthStorage.getAuth()
            if (existingAuth?.token) {
                const isValid = await this.verifyTokenWithAPI(existingAuth.token)
                if (isValid) {
                    return {
                        isAuthenticated: true,
                        user: existingAuth.user,
                        token: existingAuth.token
                    }
                } else {
                    await AuthStorage.clearAuth()
                }
            }

            return { isAuthenticated: false }
        } catch (error) {
            console.error('[AuthService] Error checking website auth:', error)
            return { isAuthenticated: false }
        }
    }

    /**
     * Get authentication data from the website via content script
     */
    static async getAuthFromWebsite(
        tabId: number
    ): Promise<{ isAuthenticated: boolean; user?: any; token?: string }> {
        try {
            const response = await browser.tabs.sendMessage(tabId, {
                action: 'GET_AUTH_STATE'
            })

            if (response && response.success) {
                return {
                    isAuthenticated: response.isAuthenticated,
                    user: response.user,
                    token: response.token
                }
            }

            return { isAuthenticated: false }
        } catch (error) {
            console.error('[AuthService] Error getting auth from website:', error)
            return { isAuthenticated: false }
        }
    }

    /**
     * Open the L1xi website login page
     */
    static async openWebsiteLogin(): Promise<void> {
        try {
            console.log('[AuthService] Opening website login...')

            // Check if website is already open
            const tabs = await browser.tabs.query({ url: `${WEBSITE_URL}/*` })

            if (tabs.length > 0) {
                // Website is open, navigate to login and focus the tab
                await browser.tabs.update(tabs[0].id!, {
                    url: `${WEBSITE_URL}/#/login`,
                    active: true
                })
                await browser.windows.update(tabs[0].windowId!, { focused: true })
            } else {
                // Open new tab with login page
                await browser.tabs.create({
                    url: `${WEBSITE_URL}/#/login`,
                    active: true
                })
            }

            // Close the extension popup
            window.close()
        } catch (error) {
            console.error('[AuthService] Error opening website login:', error)
            // Fallback: try to open in current tab
            window.open(`${WEBSITE_URL}/#/login`, '_blank')
        }
    }

    /**
     * Verify token with API directly
     */
    static async verifyTokenWithAPI(token: string): Promise<boolean> {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), config.api.timeout)

            const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            return response.ok
        } catch (error) {
            console.error('[AuthService] Token verification failed:', error)
            return false
        }
    }
    /**
     * Login user (Legacy method - now redirects to website)
     * @deprecated Use openWebsiteLogin() instead
     */
    static async login(credentials: LoginRequest): Promise<AuthResponse> {
        console.warn('[AuthService] Direct login is deprecated. Redirecting to website login...')
        await this.openWebsiteLogin()
        return {
            success: false,
            message: 'Redirected to website login'
        }
    }

    /**
     * Register user (Legacy method - now redirects to website)
     * @deprecated Use openWebsiteLogin() and navigate to register instead
     */
    static async register(userData: RegisterRequest): Promise<AuthResponse> {
        console.warn('[AuthService] Direct register is deprecated. Redirecting to website...')
        // Open website register page instead of login
        try {
            const tabs = await browser.tabs.query({ url: 'http://localhost:3000/*' })

            if (tabs.length > 0) {
                await browser.tabs.update(tabs[0].id!, {
                    url: 'http://localhost:3000/#/register',
                    active: true
                })
                await browser.windows.update(tabs[0].windowId!, { focused: true })
            } else {
                await browser.tabs.create({
                    url: 'http://localhost:3000/#/register',
                    active: true
                })
            }

            window.close()
        } catch (error) {
            window.open('http://localhost:3000/#/register', '_blank')
        }

        return {
            success: false,
            message: 'Redirected to website registration'
        }
    }

    /**
     * Verify authentication - now checks website auth first
     */
    static async verify(): Promise<boolean> {
        try {
            console.log('[AuthService] Verifying authentication...')

            // First try to get auth from website
            const websiteAuth = await this.checkWebsiteAuth()
            if (websiteAuth.isAuthenticated) {
                return true
            }

            // Fallback to stored token verification
            const authState = await AuthStorage.getAuth()
            if (!authState || !authState.token) {
                console.log('[AuthService] No auth state or token found')
                return false
            }

            const isValid = await this.verifyTokenWithAPI(authState.token)
            if (!isValid) {
                console.log('[AuthService] Token is invalid, clearing auth')
                await AuthStorage.clearAuth()
            }

            return isValid
        } catch (error) {
            console.error('[AuthService] Verify error:', error)
            return false
        }
    }

    /**
     * Logout user
     */
    static async logout(): Promise<void> {
        await AuthStorage.clearAuth()
    }
}
