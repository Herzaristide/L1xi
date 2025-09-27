import { AxiosResponse } from 'axios';
import { api } from '../api';
import {
  ApiResponse,
  Card,
  ReviewCard,
  PaginationParams,
  PaginatedResponse,
} from './types';

export interface CreateCardRequest {
  deckId?: string; // Made optional - each card can specify its own deck
  type: string;
  front: string;
  back: string;
  hint?: string;
  pronunciation?: string;
  example?: string;
  notes?: string;
  difficulty?: number;
  tags?: string[];
  frontLanguageId?: string;
  backLanguageId?: string;
}

export interface UpdateCardRequest {
  type?: string;
  front?: string;
  back?: string;
  hint?: string;
  pronunciation?: string;
  example?: string;
  notes?: string;
  difficulty?: number;
  tags?: string[];
  frontLanguageId?: string;
  backLanguageId?: string;
  isArchived?: boolean;
}

export interface GetCardsParams extends PaginationParams {
  deckId?: string;
  type?: string;
  difficulty?: number;
  tags?: string[];
  languageId?: string;
  archived?: boolean;
}

export interface GetDueCardsParams {
  limit?: number;
  deckId?: string;
  languageId?: string;
  difficulty?: number;
}

export class CardService {
  /**
   * Get user's own cards with optional filtering and pagination
   */
  static async getMyCards(
    params?: GetCardsParams
  ): Promise<ApiResponse<PaginatedResponse<Card>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Card>>> =
      await api.get('/cards/my', { params });
    return response.data;
  }

  /**
   * Get all cards with optional filtering and pagination
   */
  static async getCards(
    params?: GetCardsParams
  ): Promise<ApiResponse<PaginatedResponse<Card>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Card>>> =
      await api.get('/cards', { params });
    return response.data;
  }

  /**
   * Get single card by ID
   */
  static async getCard(id: string): Promise<ApiResponse<Card>> {
    const response: AxiosResponse<ApiResponse<Card>> = await api.get(
      `/cards/${id}`
    );
    return response.data;
  }

  /**
   * Create multiple cards (bulk creation)
   */
  static async createCards(
    cardsData: CreateCardRequest[]
  ): Promise<ApiResponse<{ cards: Card[]; count: number }>> {
    const response: AxiosResponse<
      ApiResponse<{ cards: Card[]; count: number }>
    > = await api.post('/cards', cardsData);
    return response.data;
  }

  /**
   * Create single card (convenience method - uses bulk creation internally)
   */
  static async createCard(
    cardData: CreateCardRequest
  ): Promise<ApiResponse<Card>> {
    const response = await this.createCards([cardData]);
    return {
      ...response,
      data: response.data.cards[0],
    };
  }

  /**
   * Update existing card
   */
  static async updateCard(
    id: string,
    cardData: UpdateCardRequest
  ): Promise<ApiResponse<Card>> {
    const response: AxiosResponse<ApiResponse<Card>> = await api.put(
      `/cards/${id}`,
      cardData
    );
    return response.data;
  }

  /**
   * Delete card
   */
  static async deleteCard(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(
      `/cards/${id}`
    );
    return response.data;
  }

  /**
   * Archive card
   */
  static async archiveCard(id: string): Promise<ApiResponse<Card>> {
    const response: AxiosResponse<ApiResponse<Card>> = await api.put(
      `/cards/${id}`,
      { isArchived: true }
    );
    return response.data;
  }

  /**
   * Unarchive card
   */
  static async unarchiveCard(id: string): Promise<ApiResponse<Card>> {
    const response: AxiosResponse<ApiResponse<Card>> = await api.put(
      `/cards/${id}`,
      { isArchived: false }
    );
    return response.data;
  }

  /**
   * Get cards due for review
   */
  static async getDueCards(
    params?: GetDueCardsParams
  ): Promise<ApiResponse<{ cards: ReviewCard[] }>> {
    const response: AxiosResponse<ApiResponse<{ cards: ReviewCard[] }>> =
      await api.get('/cards/review/due', { params });
    return response.data;
  }
}
