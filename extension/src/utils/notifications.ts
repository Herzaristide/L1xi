export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationOptions {
    title: string
    message: string
    type: NotificationType
    duration?: number
}

export class NotificationService {
    /**
     * Show a simple notification (for now just console log, can be enhanced later)
     */
    static show(options: NotificationOptions): void {
        const { title, message, type } = options

        const emoji = this.getEmojiForType(type)
        console.log(`${emoji} ${title}: ${message}`)

        // Use Chrome extension notifications if available
        this.showChromeNotification(options)
    }

    /**
     * Show Chrome extension notification
     */
    static showChromeNotification(options: NotificationOptions): void {
        if (typeof chrome !== 'undefined' && chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icon-48.png',
                title: options.title,
                message: options.message
            })
        }
    }

    /**
     * Truncate text for notification display
     */
    static truncateText(text: string, maxLength: number = 50): string {
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength) + '...'
    }

    /**
     * Show success notification
     */
    static success(title: string, message: string): void {
        this.show({ title, message, type: 'success' })
    }

    /**
     * Show error notification
     */
    static error(title: string, message: string): void {
        this.show({ title, message, type: 'error' })
    }

    /**
     * Show warning notification
     */
    static warning(title: string, message: string): void {
        this.show({ title, message, type: 'warning' })
    }

    /**
     * Show info notification
     */
    static info(title: string, message: string): void {
        this.show({ title, message, type: 'info' })
    }

    private static getEmojiForType(type: NotificationType): string {
        switch (type) {
            case 'success':
                return '✅'
            case 'error':
                return '❌'
            case 'warning':
                return '⚠️'
            case 'info':
            default:
                return 'ℹ️'
        }
    }

    /**
     * Show browser notification (requires permission)
     */
    private static async showBrowserNotification(options: NotificationOptions): Promise<void> {
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(options.title, {
                    body: options.message,
                    icon: '/assets/icon-48.png'
                })
            }
        } catch (error) {
            console.error('Error showing browser notification:', error)
        }
    }
}
