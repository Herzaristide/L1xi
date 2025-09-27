// Common API types and interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Language {
  id: string;
  name: string;
  code: string;
  flag: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  nativeLanguage?: Language;
  learningLanguage?: Language;
  subscriptionType?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  tags: string[];
  cardCount: number;
  studyCount: number;
  averageRating?: number;
  frontLanguage?: Language;
  backLanguage?: Language;
  author?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  type: string;
  front: string;
  back: string;
  hint?: string;
  pronunciation?: string;
  example?: string;
  notes?: string;
  difficulty?: number;
  tags: string[];
  deck?: Deck;
  frontLanguage?: Language;
  backLanguage?: Language;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCard {
  id: string;
  card: Card;
  status: string;
  reviewCount: number;
  correctCount: number;
  streak: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: string;
  lastReviewAt?: string;
}

export interface StudySession {
  id: string;
  cardsStudied: number;
  correctCards: number;
  totalTime: number;
  startedAt: string;
  endedAt?: string;
  deck?: Deck;
}

export interface ReviewStats {
  totalReviews: number;
  correctReviews: number;
  accuracy: number;
  averageTime: number;
  statusCounts: Record<string, number>;
  dailyStats?: Array<{
    date: string;
    reviews: number;
    correct: number;
  }>;
}

export interface UserStats {
  totalCards: number;
  totalDecks: number;
  studyStreak: number;
  totalStudyTime: number;
  accuracyRate: number;
  reviewsToday: number;
  cardsLearned: number;
  cardsMastered: number;
}
