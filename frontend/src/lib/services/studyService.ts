import { AxiosResponse } from 'axios';
import { api } from '../api';
import {
  ApiResponse,
  StudySession,
  PaginationParams,
  PaginatedResponse,
} from './types';

export interface StartSessionRequest {
  deckId?: string;
  cardLimit?: number;
  sessionType?: 'review' | 'learn' | 'mixed';
  difficulty?: number;
  tags?: string[];
}

export interface EndSessionRequest {
  cardsStudied: number;
  correctCards: number;
  totalTime: number; // in seconds
}

export interface GetSessionsParams extends PaginationParams {
  deckId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetProgressParams {
  period?: number; // days
  deckId?: string;
  languageId?: string;
}

export interface StudyProgress {
  totalSessions: number;
  totalCards: number;
  totalTime: number;
  averageAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  dailyGoal: number;
  dailyProgress: number;
  weeklyStats: Array<{
    date: string;
    sessions: number;
    cards: number;
    time: number;
    accuracy: number;
  }>;
}

export interface SessionResponse {
  id: string;
  startedAt: string;
  cardsToStudy: any[];
  sessionType: string;
  settings: any;
}

export class StudyService {
  /**
   * Start a new study session
   */
  static async startSession(
    sessionData: StartSessionRequest
  ): Promise<ApiResponse<SessionResponse>> {
    const response: AxiosResponse<ApiResponse<SessionResponse>> =
      await api.post('/study/session/start', sessionData);
    return response.data;
  }

  /**
   * End a study session
   */
  static async endSession(
    id: string,
    sessionData: EndSessionRequest
  ): Promise<ApiResponse<StudySession>> {
    const response: AxiosResponse<ApiResponse<StudySession>> = await api.put(
      `/study/session/${id}/end`,
      sessionData
    );
    return response.data;
  }

  /**
   * Get study sessions with optional filtering and pagination
   */
  static async getSessions(
    params?: GetSessionsParams
  ): Promise<ApiResponse<PaginatedResponse<StudySession>>> {
    const response: AxiosResponse<
      ApiResponse<PaginatedResponse<StudySession>>
    > = await api.get('/study/sessions', { params });
    return response.data;
  }

  /**
   * Get study progress statistics
   */
  static async getProgress(
    params?: GetProgressParams
  ): Promise<ApiResponse<{ progress: StudyProgress }>> {
    const response: AxiosResponse<ApiResponse<{ progress: StudyProgress }>> =
      await api.get('/study/progress', { params });
    return response.data;
  }
}
