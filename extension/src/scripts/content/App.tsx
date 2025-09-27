import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { CardService } from '../../services/cardService'

const App = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        console.log('[ContentScript] L1xi Extension content script loaded')

        // Listen for messages from extension
        const handleMessage = async (message: any, sender: any, sendResponse: any) => {
            console.log('[ContentScript] Received message:', message)

            switch (message.action) {
                case 'GET_AUTH_STATE':
                    try {
                        // Get auth state from website's localStorage/Zustand
                        const authState = getWebsiteAuthState()
                        sendResponse({
                            success: true,
                            isAuthenticated: authState.isAuthenticated,
                            user: authState.user,
                            token: authState.token
                        })
                    } catch (error) {
                        console.error('[ContentScript] Error getting auth state:', error)
                        sendResponse({
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        })
                    }
                    return true // Keep message channel open for async response

                case 'PING':
                    sendResponse({ success: true, message: 'Content script is active' })
                    break

                case 'CREATE_CARD_FROM_TEXT':
                    try {
                        console.log('[ContentScript] Creating card from text:', message.data)

                        // Create the card using the CardService
                        const card = await CardService.createCardFromText({
                            selectedText: message.data.selectedText,
                            sourceUrl: message.data.sourceUrl,
                            sourceTitle: message.data.sourceTitle,
                            frontLanguageId: 'en', // Could be detected from page lang
                            backLanguageId: undefined // User will set this
                        })

                        sendResponse({
                            success: true,
                            card: card,
                            message: 'Card created successfully'
                        })
                    } catch (error) {
                        console.error('[ContentScript] Error creating card:', error)

                        let errorMessage = 'Failed to create card'
                        if (error instanceof Error) {
                            if (error.message.includes('Authentication required')) {
                                errorMessage = 'Please log in to L1xi first'
                            } else if (error.message.includes('fetch')) {
                                errorMessage =
                                    'Connection error. Please check your internet connection'
                            } else {
                                errorMessage = error.message
                            }
                        }

                        sendResponse({
                            success: false,
                            error: errorMessage
                        })
                    }
                    return true // Keep message channel open for async response

                case 'clicked_browser_action':
                    console.log('[ContentScript] Browser action clicked')
                    break

                default:
                    console.warn('[ContentScript] Unknown message action:', message.action)
                    break
            }
        }

        // Add message listener (use chrome API for compatibility)
        chrome.runtime.onMessage.addListener(handleMessage)

        // Watch for auth state changes in the website
        watchForAuthChanges()

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage)
        }
    }, [])

    // Function to get auth state from website's storage
    const getWebsiteAuthState = () => {
        try {
            // Try to get from Zustand persist storage (used by your frontend)
            const zustandStorage = localStorage.getItem('l1xi-auth-storage')
            if (zustandStorage) {
                const parsed = JSON.parse(zustandStorage)
                const authState = parsed.state

                if (authState && authState.user && authState.token) {
                    return {
                        isAuthenticated: true,
                        user: authState.user,
                        token: authState.token
                    }
                }
            }

            // Fallback: try standard auth keys that might be used
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
            const userStr = localStorage.getItem('user') || localStorage.getItem('auth_user')

            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr)
                    return {
                        isAuthenticated: true,
                        user,
                        token
                    }
                } catch (parseError) {
                    console.warn('[ContentScript] Error parsing user data:', parseError)
                }
            }

            return { isAuthenticated: false }
        } catch (error) {
            console.error('[ContentScript] Error getting website auth state:', error)
            return { isAuthenticated: false }
        }
    }

    // Watch for changes in auth state
    const watchForAuthChanges = () => {
        let lastAuthState = JSON.stringify(getWebsiteAuthState())

        const checkInterval = setInterval(() => {
            const currentAuthState = JSON.stringify(getWebsiteAuthState())
            if (currentAuthState !== lastAuthState) {
                console.log('[ContentScript] Auth state changed, notifying extension')
                lastAuthState = currentAuthState

                // Notify extension of auth state change
                chrome.runtime
                    .sendMessage({
                        action: 'AUTH_STATE_CHANGED',
                        authState: getWebsiteAuthState()
                    })
                    .catch((error: any) => {
                        console.warn(
                            '[ContentScript] Could not send auth change notification:',
                            error
                        )
                    })
            }
        }, 2000) // Check every 2 seconds

        // Cleanup interval on page unload
        window.addEventListener('beforeunload', () => {
            clearInterval(checkInterval)
        })
    }

    // Only render UI if needed (for debugging)
    if (!isVisible) {
        return null
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: '#fff',
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '4px',
                zIndex: 10000,
                fontSize: '12px',
                fontFamily: 'Arial, sans-serif',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
        >
            <div>L1xi Extension Active</div>
            <button
                onClick={() => setIsVisible(false)}
                style={{
                    marginTop: '5px',
                    padding: '2px 6px',
                    fontSize: '10px'
                }}
            >
                Hide
            </button>
        </div>
    )
}

export default App
