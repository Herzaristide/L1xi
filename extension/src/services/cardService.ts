import { AuthStorage } from '@/utils/storage'
import { ErrorHandler } from '@/utils/errorHandler'
import config from '@/config'

const API_BASE_URL = config.api.baseUrl

export interface CreateCardFromTextRequest {
    selectedText: string
    sourceUrl?: string
    sourceTitle?: string
    frontLanguageId?: string
    backLanguageId?: string
    deckId?: string
}

export interface Card {
    id: string
    type: string
    front: string
    back: string
    hint?: string
    difficulty?: number
    tags?: string[]
    frontLanguageId?: string
    backLanguageId?: string
    deckId?: string
    createdAt: string
    updatedAt: string
}

export class CardService {
    /**
     * Create a card from selected text
     */
    static async createCardFromText(data: CreateCardFromTextRequest): Promise<Card> {
        try {
            console.log('[CardService] Creating card from selected text:', data.selectedText)

            const auth = await AuthStorage.getAuth()
            if (!auth?.token) {
                throw new Error('Authentication required')
            }

            // Prepare card data - using selected text as front, leaving back empty for user to fill
            const cardData = {
                type: 'TRANSLATION', // Default type
                front: data.selectedText.trim(),
                back: '', // User will fill this later
                hint: data.sourceUrl ? `Source: ${data.sourceTitle || data.sourceUrl}` : undefined,
                frontLanguageId: data.frontLanguageId || 'en', // Default to English
                backLanguageId: data.backLanguageId,
                tags: data.sourceUrl ? ['web-selection'] : undefined,
                deckId: data.deckId,
                difficulty: 1
            }

            const response = await fetch(`${API_BASE_URL}/cards/from-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify(cardData)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(
                    errorData.message || `HTTP ${response.status}: ${response.statusText}`
                )
            }

            const result = await response.json()
            console.log('[CardService] Card created successfully:', result.data)

            return result.data
        } catch (error) {
            console.error('[CardService] Error creating card from text:', error)
            throw error instanceof Error ? error : new Error(ErrorHandler.formatErrorMessage(error))
        }
    }

    /**
     * Create multiple cards from bulk text
     */
    static async createBulkCards(cardsData: any[]): Promise<Card[]> {
        try {
            console.log('[CardService] Creating bulk cards:', cardsData.length)

            const auth = await AuthStorage.getAuth()
            if (!auth?.token) {
                throw new Error('Authentication required')
            }

            const response = await fetch(`${API_BASE_URL}/cards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify(cardsData)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(
                    errorData.message || `HTTP ${response.status}: ${response.statusText}`
                )
            }

            const result = await response.json()
            console.log('[CardService] Bulk cards created successfully')

            return result.data
        } catch (error) {
            console.error('[CardService] Error creating bulk cards:', error)
            throw error instanceof Error ? error : new Error(ErrorHandler.formatErrorMessage(error))
        }
    }
}
