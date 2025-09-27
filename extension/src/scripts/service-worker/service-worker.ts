console.log('Background Service Worker Loaded')

import { NotificationService } from '../../utils/notifications'
import { AuthStorage } from '../../utils/storage'

// Update context menu state based on auth
async function updateContextMenuState() {
    try {
        const auth = await AuthStorage.getAuth()
        const isAuthenticated = auth && auth.token

        chrome.contextMenus.update('add-to-l1xi', {
            enabled: !!isAuthenticated,
            title: isAuthenticated ? 'Add to L1xi' : 'Add to L1xi (Login required)'
        })
    } catch (error) {
        console.error('Error updating context menu state:', error)
        // Disable context menu on error
        chrome.contextMenus.update('add-to-l1xi', {
            enabled: false,
            title: 'Add to L1xi (Error)'
        })
    }
}

// Keep the service worker alive and maintain auth state
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed')

    // Create context menu for selected text
    chrome.contextMenus.create({
        id: 'add-to-l1xi',
        title: 'Add to L1xi',
        contexts: ['selection'],
        enabled: true
    })

    // Update context menu state based on authentication
    await updateContextMenuState()

    // Set up periodic auth state checks if needed
    chrome.alarms.create('authCheck', { periodInMinutes: 60 }) // Check every hour
})

// Handle alarm events for periodic tasks
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'authCheck') {
        console.log('Periodic auth check triggered')
        // Could add token refresh logic here if needed
    }
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'add-to-l1xi') {
        console.log('Add to L1xi context menu clicked')

        // Check authentication first
        const auth = await AuthStorage.getAuth()
        if (!auth?.token) {
            NotificationService.error('L1xi Extension', 'Please log in to L1xi first')
            return
        }

        // Get the selected text
        const selectedText = info.selectionText
        if (!selectedText || selectedText.trim().length === 0) {
            console.warn('No text selected')
            NotificationService.warning('L1xi Extension', 'No text selected')
            return
        }

        try {
            // Send message to content script to handle the card creation
            const response = await chrome.tabs.sendMessage(tab!.id!, {
                action: 'CREATE_CARD_FROM_TEXT',
                data: {
                    selectedText: selectedText.trim(),
                    sourceUrl: tab?.url,
                    sourceTitle: tab?.title
                }
            })

            if (response?.success) {
                console.log('Card created successfully:', response.card)

                // Show success notification
                const truncatedText = NotificationService.truncateText(selectedText, 50)
                NotificationService.success(
                    'L1xi Extension',
                    `Added "${truncatedText}" to your cards!`
                )
            } else {
                console.error('Failed to create card:', response?.error)

                // Show error notification
                NotificationService.error(
                    'L1xi Extension',
                    response?.error || 'Failed to add card. Please try again.'
                )
            }
        } catch (error) {
            console.error('Error creating card from selected text:', error)

            // Show error notification
            NotificationService.error(
                'L1xi Extension',
                'Failed to add card. Please check your connection and try again.'
            )
        }
    }
})

chrome.action.setBadgeText({ text: 'ON' })

chrome.action.onClicked.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const activeTab = tabs[0]
        chrome.tabs.sendMessage(activeTab.id!, { message: 'clicked_browser_action' })
    })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { command } = message
    switch (command) {
        case 'hello-world':
            console.log('Hello World, from the Background Service Worker')
            sendResponse({ success: true, message: 'Hello World' })
            break
        case 'auth-state-changed':
            // Handle auth state changes from popup or content scripts
            console.log('Auth state changed:', message.authState)
            updateContextMenuState()
                .then(() => {
                    sendResponse({ success: true })
                })
                .catch(error => {
                    console.error('Error updating context menu state:', error)
                    sendResponse({ success: false, error: error.message })
                })
            return true // Keep message channel open for async response
        case 'AUTH_STATE_CHANGED':
            // Handle auth state changes from content script
            console.log(
                '[ServiceWorker] Auth state changed from content script:',
                message.authState
            )
            updateContextMenuState()
                .then(() => {
                    sendResponse({ success: true })
                })
                .catch(error => {
                    console.error('Error updating context menu state:', error)
                    sendResponse({ success: false, error: error.message })
                })
            return true // Keep message channel open for async response
        default:
            break
    }
})

chrome.commands.onCommand.addListener(command => {
    console.log(`Command: ${command}`)

    if (command === 'refresh_extension') {
        chrome.runtime.reload()
    }
})

// Handle extension startup - service worker may restart frequently
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension startup - service worker restarted')
})

export {}
