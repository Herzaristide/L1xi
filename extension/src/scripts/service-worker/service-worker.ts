console.log('Background Service Worker Loaded')

// Keep the service worker alive and maintain auth state
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed')

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
            sendResponse({ success: true })
            break
        case 'AUTH_STATE_CHANGED':
            // Handle auth state changes from content script
            console.log(
                '[ServiceWorker] Auth state changed from content script:',
                message.authState
            )
            sendResponse({ success: true })
            break
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
