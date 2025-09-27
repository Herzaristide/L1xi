import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Check, ChevronRight, Star } from 'lucide-react';
import { ReviewService, CardService } from '@/lib/services';
import type { Card as CardType } from '@/lib/services';

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
  nextReviewAt: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [cardsQueue, setCardsQueue] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    remaining: 0,
  });

  // Load all user cards for study
  const loadAllCards = async () => {
    try {
      setLoading(true);
      const response = await CardService.getMyCards({ page: 1, limit: 200 });

      if (response.success && response.data) {
        // Convert Card[] to CardData[] format for compatibility
        const cards: CardData[] = response.data.items.map((card: CardType) => ({
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

        setCardsQueue(cards);
        setCurrentCard(cards[0] || null);
        setCurrentIndex(0);
        setSessionStats((prev) => ({
          ...prev,
          remaining: cards.length,
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

  const checkAnswer = () => {
    if (!currentCard || !userAnswer.trim()) return;

    const correctAnswer = currentCard.card.back.toLowerCase().trim();
    const userAnswerLower = userAnswer.toLowerCase().trim();
    const correct = correctAnswer === userAnswerLower;

    setIsCorrect(correct);
    setShowAnswer(true);
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAnswer) {
      checkAnswer();
    } else {
      proceedToNextCard();
    }
  };

  const proceedToNextCard = async () => {
    if (!currentCard || reviewing) return;

    try {
      setReviewing(true);

      // Determine quality based on correctness
      const quality = isCorrect ? 4 : 2;

      const response = await ReviewService.submitReview({
        cardId: currentCard.card.id,
        quality,
      });

      if (response.success) {
        // Update session stats
        setSessionStats((prev) => ({
          reviewed: prev.reviewed + 1,
          correct: isCorrect ? prev.correct + 1 : prev.correct,
          remaining: Math.max(0, prev.remaining - 1),
        }));

        // Move to next card
        const nextIndex = currentIndex + 1;
        if (nextIndex < cardsQueue.length) {
          setCurrentCard(cardsQueue[nextIndex]);
          setCurrentIndex(nextIndex);
          setShowAnswer(false);
          setUserAnswer('');
          setIsCorrect(null);
        } else {
          // No more cards, reload
          await loadAllCards();
        }
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
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

  return <div className='flex min-h-screen bg-gray-50 p-4'></div>;
}
