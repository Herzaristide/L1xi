import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Keyboard } from '@/components/ui/Keyboard';
import { Check, Keyboard as KeyboardIcon } from 'lucide-react';
import { ReviewService, CardService } from '@/lib/services';
import type { Card as CardType } from '@/lib/services';

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
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [originalWrongAnswer, setOriginalWrongAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [reviewStatus, setReviewStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [cardsQueue, setCardsQueue] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [_sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    remaining: 0,
  });

  // Load all user cards for study (excluding archived)
  const loadAllCards = async () => {
    try {
      setLoading(true);
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
    loadAllCards();
  }, []);

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

    const correctAnswer = currentCard.card.back.toLowerCase().trim();
    const userAnswerLower = userAnswer.toLowerCase().trim();

    // Check for exact match or very close match (allowing minor typos)
    const correct =
      correctAnswer === userAnswerLower ||
      (Math.abs(correctAnswer.length - userAnswerLower.length) <= 1 &&
        userAnswerLower.includes(
          correctAnswer.substring(0, correctAnswer.length - 1)
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
      }, 300); // 1.5 second delay to show the green success screen
    }
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

      // Submit review with proper error handling
      setReviewStatus('submitting');

      try {
        const reviewResponse = await ReviewService.submitReview({
          cardId: currentCard.card.id,
          quality,
        });

        if (reviewResponse.success && reviewResponse.data) {
          console.log('Review submitted successfully:', reviewResponse.data);
          setReviewStatus('success');

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
          setReviewStatus('error');
          alert(
            'Warning: Review could not be saved. Your progress may not be tracked.'
          );
        }
      } catch (reviewError: any) {
        console.error('Failed to submit review:', reviewError);
        setReviewStatus('error');

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

        // Only show critical errors to user
        if (reviewError.response?.status === 401) {
          alert('Your session has expired. Please log in again.');
          navigate('/auth/login');
          return;
        } else if (reviewError.response?.status === 404) {
          alert('Card not found. Skipping to next card.');
        } else if (!navigator.onLine) {
          console.warn('User is offline - review will be lost');
          // Could implement offline storage here
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
      setReviewStatus('idle');

      // Move to next card
      const nextIndex = currentIndex + 1;
      if (nextIndex < cardsQueue.length) {
        setCurrentCard(cardsQueue[nextIndex]);
        setCurrentIndex(nextIndex);
      } else {
        // Completed all cards - restart with shuffled deck
        const shuffledCards = [...cardsQueue].sort(() => Math.random() - 0.5);
        setCardsQueue(shuffledCards);
        setCurrentCard(shuffledCards[0]);
        setCurrentIndex(0);
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
      <div className='h-full flex items-center justify-center'>
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
          <div className='bg-white rounded-lg p-8 min-h-[400px] flex flex-col justify-center'>
            {/* Language Flag */}
            {currentCard.card.frontLanguage && (
              <div className='flex justify-center mb-4'>
                <span className='text-2xl'>
                  {currentCard.card.frontLanguage.flag}
                </span>
              </div>
            )}

            {/* Front Content */}
            <div className='text-center mb-8'>
              <h2 className='text-4xl font-bold text-gray-900 mb-4'>
                {currentCard.card.front}
              </h2>
            </div>

            {/* Answer Section */}
            <div className='space-y-4'>
              {!showAnswer ? (
                // Input Phase
                <form onSubmit={handleSubmitAnswer} className='space-y-4'>
                  <div className='relative'>
                    <Input
                      type='text'
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder='Type your answer here...'
                      className='w-full text-xl p-4 text-center border-2 border-gray-300 rounded-lg focus:border-blue-500'
                      autoFocus={!showKeyboard}
                      disabled={reviewing}
                    />
                    <div className='absolute right-12 top-1/2 transform -translate-y-1/2 flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => setShowKeyboard(!showKeyboard)}
                        className={`p-2 rounded transition-colors ${
                          showKeyboard
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title='Toggle virtual keyboard'
                      >
                        <KeyboardIcon className='w-4 h-4' />
                      </button>
                      {currentCard.card.backLanguage && (
                        <span className='text-lg'>
                          {currentCard.card.backLanguage.flag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Virtual Keyboard */}
                  {showKeyboard && (
                    <div className='mt-4'>
                      <Keyboard
                        onKeyPress={handleKeyboardKeyPress}
                        disabled={reviewing}
                        currentAlphabet={getKeyboardLayout(
                          currentCard.card.backLanguage?.name
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
                <div className='space-y-4'>
                  <div
                    className={`p-4 rounded-lg text-center text-xl ${
                      isCorrect
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}
                  >
                    <div className='font-bold mb-2'>
                      {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                    </div>
                    <div>
                      <span className='font-medium'>Correct answer: </span>
                      <span className='font-bold'>{currentCard.card.back}</span>
                    </div>
                    {!isCorrect && (
                      <div className='mt-2 text-sm'>
                        <span className='font-medium'>Your answer: </span>
                        <span>{originalWrongAnswer}</span>
                      </div>
                    )}
                  </div>

                  {isCorrect ? (
                    // Auto-advance for correct answers
                    <div className='text-center'>
                      <div className='text-green-600 text-lg font-medium mb-2'>
                        {reviewStatus === 'submitting' && 'Saving progress...'}
                        {reviewStatus === 'success' &&
                          'Progress saved! Moving to next card...'}
                        {reviewStatus === 'error' &&
                          'Great job! Moving to next card...'}
                        {reviewStatus === 'idle' &&
                          'Great job! Moving to next card...'}
                      </div>
                      <div className='animate-pulse'>
                        <LoadingSpinner size='sm' />
                      </div>
                      {reviewStatus === 'error' && (
                        <div className='text-orange-500 text-sm mt-2'>
                          ⚠️ Progress not saved - check connection
                        </div>
                      )}
                    </div>
                  ) : (
                    // Require retyping for incorrect answers
                    <form onSubmit={handleSubmitAnswer} className='space-y-4'>
                      <div className='text-center text-gray-700 font-medium'>
                        Please type the correct answer (different from your
                        first attempt) to continue:
                      </div>
                      <Input
                        type='text'
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder='Type the correct answer...'
                        className='w-full text-xl p-4 text-center border-2 border-gray-300 rounded-lg focus:border-blue-500'
                        autoFocus={!showKeyboard}
                        disabled={reviewing}
                      />

                      {/* Virtual Keyboard for retype phase */}
                      {showKeyboard && (
                        <div className='mt-4'>
                          <Keyboard
                            onKeyPress={handleKeyboardKeyPress}
                            disabled={reviewing}
                            currentAlphabet={getKeyboardLayout(
                              currentCard.card.backLanguage?.name
                            )}
                            className='max-w-4xl mx-auto'
                          />
                        </div>
                      )}
                      {userAnswer.toLowerCase().trim() ===
                        originalWrongAnswer.toLowerCase().trim() &&
                        userAnswer.trim() && (
                          <div className='text-sm text-orange-600 text-center'>
                            ⚠️ Please enter a different answer than your first
                            attempt
                          </div>
                        )}
                      <Button
                        type='submit'
                        className='w-full text-lg py-3'
                        disabled={
                          userAnswer.toLowerCase().trim() !==
                            currentCard.card.back.toLowerCase().trim() ||
                          userAnswer.toLowerCase().trim() ===
                            originalWrongAnswer.toLowerCase().trim() ||
                          reviewing
                        }
                      >
                        {reviewing ? 'Processing...' : 'Continue'}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
