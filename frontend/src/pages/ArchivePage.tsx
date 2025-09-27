import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Archive, Search, Filter, X } from 'lucide-react';
import { CardService, LanguageService } from '@/lib/services';
import type { Card } from '@/lib/services/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FlipCard } from '@/components/ui/FlipCard';
import { useCardOperations } from '@/lib/hooks/useCardOperations';

export default function ArchivePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | ''>('');
  const [selectedFrontLanguage, setSelectedFrontLanguage] =
    useState<string>('');
  const [selectedBackLanguage, setSelectedBackLanguage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { archiveCard, deleteCard } = useCardOperations();

  const { data: cardsResponse, isLoading } = useQuery({
    queryKey: [
      'archived-cards',
      searchTerm,
      selectedType,
      selectedDifficulty,
      selectedFrontLanguage,
      selectedBackLanguage,
      currentPage,
    ],
    queryFn: async () => {
      const params: any = {
        page: currentPage,
        limit: 12,
        archived: true, // Only get archived cards
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedType) params.type = selectedType;
      if (selectedDifficulty !== '') params.difficulty = selectedDifficulty;
      if (selectedFrontLanguage) params.frontLanguageId = selectedFrontLanguage;
      if (selectedBackLanguage) params.backLanguageId = selectedBackLanguage;

      const response = await CardService.getMyCards(params);
      return response.success ? response.data : null;
    },
  });

  // Fetch available languages for filters
  const { data: languagesResponse } = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const response = await LanguageService.getLanguages();
      return response.success ? response.data : null;
    },
  });

  const cards = cardsResponse?.items || [];
  const pagination = cardsResponse?.pagination;
  const languages = languagesResponse || [];

  // Unarchive handler (since these are archived cards, we'll unarchive them)
  const handleUnarchiveCard = async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    await archiveCard(cardId, card.isArchived);
  };

  // Delete handler
  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(cardId);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedDifficulty('');
    setSelectedFrontLanguage('');
    setSelectedBackLanguage('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <LoadingSpinner size='lg' />
          <p className='mt-4 text-gray-500'>Loading archived cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 w-full'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Archive className='h-8 w-8 text-amber-600' />
          <h1 className='text-3xl font-bold text-gray-900'>Archive</h1>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='space-y-4'>
        <div className='flex items-center space-x-4'>
          <div className='flex-1 relative'>
            <Search className='h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <Input
              placeholder='Search archived cards...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
          <Button
            variant='outline'
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center space-x-2'
          >
            <Filter className='h-4 w-4' />
            <span>Filters</span>
          </Button>
          {(searchTerm ||
            selectedType ||
            selectedDifficulty !== '' ||
            selectedFrontLanguage ||
            selectedBackLanguage) && (
            <Button
              variant='outline'
              onClick={clearFilters}
              className='flex items-center space-x-2 text-red-600 hover:text-red-700'
            >
              <X className='h-4 w-4' />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className='bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4'>
            {/* Type Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500'
              >
                <option value=''>All Types</option>
                <option value='flashcard'>Flashcard</option>
                <option value='multiple-choice'>Multiple Choice</option>
                <option value='fill-in-the-blank'>Fill in the Blank</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) =>
                  setSelectedDifficulty(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500'
              >
                <option value=''>All Difficulties</option>
                <option value={1}>Easy (1)</option>
                <option value={2}>Medium (2)</option>
                <option value={3}>Hard (3)</option>
                <option value={4}>Expert (4)</option>
                <option value={5}>Master (5)</option>
              </select>
            </div>

            {/* Front Language Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Front Language
              </label>
              <select
                value={selectedFrontLanguage}
                onChange={(e) => setSelectedFrontLanguage(e.target.value)}
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500'
              >
                <option value=''>All Languages</option>
                {languages.map((lang: any) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Back Language Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Back Language
              </label>
              <select
                value={selectedBackLanguage}
                onChange={(e) => setSelectedBackLanguage(e.target.value)}
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500'
              >
                <option value=''>All Languages</option>
                {languages.map((lang: any) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className='w-full'>
        {cards.length === 0 ? (
          <div className='text-center py-12'>
            <Archive className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h3 className='mt-4 text-lg font-semibold text-gray-900'>
              No archived cards found
            </h3>
            <p className='text-gray-500 mt-2'>
              {searchTerm ||
              selectedType ||
              selectedDifficulty !== '' ||
              selectedFrontLanguage ||
              selectedBackLanguage
                ? 'Try adjusting your filters to find archived cards.'
                : 'You have no archived cards yet. Cards you archive will appear here.'}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-3 gap-6 w-full'>
            {cards.map((card: Card) => (
              <FlipCard
                key={card.id}
                card={card}
                showMetadata={true}
                onClick={() =>
                  console.log(`Viewed archived card: ${card.front}`)
                }
                onArchive={handleUnarchiveCard}
                onDelete={handleDeleteCard}
                className='transform hover:scale-105 transition-transform duration-200'
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className='flex items-center justify-center space-x-2 mt-8'>
          <Button
            variant='outline'
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <div className='flex items-center space-x-2'>
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(pageNum)}
                    className='w-10 h-10'
                  >
                    {pageNum}
                  </Button>
                );
              }
            )}
          </div>

          <Button
            variant='outline'
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Results Info */}
      {pagination && (
        <div className='text-center text-sm text-gray-500'>
          Showing {cards.length} of {pagination.total} archived cards
        </div>
      )}
    </div>
  );
}
