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

        // For extension environment, we'll use console logging
        // In a full implementation, this could show browser notifications
        // or in-popup notifications

        const emoji = this.getEmojiForType(type)
        console.log(`${emoji} ${title}: ${message}`)

        // Could also use browser notifications API if permission is granted
        // this.showBrowserNotification(options);
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
