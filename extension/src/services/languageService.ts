import { AuthStorage } from '@/utils/storage'
import config from '@/config'

const API_BASE_URL = config.api.baseUrl

export interface Language {
    id: string
    name: string
    nativeName: string
    flag: string
    code: string
}

export class LanguageService {
    /**
     * Get all available languages
     */
    static async getLanguages(): Promise<Language[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/languages`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch languages')
            }

            const data = await response.json()
            return data.data || []
        } catch (error) {
            console.error('Error fetching languages:', error)
            // Return fallback languages if API fails
            return [
                { id: '1', name: 'English', nativeName: 'English', flag: '🇺🇸', code: 'en' },
                { id: '2', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', code: 'es' },
                { id: '3', name: 'French', nativeName: 'Français', flag: '🇫🇷', code: 'fr' },
                { id: '4', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', code: 'de' },
                { id: '5', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', code: 'it' },
                { id: '6', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', code: 'pt' },
                { id: '7', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', code: 'ja' },
                { id: '8', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', code: 'zh' },
                { id: '9', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', code: 'ko' },
                { id: '10', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', code: 'ru' }
            ]
        }
    }
}
