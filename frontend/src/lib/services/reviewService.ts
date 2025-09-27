import { AxiosResponse } from 'axios';
import { api } from '../api';
import { ApiResponse, ReviewStats } from './types';

export interface SubmitReviewRequest {
  cardId: string;
  quality: number; // 1-5 rating
  timeSpent?: number; // in seconds
  sessionId?: string;
}

export interface GetReviewStatsParams {
  period?: number; // days
  deckId?: string;
  languageId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReviewResponse {
  id: string;
  quality: number;
  timeSpent: number;
  newStatus: string;
  newInterval: number;
  nextReviewAt: string;
  streakUpdated: boolean;
  easeFactor: number;
}

export class ReviewService {
  /**
   * Submit a card review
   */
  static async submitReview(
    reviewData: SubmitReviewRequest
  ): Promise<ApiResponse<ReviewResponse>> {
    const response: AxiosResponse<ApiResponse<ReviewResponse>> = await api.post(
      '/reviews',
      reviewData
    );
    return response.data;
  }

  /**
   * Get cards due for review (alternative endpoint)
   */
  static async getDueCards(params?: {
    limit?: number;
  }): Promise<ApiResponse<{ cards: any[] }>> {
    const response: AxiosResponse<ApiResponse<{ cards: any[] }>> =
      await api.get('/reviews/due', { params });
    return response.data;
  }

  /**
   * Get review statistics
   */
  static async getStats(
    params?: GetReviewStatsParams
  ): Promise<ApiResponse<{ stats: ReviewStats }>> {
    const response: AxiosResponse<ApiResponse<{ stats: ReviewStats }>> =
      await api.get('/reviews/stats', { params });
    return response.data;
  }
}
