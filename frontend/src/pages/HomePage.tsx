import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Keyboard } from '@/components/ui/Keyboard';
import {
  Check,
  Keyboard as KeyboardIcon,
  Shuffle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { ReviewService, CardService } from '@/lib/services';
import type { Card as CardType } from '@/lib/services';
import { useAuthStore } from '@/stores/authStore';

// Study mode types
type StudyMode = 'front-to-back' | 'back-to-front' | 'random';

// Language to keyboard layout mapping
const getKeyboardLayout = (languageName?: string) => {
  if (!languageName) return 'latin';

  const lang = languageName.toLowerCase();

  if (lang.includes('russian') || lang.includes('cyrillic')) {
    return 'cyrillic';
  } else if (
    lang.includes('chinese') ||
    lang.includes('mandarin') ||
    lang.includes('cantonese')
  ) {
    return 'chinese';
  } else if (lang.includes('japanese')) {
    return 'japanese';
  } else if (lang.includes('greek')) {
    return 'greek';
  } else if (lang.includes('french')) {
    return 'azerty';
  } else {
    return 'latin'; // Default to QWERTY
  }
};

interface CardData {
  id: string;
  card: {
    id: string;
    type: string;
    front: string;
    back: string;
    hint?: string;
    difficulty?: number;
    tags: string[];
    frontLanguage?: {
      name: string;
      flag: string;
    };
    backLanguage?: {
      name: string;
      flag: string;
    };
  };
  status: string;
  reviewCount: number;
  correctCount: number;
  streak?: number;
  nextReviewAt: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, token, checkAuth } = useAuthStore();
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [originalWrongAnswer, setOriginalWrongAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [cardsQueue, setCardsQueue] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studyMode, setStudyMode] = useState<StudyMode>('front-to-back');
  const [cardDirection, setCardDirection] = useState<
    'front-to-back' | 'back-to-front'
  >('front-to-back');
  const [_sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    remaining: 0,
  });

  // Determine card direction based on study mode
  const determineCardDirection = (): 'front-to-back' | 'back-to-front' => {
    switch (studyMode) {
      case 'front-to-back':
        return 'front-to-back';
      case 'back-to-front':
        return 'back-to-front';
      case 'random':
        return Math.random() > 0.5 ? 'front-to-back' : 'back-to-front';
      default:
        return 'front-to-back';
    }
  };

  // Get the question and answer based on current direction
  const getQuestionAndAnswer = () => {
    if (!currentCard)
      return {
        question: '',
        answer: '',
        questionLanguage: null,
        answerLanguage: null,
      };

    if (cardDirection === 'front-to-back') {
      return {
        question: currentCard.card.front,
        answer: currentCard.card.back,
        questionLanguage: currentCard.card.frontLanguage,
        answerLanguage: currentCard.card.backLanguage,
      };
    } else {
      return {
        question: currentCard.card.back,
        answer: currentCard.card.front,
        questionLanguage: currentCard.card.backLanguage,
        answerLanguage: currentCard.card.frontLanguage,
      };
    }
  };

  // Load all user cards for study (excluding archived)
  const loadAllCards = async () => {
    try {
      setLoading(true);

      // Check authentication first
      if (!token) {
        console.warn('No auth token found, redirecting to login');
        navigate('/auth/login');
        return;
      }

      const response = await CardService.getMyCards({
        page: 1,
        limit: 1000,
        archived: false, // Exclude archived cards
      });

      if (response.success && response.data) {
        // Convert Card[] to CardData[] format for compatibility
        const cards: CardData[] = response.data.items
          .filter((card) => !card.isArchived) // Extra filter to ensure no archived cards
          .map((card: CardType) => ({
            id: `card-${card.id}`,
            card: {
              id: card.id,
              type: card.type,
              front: card.front,
              back: card.back,
              hint: card.hint,
              difficulty: card.difficulty,
              tags: card.tags || [],
              frontLanguage: card.frontLanguage,
              backLanguage: card.backLanguage,
            },
            status: 'new', // Default status for all cards
            reviewCount: 0,
            correctCount: 0,
            nextReviewAt: new Date().toISOString(),
          }));

        // Shuffle cards for variety
        const shuffledCards = cards.sort(() => Math.random() - 0.5);

        setCardsQueue(shuffledCards);
        setCurrentCard(shuffledCards[0] || null);
        setCurrentIndex(0);

        // Set initial card direction based on study mode
        setCardDirection(determineCardDirection());

        setSessionStats((prev) => ({
          ...prev,
          remaining: shuffledCards.length,
        }));
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication status first
    const initializeAuth = async () => {
      if (!token) {
        await checkAuth();
      }

      // If still no token after auth check, redirect to login
      if (!token && !user) {
        navigate('/auth/login');
        return;
      }

      // Load cards if authenticated
      loadAllCards();
    };

    initializeAuth();
  }, [token, user, checkAuth, navigate]);

  // Real-time answer checking as user types
  useEffect(() => {
    if (!currentCard || !userAnswer.trim() || showAnswer) return;

    const correctAnswer = currentCard.card.back.toLowerCase().trim();
    const userAnswerLower = userAnswer.toLowerCase().trim();

    // Check for perfect match and auto-submit
    if (correctAnswer === userAnswerLower) {
      checkAnswer();
    }
  }, [userAnswer, currentCard, showAnswer]);

  // Handle virtual keyboard key press
  const handleKeyboardKeyPress = (key: string) => {
    if (reviewing) return;

    if (key === 'Backspace') {
      setUserAnswer((prev) => prev.slice(0, -1));
    } else if (key === 'Enter') {
      if (userAnswer.trim()) {
        handleSubmitAnswer(new Event('submit') as any);
      }
    } else if (key === ' ' || key === 'Space') {
      setUserAnswer((prev) => prev + ' ');
    } else if (key === 'Tab') {
      setUserAnswer((prev) => prev + '    '); // 4 spaces for tab
    } else if (key.length === 1) {
      // Regular character
      setUserAnswer((prev) => prev + key);
    }
  };

  const checkAnswer = () => {
    if (!currentCard || !userAnswer.trim()) return;

    const { answer: correctAnswer } = getQuestionAndAnswer();
    const correctAnswerLower = correctAnswer.toLowerCase().trim();
    const userAnswerLower = userAnswer.toLowerCase().trim();

    // Check for exact match or very close match (allowing minor typos)
    const correct =
      correctAnswerLower === userAnswerLower ||
      (Math.abs(correctAnswerLower.length - userAnswerLower.length) <= 1 &&
        userAnswerLower.includes(
          correctAnswerLower.substring(0, correctAnswerLower.length - 1)
        ));

    setIsCorrect(correct);
    setShowAnswer(true);

    // If incorrect, store the wrong answer and clear input for retype
    if (!correct) {
      setOriginalWrongAnswer(userAnswer.trim());
      setUserAnswer(''); // Clear input for retype
    }

    // Auto-advance for correct answers after a short delay
    if (correct) {
      setTimeout(() => {
        proceedToNextCard();
      }, 300); // 300ms delay to show the green success screen
    }
  };

  // Function to highlight the correct answer based on user's mistakes
  const getHighlightedAnswer = (userAnswer: string, correctAnswer: string) => {
    const userChars = userAnswer.toLowerCase().split('');
    const correctChars = correctAnswer.split('');

    return correctChars.map((char, index) => {
      const userChar = userChars[index];

      if (!userChar || userChar !== char.toLowerCase()) {
        // Character was missing or incorrect - highlight in red
        return { char, shouldHighlight: true };
      } else {
        // Character was correct
        return { char, shouldHighlight: false };
      }
    });
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!showAnswer) {
      // First phase: Check the answer
      checkAnswer();
    } else if (isCorrect) {
      // Correct answer: proceed immediately (this shouldn't be reached due to auto-advance)
      proceedToNextCard();
    } else {
      // Incorrect answer: check if the retyped answer is correct AND different
      const correctAnswer = currentCard?.card.back.toLowerCase().trim();
      const userAnswerLower = userAnswer.toLowerCase().trim();
      const originalAnswerLower = originalWrongAnswer.toLowerCase().trim();

      if (
        correctAnswer === userAnswerLower &&
        userAnswerLower !== originalAnswerLower
      ) {
        // User typed the correct answer and it's different from original, proceed to next card
        proceedToNextCard();
      }
      // If still incorrect or same as original answer, the form won't submit due to the disabled state
    }
  };

  const proceedToNextCard = async () => {
    if (!currentCard || reviewing) return;

    try {
      setReviewing(true);

      // Determine quality based on correctness (4 = easy/correct, 2 = hard/incorrect)
      const quality = isCorrect ? 4 : 2;

      try {
        const reviewResponse = await ReviewService.submitReview({
          cardId: currentCard.card.id,
          quality,
        });

        if (reviewResponse.success && reviewResponse.data) {
          console.log('Review submitted successfully:', reviewResponse.data);

          // Debug logging
          console.log('Current card before update:', currentCard);
          console.log('Review response data:', reviewResponse.data);

          // Update the current card with new review data
          setCurrentCard((prev) => {
            if (!prev || !reviewResponse.data) return prev;

            const updated = {
              ...prev,
              status: reviewResponse.data.newStatus,
              reviewCount: reviewResponse.data.reviewCount || prev.reviewCount,
              correctCount:
                reviewResponse.data.correctCount || prev.correctCount,
              nextReviewAt: reviewResponse.data.nextReviewAt,
            };

            console.log('Updated card data:', updated);
            return updated;
          });
        } else {
          console.error('Review submission failed:', reviewResponse.message);
          alert(
            'Warning: Review could not be saved. Your progress may not be tracked.'
          );
        }
      } catch (reviewError: any) {
        console.error('Failed to submit review:', reviewError);

        // Detailed error logging
        console.error('Review error details:', {
          status: reviewError.response?.status,
          statusText: reviewError.response?.statusText,
          data: reviewError.response?.data,
          message: reviewError.message,
          cardId: currentCard.card.id,
          quality,
        });

        // Show user-friendly error message
        const errorMessage =
          reviewError.response?.data?.message ||
          reviewError.message ||
          'Unable to save your progress. Please check your connection.';

        // Don't show alert for every error, just log it
        console.warn(`Review submission failed: ${errorMessage}`);

        // Handle different error types gracefully
        if (reviewError.response?.status === 401) {
          console.warn('Authentication error detected during review');
          // Check if we can refresh the auth state
          try {
            await checkAuth();
            // If auth check fails, show message but don't redirect mid-study
            if (!token) {
              alert(
                'Your session has expired. Please save your progress and log in again.'
              );
            }
          } catch (authError) {
            console.error('Failed to refresh auth:', authError);
          }
        } else if (reviewError.response?.status === 404) {
          console.warn('Card not found, skipping to next card');
        } else if (!navigator.onLine) {
          console.warn('User is offline - review will be lost');
          alert('You appear to be offline. Your progress may not be saved.');
        }
      }

      // Update session stats
      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        remaining: Math.max(0, prev.remaining - 1),
      }));

      // Reset form state
      setShowAnswer(false);
      setUserAnswer('');
      setOriginalWrongAnswer('');
      setIsCorrect(null);

      // Move to next card
      const nextIndex = currentIndex + 1;
      if (nextIndex < cardsQueue.length) {
        setCurrentCard(cardsQueue[nextIndex]);
        setCurrentIndex(nextIndex);

        // Set new direction for the next card based on study mode
        setCardDirection(determineCardDirection());
      } else {
        // Completed all cards - restart with shuffled deck
        const shuffledCards = [...cardsQueue].sort(() => Math.random() - 0.5);
        setCardsQueue(shuffledCards);
        setCurrentCard(shuffledCards[0]);
        setCurrentIndex(0);

        // Set new direction for restarted deck
        setCardDirection(determineCardDirection());

        setSessionStats((prev) => ({
          reviewed: prev.reviewed,
          correct: prev.correct,
          remaining: shuffledCards.length,
        }));
      }
    } catch (error) {
      console.error('Failed to proceed to next card:', error);
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className='w-full flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className='h-full w-full flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center'>
            <Check className='w-8 h-8 text-green-600' />
          </div>
          <h2 className='text-2xl font-bold text-gray-900'>All Caught Up!</h2>
          <p className='text-gray-600'>
            No cards to review right now. Create some cards in your library to
            start studying!
          </p>
          <Button onClick={() => navigate('/library')} className='mt-4'>
            Go to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex w-full bg-gray-50'>
      <div className='flex-1 flex flex-col items-center justify-center p-8'>
        <div className='w-full max-w-2xl'>
          {/* Study Mode Selector */}
          <div className='mb-6 flex justify-center'>
            <div className='flex bg-white rounded-lg p-1 shadow-sm border'>
              <button
                onClick={() => {
                  setStudyMode('front-to-back');
                  setCardDirection('front-to-back');
                  // Reset current card state to apply new mode immediately
                  setShowAnswer(false);
                  setUserAnswer('');
                  setIsCorrect(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  studyMode === 'front-to-back'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title='Show front, guess back'
              >
                <ArrowRight className='h-4 w-4' />
                Front → Back
              </button>
              <button
                onClick={() => {
                  setStudyMode('back-to-front');
                  setCardDirection('back-to-front');
                  // Reset current card state to apply new mode immediately
                  setShowAnswer(false);
                  setUserAnswer('');
                  setIsCorrect(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  studyMode === 'back-to-front'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title='Show back, guess front'
              >
                <ArrowLeft className='h-4 w-4' />
                Back → Front
              </button>
              <button
                onClick={() => {
                  setStudyMode('random');
                  setCardDirection(determineCardDirection());
                  // Reset current card state to apply new mode immediately
                  setShowAnswer(false);
                  setUserAnswer('');
                  setIsCorrect(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  studyMode === 'random'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title='Random direction for each card'
              >
                <Shuffle className='h-4 w-4' />
                Random
              </button>
            </div>
          </div>

          <div className='bg-white rounded-lg p-8 min-h-[400px] flex flex-col justify-center'>
            {/* Question Content */}
            <div className='text-center mb-8'>
              <h2 className='text-4xl font-bold text-gray-900 mb-4'>
                {getQuestionAndAnswer().question}
              </h2>
            </div>

            {/* Answer Section */}
            <div className='space-y-4'>
              {!showAnswer ? (
                // Input Phase
                <form onSubmit={handleSubmitAnswer} className='space-y-4'>
                  <div className='flex gap-2'>
                    <div className='flex'>
                      {currentCard.card.backLanguage && (
                        <span className='text-lg'>
                          {currentCard.card.backLanguage.flag}
                        </span>
                      )}
                    </div>
                    <Input
                      type='text'
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder='Type your answer here...'
                      className='flex w-full text-xl p-4 text-center border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300'
                      autoFocus={!showKeyboard}
                      disabled={reviewing}
                    />
                    <button
                      type='button'
                      onClick={() => setShowKeyboard(!showKeyboard)}
                      className={`flex w-10 justify-center items-center aspect-square rounded transition-colors ${
                        showKeyboard
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title='Toggle virtual keyboard'
                    >
                      <KeyboardIcon className='w-4 h-4' />
                    </button>
                  </div>

                  {/* Virtual Keyboard */}
                  {showKeyboard && (
                    <div className='mt-4'>
                      <Keyboard
                        onKeyPress={handleKeyboardKeyPress}
                        disabled={reviewing}
                        currentAlphabet={getKeyboardLayout(
                          getQuestionAndAnswer().answerLanguage?.name
                        )}
                        className='max-w-4xl mx-auto'
                      />
                    </div>
                  )}

                  <Button
                    type='submit'
                    className='w-full text-lg py-3'
                    disabled={!userAnswer.trim() || reviewing}
                  >
                    {reviewing ? 'Checking...' : 'Check Answer'}
                  </Button>
                </form>
              ) : (
                // Answer Display Phase
                <div className='w-full flex flex-col items-center space-y-4'>
                  <div>
                    <span className='font-bold text-lg'>
                      {!isCorrect && originalWrongAnswer
                        ? // Show highlighted answer for incorrect responses
                          getHighlightedAnswer(
                            originalWrongAnswer,
                            getQuestionAndAnswer().answer
                          ).map((item, index) => (
                            <span
                              key={index}
                              className={
                                item.shouldHighlight ? 'bg-red-500/50' : ''
                              }
                            >
                              {item.char}
                            </span>
                          ))
                        : // Show plain answer for correct responses
                          getQuestionAndAnswer().answer}
                    </span>
                  </div>

                  {/* Show user's incorrect answer */}
                  {!isCorrect && originalWrongAnswer && (
                    <div className='p-3  rounded-lg text-center'>
                      <div className='text-lg font-medium text-gray-700'>
                        {originalWrongAnswer}
                      </div>
                    </div>
                  )}

                  {/* Next button for all cases */}
                  <Button
                    onClick={proceedToNextCard}
                    className='w-full text-lg py-3'
                    disabled={reviewing}
                  >
                    {reviewing ? 'Processing...' : 'Next Card'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
