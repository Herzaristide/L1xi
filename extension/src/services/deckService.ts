import { AuthStorage } from '@/utils/storage'
import { ErrorHandler } from '@/utils/errorHandler'
import config from '@/config'

const API_BASE_URL = config.api.baseUrl

export interface Deck {
    id: string
    name: string
    description?: string
    cardCount: number
    isPublic: boolean
    createdAt: string
    updatedAt: string
}

export interface DeckStats {
    totalDecks: number
    totalCards: number
    studiedToday: number
    streak: number
}

export class DeckService {
    /**
     * Get user's decks
     */
    static async getUserDecks(): Promise<Deck[]> {
        try {
            const authState = await AuthStorage.getAuth()
            if (!authState?.token) {
                throw new Error('No authentication token')
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), config.api.timeout)

            const response = await fetch(`${API_BASE_URL}/decks`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authState.token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error('Failed to fetch decks')
            }

            const data = await response.json()
            return data.data || []
        } catch (error) {
            ErrorHandler.logError('Get User Decks', error)
            return []
        }
    }

    /**
     * Get user's deck statistics
     */
    static async getDeckStats(): Promise<DeckStats> {
        try {
            const authState = await AuthStorage.getAuth()
            if (!authState?.token) {
                throw new Error('No authentication token')
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), config.api.timeout)

            const response = await fetch(`${API_BASE_URL}/users/stats`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authState.token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error('Failed to fetch stats')
            }

            const data = await response.json()
            return (
                data.data || {
                    totalDecks: 0,
                    totalCards: 0,
                    studiedToday: 0,
                    streak: 0
                }
            )
        } catch (error) {
            ErrorHandler.logError('Get Deck Stats', error)
            return {
                totalDecks: 0,
                totalCards: 0,
                studiedToday: 0,
                streak: 0
            }
        }
    }
}
