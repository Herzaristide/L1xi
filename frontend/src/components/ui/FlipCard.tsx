import { useState } from 'react';
import { Card as CardType } from '@/lib/services/types';
import { Volume2, RotateCcw } from 'lucide-react';
import { LanguageFlag } from './LanguageFlag';

// FlipCard Component Interface
interface FlipCardProps {
  card: CardType;
  className?: string;
  onClick?: () => void;
  showMetadata?: boolean;
}

function FlipCard({ card, onClick, showMetadata = false }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
    onClick?.();
  };

  return (
    <div className={'flashcard'}>
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
                {card.frontLanguage && (
                  <LanguageFlag language={card.frontLanguage} size='sm' />
                )}
              </div>
              <div className='flex items-center space-x-2'>
                {card.pronunciation && (
                  <button
                    className='p-1 hover:bg-gray-100 rounded transition-colors'
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add audio playback functionality here
                    }}
                  >
                    <Volume2 className='h-4 w-4 text-gray-600' />
                  </button>
                )}
                <RotateCcw className='h-3 w-3 text-gray-400' />
              </div>
            </div>

            {/* Main Content */}
            <div className='flex-grow flex items-center justify-center'>
              <div className='text-center'>
                {card.imageUrl && (
                  <img
                    src={card.imageUrl}
                    alt='Card visual'
                    className='max-w-full max-h-20 mx-auto mb-4 rounded'
                  />
                )}
                <h2 className='text-2xl font-semibold text-gray-900 mb-2 break-words'>
                  {card.front}
                </h2>
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
                {card.backLanguage && (
                  <LanguageFlag language={card.backLanguage} size='sm' />
                )}
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  className='p-1 hover:bg-blue-100 rounded transition-colors'
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add audio playback functionality here
                  }}
                >
                  <Volume2 className='h-4 w-4 text-blue-600' />
                </button>
                <RotateCcw className='h-3 w-3 text-blue-400' />
              </div>
            </div>

            {/* Main Content */}
            <div className='flex-grow flex items-center justify-center'>
              <div className='text-center w-full'>
                <h2 className='text-2xl font-semibold text-gray-900 mb-4 break-words'>
                  {card.back}
                </h2>

                {card.notes && (
                  <div className='bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-left'>
                    <p className='text-sm text-gray-700'>
                      <span className='font-medium text-gray-900'>Note:</span>{' '}
                      {card.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { FlipCard };
