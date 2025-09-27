import { AxiosResponse } from 'axios';
import { api } from '../api';
import {
  ApiResponse,
  Deck,
  Card,
  PaginationParams,
  PaginatedResponse,
} from './types';

export interface CreateDeckRequest {
  title: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  frontLanguageId?: string;
  backLanguageId?: string;
}

export interface UpdateDeckRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  frontLanguageId?: string;
  backLanguageId?: string;
}

export interface GetDecksParams extends PaginationParams {
  userId?: string;
  languageId?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface GetDeckCardsParams extends PaginationParams {
  status?: string;
  difficulty?: number;
  tags?: string[];
}

export class DeckService {
  /**
   * Get all decks with optional filtering and pagination
   */
  static async getDecks(
    params?: GetDecksParams
  ): Promise<ApiResponse<PaginatedResponse<Deck>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Deck>>> =
      await api.get('/decks', { params });
    return response.data;
  }

  /**
   * Get single deck by ID
   */
  static async getDeck(id: string): Promise<ApiResponse<Deck>> {
    const response: AxiosResponse<ApiResponse<Deck>> = await api.get(
      `/decks/${id}`
    );
    return response.data;
  }

  /**
   * Create new deck
   */
  static async createDeck(
    deckData: CreateDeckRequest
  ): Promise<ApiResponse<Deck>> {
    const response: AxiosResponse<ApiResponse<Deck>> = await api.post(
      '/decks',
      deckData
    );
    return response.data;
  }

  /**
   * Update existing deck
   */
  static async updateDeck(
    id: string,
    deckData: UpdateDeckRequest
  ): Promise<ApiResponse<Deck>> {
    const response: AxiosResponse<ApiResponse<Deck>> = await api.put(
      `/decks/${id}`,
      deckData
    );
    return response.data;
  }

  /**
   * Delete deck
   */
  static async deleteDeck(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(
      `/decks/${id}`
    );
    return response.data;
  }

  /**
   * Get cards in a deck
   */
  static async getDeckCards(
    id: string,
    params?: GetDeckCardsParams
  ): Promise<ApiResponse<PaginatedResponse<Card>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Card>>> =
      await api.get(`/decks/${id}/cards`, { params });
    return response.data;
  }
}
