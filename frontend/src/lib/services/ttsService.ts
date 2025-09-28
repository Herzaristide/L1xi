import { api } from '../api';

export interface TTSResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface TTSLanguage {
  code: string;
  name: string;
}

export interface TTSLanguagesResponse {
  success: boolean;
  data: TTSLanguage[];
}

export class TTSService {
  /**
   * Generate TTS audio for a specific card side
   */
  static async generateCardTTS(
    cardId: string,
    side: 'front' | 'back' = 'front'
  ): Promise<Blob> {
    try {
      const response = await api.post(
        `/tts/card/${cardId}/tts`,
        { side },
        {
          responseType: 'blob',
          headers: {
            Accept: 'audio/mpeg',
          },
        }
      );

      if (response.data.size === 0) {
        throw new Error('Received empty audio response');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to generate card TTS:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to generate audio for card'
      );
    }
  }

  /**
   * Generate TTS audio for arbitrary text
   */
  static async generateTextTTS(
    text: string,
    language: string = 'en'
  ): Promise<Blob> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text is required for TTS generation');
      }

      if (text.length > 500) {
        throw new Error('Text is too long (maximum 500 characters)');
      }

      const response = await api.post(
        '/tts/tts',
        { text: text.trim(), language },
        {
          responseType: 'blob',
          headers: {
            Accept: 'audio/mpeg',
          },
        }
      );

      if (response.data.size === 0) {
        throw new Error('Received empty audio response');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to generate text TTS:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to generate audio for text'
      );
    }
  }

  /**
   * Get list of supported TTS languages
   */
  static async getSupportedLanguages(): Promise<TTSLanguagesResponse> {
    try {
      const response = await api.get<TTSLanguagesResponse>('/tts/languages');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch TTS languages:', error);
      return {
        success: false,
        data: [],
      };
    }
  }

  /**
   * Play audio from blob data
   */
  static async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Failed to play audio'));
        };

        audio.play().catch(() => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Browser blocked audio playback'));
        });
      } catch (error) {
        reject(new Error('Failed to create audio from response'));
      }
    });
  }

  /**
   * Generate and immediately play TTS for a card
   */
  static async playCardTTS(
    cardId: string,
    side: 'front' | 'back' = 'front'
  ): Promise<void> {
    try {
      const audioBlob = await this.generateCardTTS(cardId, side);
      await this.playAudio(audioBlob);
    } catch (error) {
      console.error('Failed to play card TTS:', error);
      throw error;
    }
  }

  /**
   * Generate and immediately play TTS for text
   */
  static async playTextTTS(
    text: string,
    language: string = 'en'
  ): Promise<void> {
    try {
      const audioBlob = await this.generateTextTTS(text, language);
      await this.playAudio(audioBlob);
    } catch (error) {
      console.error('Failed to play text TTS:', error);
      throw error;
    }
  }

  /**
   * Check if TTS is supported in the current browser
   */
  static isTTSSupported(): boolean {
    return typeof Audio !== 'undefined' && typeof URL !== 'undefined';
  }

  /**
   * Download audio file from blob
   */
  static downloadAudio(audioBlob: Blob, filename: string = 'audio.mp3'): void {
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error('Failed to download audio:', error);
      throw new Error('Failed to download audio file');
    }
  }
}

export default TTSService;
