import { browser } from 'webextension-polyfill-ts'
import { AuthState, User } from '@/types/auth'
import config from '@/config'

const STORAGE_KEY = config.storage.keys.auth

export class AuthStorage {
    /**
     * Save authentication data to extension storage
     */
    static async saveAuth(user: User, token: string): Promise<void> {
        const authState: AuthState = {
            user,
            token,
            isAuthenticated: true
        }

        console.log('[AuthStorage] Saving auth state for user:', user.email)
        await browser.storage.sync.set({
            [STORAGE_KEY]: authState
        })

        // Also save to local storage as backup
        try {
            await browser.storage.local.set({
                [STORAGE_KEY]: authState
            })
        } catch (error) {
            console.warn('[AuthStorage] Failed to save to local storage:', error)
        }
    }

    /**
     * Get authentication data from extension storage
     */
    static async getAuth(): Promise<AuthState | null> {
        try {
            console.log('[AuthStorage] Getting auth state...')
            // Try sync storage first
            let result = await browser.storage.sync.get(STORAGE_KEY)
            let authState = result[STORAGE_KEY]

            if (!authState) {
                // Fallback to local storage
                console.log('[AuthStorage] Sync storage empty, trying local storage...')
                result = await browser.storage.local.get(STORAGE_KEY)
                authState = result[STORAGE_KEY]
            }

            if (authState) {
                // Validate the auth state structure
                if (this.isValidAuthState(authState)) {
                    console.log(
                        '[AuthStorage] Found valid auth state for user:',
                        authState.user?.email
                    )
                    return authState
                } else {
                    console.warn('[AuthStorage] Invalid auth state structure, clearing storage')
                    await this.clearAuth()
                    return null
                }
            } else {
                console.log('[AuthStorage] No auth state found')
                return null
            }
        } catch (error) {
            console.error('[AuthStorage] Error getting auth data:', error)
            return null
        }
    }

    /**
     * Validate auth state structure
     */
    private static isValidAuthState(authState: any): authState is AuthState {
        return (
            authState &&
            typeof authState === 'object' &&
            authState.user &&
            typeof authState.user === 'object' &&
            authState.user.id &&
            authState.user.email &&
            authState.token &&
            typeof authState.token === 'string' &&
            typeof authState.isAuthenticated === 'boolean'
        )
    }

    /**
     * Remove authentication data from extension storage
     */
    static async clearAuth(): Promise<void> {
        console.log('[AuthStorage] Clearing auth state')
        try {
            await browser.storage.sync.remove(STORAGE_KEY)
            await browser.storage.local.remove(STORAGE_KEY)
        } catch (error) {
            console.error('[AuthStorage] Error clearing auth data:', error)
        }
    }

    /**
     * Check if user is authenticated
     */
    static async isAuthenticated(): Promise<boolean> {
        const authState = await this.getAuth()
        const isAuth =
            authState?.isAuthenticated && authState?.token && authState?.user ? true : false
        console.log('[AuthStorage] Is authenticated:', isAuth)
        return isAuth
    }

    /**
     * Update user data without changing token
     */
    static async updateUser(user: User): Promise<void> {
        const authState = await this.getAuth()
        if (authState && authState.token) {
            await this.saveAuth(user, authState.token)
        }
    }

    /**
     * Get debug info about storage state
     */
    static async getDebugInfo(): Promise<any> {
        try {
            const syncResult = await browser.storage.sync.get(STORAGE_KEY)
            const localResult = await browser.storage.local.get(STORAGE_KEY)

            return {
                syncStorage: syncResult[STORAGE_KEY] || null,
                localStorage: localResult[STORAGE_KEY] || null,
                storageKey: STORAGE_KEY
            }
        } catch (error) {
            return { error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }
}
