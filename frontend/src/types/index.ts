export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  color: string;
  isPublic: boolean;
  language: string;
  targetLang: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count?: {
    cards: number;
  };
}

export interface Card {
  id: string;
  front: string;
  back: string;
  pronunciation?: string;
  example?: string;
  notes?: string;
  imageUrl?: string;
  audioUrl?: string;
  difficulty: number;
  tags: string[];
  type?: string;
  createdAt: string;
  updatedAt: string;

  // Language support
  frontLanguage?: {
    id: string;
    name: string;
    nativeName: string;
    flag?: string;
  };
  backLanguage?: {
    id: string;
    name: string;
    nativeName: string;
    flag?: string;
  };

  // Spaced repetition data
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReviewed?: string;

  deckId: string;
  deck?: {
    id: string;
    name: string;
    language: string;
    targetLang: string;
  };
}

export interface Review {
  id: string;
  quality: number;
  timeSpent: number;
  reviewType: 'STANDARD' | 'CRAMMING' | 'LEARNING';
  createdAt: string;
  userId: string;
  cardId: string;
  card?: {
    front: string;
    deck: {
      name: string;
    };
  };
}

export interface StudySession {
  id: string;
  cardsStudied: number;
  correctCards: number;
  totalTime: number;
  averageQuality?: number;
  createdAt: string;
  completedAt?: string;
  userId: string;
  deckId?: string;
  deck?: {
    id: string;
    name: string;
  };
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } & Record<string, T[]>;
}

export interface UserStats {
  stats: {
    decksCount: number;
    cardsCount: number;
    reviewsCount: number;
    studySessionsCount: number;
    cardsDue: number;
  };
  recentActivity: Review[];
}

export interface ReviewStats {
  period: string;
  totalReviews: number;
  averageQuality: number;
  accuracy: number;
  reviewsPerDay: Array<{
    date: string;
    count: number;
  }>;
  qualityDistribution: Array<{
    quality: number;
    _count: {
      id: number;
    };
  }>;
}

export interface StudyProgress {
  period: string;
  studyStreak: number;
  totalStudyTime: number;
  cardsLearned: number;
  averageSessionTime: number;
  sessionsPerDay: Array<{
    date: string;
    sessions: number;
    cardsStudied: number;
    correctCards: number;
    totalTime: number;
  }>;
}
