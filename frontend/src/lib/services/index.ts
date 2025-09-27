// Export all services
export { AuthService } from './authService';
export { UserService } from './userService';
export { DeckService } from './deckService';
export { CardService } from './cardService';
export { ReviewService } from './reviewService';
export { StudyService } from './studyService';
export { LanguageService } from './languageService';

// Export types
export * from './types';

// Re-export specific request/response types
export type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  VerifyResponse,
} from './authService';
export type {
  UpdateProfileRequest,
  UpdateSubscriptionRequest,
} from './userService';
export type {
  CreateDeckRequest,
  UpdateDeckRequest,
  GetDecksParams,
  GetDeckCardsParams,
} from './deckService';
export type {
  CreateCardRequest,
  UpdateCardRequest,
  GetCardsParams,
  GetDueCardsParams,
} from './cardService';
export type {
  SubmitReviewRequest,
  GetReviewStatsParams,
  ReviewResponse,
} from './reviewService';
export type {
  StartSessionRequest,
  EndSessionRequest,
  GetSessionsParams,
  GetProgressParams,
  StudyProgress,
  SessionResponse,
} from './studyService';
export type { LanguageStats } from './languageService';
