import { AxiosResponse } from 'axios';
import { api } from '../api';
import { ApiResponse, Language } from './types';

export interface LanguageStats {
  totalUsers: number;
  totalDecks: number;
  totalCards: number;
  averageRating: number;
  popularTags: string[];
}

export class LanguageService {
  /**
   * Get all available languages
   */
  static async getLanguages(): Promise<ApiResponse<Language[]>> {
    const response: AxiosResponse<ApiResponse<Language[]>> = await api.get(
      '/languages'
    );
    return response.data;
  }

  /**
   * Get single language by ID
   */
  static async getLanguage(id: string): Promise<ApiResponse<Language>> {
    const response: AxiosResponse<ApiResponse<Language>> = await api.get(
      `/languages/${id}`
    );
    return response.data;
  }

  /**
   * Get language statistics
   */
  static async getLanguageStats(
    id: string
  ): Promise<ApiResponse<LanguageStats>> {
    const response: AxiosResponse<ApiResponse<LanguageStats>> = await api.get(
      `/languages/${id}/stats`
    );
    return response.data;
  }
}
