export interface ErrorInfo {
    message: string
    code?: string
    details?: any
}

export class ErrorHandler {
    /**
     * Format error message for display to user
     */
    static formatErrorMessage(error: any): string {
        if (typeof error === 'string') {
            return error
        }

        if (error?.message) {
            return error.message
        }

        if (error?.response?.data?.message) {
            return error.response.data.message
        }

        if (error?.data?.message) {
            return error.data.message
        }

        return 'An unexpected error occurred'
    }

    /**
     * Log error to console with context
     */
    static logError(context: string, error: any): void {
        console.error(`[L1xi Extension - ${context}]:`, error)
    }

    /**
     * Handle network errors specifically
     */
    static handleNetworkError(error: any): ErrorInfo {
        if (!navigator.onLine) {
            return {
                message: 'No internet connection. Please check your network.',
                code: 'NETWORK_OFFLINE'
            }
        }

        if (error?.name === 'AbortError') {
            return {
                message: 'Request timed out. Please try again.',
                code: 'REQUEST_TIMEOUT'
            }
        }

        if (error?.code === 'ERR_NETWORK') {
            return {
                message: 'Unable to connect to L1xi servers. Please try again later.',
                code: 'SERVER_UNREACHABLE'
            }
        }

        return {
            message: this.formatErrorMessage(error),
            code: 'NETWORK_ERROR',
            details: error
        }
    }
}
