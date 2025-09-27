import { useState, useEffect, useRef } from 'react';
import { Card as CardType } from '@/lib/services/types';
import {
  Volume2,
  RotateCcw,
  Archive,
  Trash2,
  TrendingUp,
  Check,
} from 'lucide-react';
import { LanguageFlag } from './LanguageFlag';
import { CardService, TTSService } from '@/lib/services';

// FlipCard Component Interface
interface FlipCardProps {
  card: CardType;
  className?: string;
  onClick?: () => void;
  onArchive?: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
  onUpdate?: (cardId: string, updatedCard: Partial<CardType>) => void;
  // Selection props
  isSelected?: boolean;
  onToggleSelection?: (cardId: string) => void;
}

// Card Statistics Interface
interface CardStats {
  reviewCount: number;
  correctCount: number;
  streak: number;
  accuracy: number;
  status: string;
  nextReviewAt?: string;
  lastReviewedAt?: string;
  easeFactor: number;
  interval: number;
}

function FlipCard({
  card,
  onClick,
  onArchive,
  onDelete,
  onUpdate,
  isSelected = false,
  onToggleSelection,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShowingStats, setIsShowingStats] = useState(false);
  const [cardStats, setCardStats] = useState<CardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [editText, setEditText] = useState(card.back);
  const [frontEditText, setFrontEditText] = useState(card.front);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const frontSaveTimeoutRef = useRef<number | null>(null);
  const [playingTTS, setPlayingTTS] = useState<'front' | 'back' | null>(null);

  // Handle TTS playback
  const handlePlayTTS = async (side: 'front' | 'back') => {
    if (playingTTS) return; // Prevent multiple simultaneous playbacks

    try {
      setPlayingTTS(side);
      await TTSService.playCardTTS(card.id, side);
    } catch (error) {
      console.error('Failed to play TTS:', error);
      // Could show a toast notification here
    } finally {
      setPlayingTTS(null);
    }
  };

  // Calculate dynamic rows based on content
  const calculateRows = (text: string) => {
    const lines = text.split('\n').length;
    const charsPerLine = 30; // Approximate chars per line for text-2xl
    const estimatedLines = Math.ceil(text.length / charsPerLine);
    return Math.max(1, Math.max(lines, estimatedLines));
  };

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Auto-resize front textarea when content changes
  useEffect(() => {
    if (frontTextareaRef.current) {
      autoResizeTextarea(frontTextareaRef.current);
    }
  }, [frontEditText]);

  // Auto-resize back textarea when content changes
  useEffect(() => {
    if (textareaRef.current) {
      autoResizeTextarea(textareaRef.current);
    }
  }, [editText]);

  // Auto-save functionality with debounce for back
  const autoSave = async (text: string) => {
    if (text.trim() === '' || text === card.back) return;

    try {
      const response = await CardService.updateCard(card.id, {
        back: text.trim(),
      });
      if (response.success && response.data) {
        onUpdate?.(card.id, { back: text.trim() });
      }
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  // Auto-save functionality with debounce for front
  const autoSaveFront = async (text: string) => {
    if (text.trim() === '' || text === card.front) return;

    try {
      const response = await CardService.updateCard(card.id, {
        front: text.trim(),
      });
      if (response.success && response.data) {
        onUpdate?.(card.id, { front: text.trim() });
      }
    } catch (error) {
      console.error('Error updating card front:', error);
    }
  };

  // Handle text change with auto-save debounce for back
  const handleTextChange = (newText: string) => {
    setEditText(newText);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (500ms delay)
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newText);
    }, 500);
  };

  // Handle front text change with auto-save debounce
  const handleFrontTextChange = (newText: string) => {
    setFrontEditText(newText);

    // Clear existing timeout
    if (frontSaveTimeoutRef.current) {
      clearTimeout(frontSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (500ms delay)
    frontSaveTimeoutRef.current = setTimeout(() => {
      autoSaveFront(newText);
    }, 500);
  };

  // Fetch card statistics
  const fetchCardStats = async () => {
    if (loadingStats || cardStats) return; // Don't fetch if already loading or loaded

    setLoadingStats(true);
    try {
      // Since there's no direct card stats endpoint, we'll use the due cards endpoint
      // which includes UserCardStatus information
      const response = await CardService.getDueCards({ limit: 1000 });

      if (response.success && response.data) {
        // Find the specific card in the response
        const cardReview = response.data.cards.find(
          (reviewCard: any) => reviewCard.card.id === card.id
        );

        if (cardReview) {
          const stats: CardStats = {
            reviewCount: cardReview.reviewCount || 0,
            correctCount: cardReview.correctCount || 0,
            streak: cardReview.streak || 0,
            accuracy:
              cardReview.reviewCount > 0
                ? Math.round(
                    (cardReview.correctCount / cardReview.reviewCount) * 100
                  )
                : 0,
            status: cardReview.status || 'NEW',
            nextReviewAt: cardReview.nextReviewAt,
            lastReviewedAt: cardReview.lastReviewAt,
            easeFactor: cardReview.easeFactor || 2.5,
            interval: cardReview.interval || 1,
          };
          setCardStats(stats);
        } else {
          // Card not found in due cards, create default stats
          setCardStats({
            reviewCount: 0,
            correctCount: 0,
            streak: 0,
            accuracy: 0,
            status: 'NEW',
            easeFactor: 2.5,
            interval: 1,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching card stats:', error);
      // Set default stats on error
      setCardStats({
        reviewCount: 0,
        correctCount: 0,
        streak: 0,
        accuracy: 0,
        status: 'NEW',
        easeFactor: 2.5,
        interval: 1,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle stats button click
  const handleStatsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isShowingStats) {
      await fetchCardStats();
    }
    setIsShowingStats(!isShowingStats);
    setIsFlipped(false); // Exit flip mode when showing stats
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (frontSaveTimeoutRef.current) {
        clearTimeout(frontSaveTimeoutRef.current);
      }
    };
  }, []);

  // Reset stats when card changes
  useEffect(() => {
    setCardStats(null);
    setIsShowingStats(false);
  }, [card.id]);

  const handleCardClick = () => {
    if (isShowingStats) {
      setIsShowingStats(false); // Exit stats view
      return;
    }
    setIsFlipped(!isFlipped);
    onClick?.();
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editText.trim() === '' || editText === card.back) {
      return;
    }

    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    try {
      const response = await CardService.updateCard(card.id, {
        back: editText.trim(),
      });
      if (response.success && response.data) {
        onUpdate?.(card.id, { back: editText.trim() });
      }
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const handleFrontSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (frontEditText.trim() === '' || frontEditText === card.front) {
      return;
    }

    // Clear any pending auto-save
    if (frontSaveTimeoutRef.current) {
      clearTimeout(frontSaveTimeoutRef.current);
    }

    try {
      const response = await CardService.updateCard(card.id, {
        front: frontEditText.trim(),
      });
      if (response.success && response.data) {
        onUpdate?.(card.id, { front: frontEditText.trim() });
      }
    } catch (error) {
      console.error('Error updating card front:', error);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setEditText(card.back);
  };

  const handleFrontCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Clear any pending auto-save
    if (frontSaveTimeoutRef.current) {
      clearTimeout(frontSaveTimeoutRef.current);
    }
    setFrontEditText(card.front);
  };

  return (
    <div className={'flashcard w-full h-40'}>
      {isShowingStats ? (
        // Stats View
        <div className='w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-blue-200 p-4'>
          <div className='h-full flex flex-col'>
            {/* Stats Header */}
            <div className='flex justify-between items-center mb-3'>
              <h3 className='font-semibold text-blue-900'>Card Statistics</h3>
              <button
                onClick={handleStatsClick}
                className='p-1 hover:bg-blue-200 rounded text-blue-700'
                title='Close statistics'
              >
                <RotateCcw className='h-4 w-4' />
              </button>
            </div>

            {/* Stats Content */}
            {loadingStats ? (
              <div className='flex-1 flex items-center justify-center'>
                <div className='text-blue-600'>Loading stats...</div>
              </div>
            ) : cardStats ? (
              <div className='flex-1 grid grid-cols-2 gap-3 text-sm'>
                {/* Review Count */}
                <div className='bg-white rounded-lg p-2 border border-blue-200'>
                  <div className='text-xs text-gray-600 uppercase tracking-wide'>
                    Reviews
                  </div>
                  <div className='text-lg font-bold text-blue-900'>
                    {cardStats.reviewCount}
                  </div>
                </div>

                {/* Accuracy */}
                <div className='bg-white rounded-lg p-2 border border-blue-200'>
                  <div className='text-xs text-gray-600 uppercase tracking-wide'>
                    Accuracy
                  </div>
                  <div className='text-lg font-bold text-green-600'>
                    {cardStats.accuracy}%
                  </div>
                </div>

                {/* Status */}
                <div className='bg-white rounded-lg p-2 border border-blue-200'>
                  <div className='text-xs text-gray-600 uppercase tracking-wide'>
                    Status
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      cardStats.status === 'MASTERED'
                        ? 'text-green-600'
                        : cardStats.status === 'LEARNING'
                        ? 'text-yellow-600'
                        : cardStats.status === 'REVIEW'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {cardStats.status}
                  </div>
                </div>

                {/* Streak */}
                <div className='bg-white rounded-lg p-2 border border-blue-200'>
                  <div className='text-xs text-gray-600 uppercase tracking-wide'>
                    Streak
                  </div>
                  <div className='text-lg font-bold text-orange-600'>
                    {cardStats.streak}
                  </div>
                </div>

                {/* Next Review */}
                {cardStats.nextReviewAt && (
                  <div className='col-span-2 bg-white rounded-lg p-2 border border-blue-200'>
                    <div className='text-xs text-gray-600 uppercase tracking-wide mb-1'>
                      Next Review
                    </div>
                    <div className='text-sm text-gray-800'>
                      {new Date(cardStats.nextReviewAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Advanced Stats */}
                <div className='col-span-2 bg-white rounded-lg p-2 border border-blue-200'>
                  <div className='text-xs text-gray-600 uppercase tracking-wide mb-1'>
                    Advanced
                  </div>
                  <div className='flex justify-between text-xs'>
                    <span>
                      Ease Factor:{' '}
                      <strong>{cardStats.easeFactor.toFixed(2)}</strong>
                    </span>
                    <span>
                      Interval: <strong>{cardStats.interval} days</strong>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className='flex-1 flex items-center justify-center'>
                <div className='text-gray-500'>No stats available</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Normal Card View
        <div
          className={`flashcard-inner ${isFlipped && 'flipped'}`}
          onClick={handleCardClick}
        >
          {/* Front Side */}
          <div className='flashcard-face'>
            <div className='w-full h-full flex flex-col justify-between p-0'>
              {/* Header */}
              <div className='flex justify-between items-start mb-4'>
                <div className='flex items-center gap-2'>
                  {/* Selection Checkbox */}
                  {onToggleSelection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelection(card.id);
                      }}
                      className='w-5 h-5 rounded bg-white shadow-sm border-2 border-gray-200 flex items-center justify-center hover:border-primary-400 transition-colors'
                      title={isSelected ? 'Deselect card' : 'Select card'}
                    >
                      {isSelected && (
                        <Check className='h-3 w-3 text-primary-600' />
                      )}
                    </button>
                  )}
                  <LanguageFlag language={card.frontLanguage} />
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    className={`p-1 hover:bg-gray-100 rounded transition-colors ${
                      playingTTS === 'front' ? 'bg-blue-100 text-blue-600' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayTTS('front');
                    }}
                    disabled={playingTTS !== null}
                    title={
                      playingTTS === 'front'
                        ? 'Playing...'
                        : 'Play pronunciation'
                    }
                  >
                    <Volume2
                      className={`h-4 w-4 ${
                        playingTTS === 'front'
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                  <button
                    className={`p-1 hover:bg-gray-100 rounded transition-colors ${
                      isShowingStats
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600'
                    }`}
                    onClick={handleStatsClick}
                    title='View card statistics'
                    disabled={loadingStats}
                  >
                    <TrendingUp className='h-4 w-4' />
                  </button>
                  {onArchive && (
                    <button
                      className='p-1 hover:bg-gray-100 rounded transition-colors'
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(card.id);
                      }}
                      title={
                        card.isArchived ? 'Unarchive card' : 'Archive card'
                      }
                    >
                      <Archive className='h-4 w-4 text-gray-600' />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className='p-1 hover:bg-red-100 rounded transition-colors group'
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(card.id);
                      }}
                      title='Delete card'
                    >
                      <Trash2 className='h-4 w-4 text-gray-600 group-hover:text-red-600' />
                    </button>
                  )}
                  <RotateCcw className='h-3 w-3 text-gray-400' />
                </div>
              </div>

              {/* Main Content */}
              <div className='flex-grow flex items-center justify-center'>
                <div className='text-center w-full'>
                  <div className='w-full max-w-xs mx-auto'>
                    <textarea
                      ref={frontTextareaRef}
                      value={frontEditText}
                      onChange={(e) => {
                        handleFrontTextChange(e.target.value);
                        autoResizeTextarea(e.target);
                      }}
                      className='w-full text-2xl font-semibold text-gray-900 mb-2 break-words resize-none text-center focus:outline-none border-none bg-transparent overflow-hidden min-h-[2.5rem]'
                      placeholder='Enter card front text...'
                      title='Edit card front text'
                      onClick={(e) => e.stopPropagation()}
                      onInput={(e) =>
                        autoResizeTextarea(e.target as HTMLTextAreaElement)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleFrontSave(e as any);
                        }
                        if (e.key === 'Escape') {
                          handleFrontCancel(e as any);
                        }
                      }}
                    />
                  </div>
                  {card.pronunciation && (
                    <p className='text-sm text-gray-600 italic'>
                      /{card.pronunciation}/
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div className='flashcard-face flashcard-back bg-blue-50 border-blue-200'>
            <div className='w-full h-full flex flex-col justify-between p-0'>
              {/* Header */}
              <div className='flex justify-between items-start mb-4'>
                <div className='flex items-center gap-2'>
                  {/* Selection Checkbox */}
                  {onToggleSelection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelection(card.id);
                      }}
                      className='w-5 h-5 rounded bg-white shadow-sm border-2 border-gray-200 flex items-center justify-center hover:border-primary-400 transition-colors'
                      title={isSelected ? 'Deselect card' : 'Select card'}
                    >
                      {isSelected && (
                        <Check className='h-3 w-3 text-primary-600' />
                      )}
                    </button>
                  )}
                  {card.backLanguage && (
                    <LanguageFlag language={card.backLanguage} size='sm' />
                  )}
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    className={`p-1 hover:bg-blue-100 rounded transition-colors ${
                      playingTTS === 'back' ? 'bg-blue-200 text-blue-700' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayTTS('back');
                    }}
                    disabled={playingTTS !== null}
                    title={
                      playingTTS === 'back'
                        ? 'Playing...'
                        : 'Play pronunciation'
                    }
                  >
                    <Volume2
                      className={`h-4 w-4 ${
                        playingTTS === 'back'
                          ? 'text-blue-700'
                          : 'text-blue-600'
                      }`}
                    />
                  </button>
                  <button
                    className={`p-1 hover:bg-blue-100 rounded transition-colors ${
                      isShowingStats
                        ? 'bg-blue-200 text-blue-700'
                        : 'text-blue-600'
                    }`}
                    onClick={handleStatsClick}
                    title='View card statistics'
                    disabled={loadingStats}
                  >
                    <TrendingUp className='h-4 w-4' />
                  </button>
                  {onArchive && (
                    <button
                      className='p-1 hover:bg-blue-100 rounded transition-colors'
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(card.id);
                      }}
                      title={
                        card.isArchived ? 'Unarchive card' : 'Archive card'
                      }
                    >
                      <Archive className='h-4 w-4 text-blue-600' />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className='p-1 hover:bg-red-100 rounded transition-colors group'
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(card.id);
                      }}
                      title='Delete card'
                    >
                      <Trash2 className='h-4 w-4 text-blue-600 group-hover:text-red-600' />
                    </button>
                  )}
                  <RotateCcw className='h-3 w-3 text-blue-400' />
                </div>
              </div>

              {/* Main Content */}
              <div className='flex-grow flex items-center justify-center'>
                <div className='text-center w-full'>
                  <div className='w-full max-w-xs mx-auto'>
                    <textarea
                      ref={textareaRef}
                      value={editText}
                      onChange={(e) => {
                        handleTextChange(e.target.value);
                        autoResizeTextarea(e.target);
                      }}
                      className='w-full text-2xl font-semibold text-gray-900 mb-2 break-words resize-none text-center focus:outline-none border-none bg-transparent overflow-hidden min-h-[2.5rem]'
                      placeholder='Enter card back text...'
                      title='Edit card back text'
                      onClick={(e) => e.stopPropagation()}
                      onInput={(e) =>
                        autoResizeTextarea(e.target as HTMLTextAreaElement)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSave(e as any);
                        }
                        if (e.key === 'Escape') {
                          handleCancel(e as any);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { FlipCard };
