import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Search, Filter, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardService, DeckService, LanguageService } from '@/lib/services';
import type { Card } from '@/lib/services/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FlipCard } from '@/components/ui/FlipCard';
import { LanguageFlag } from '@/components/ui/LanguageFlag';

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | ''>('');
  const [selectedFrontLanguage, setSelectedFrontLanguage] =
    useState<string>('');
  const [selectedBackLanguage, setSelectedBackLanguage] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    deckId: '',
    type: 'flashcard',
    front: '',
    back: '',
    hint: '',
    difficulty: 1,
    tags: '',
  });

  const { data: cardsResponse, isLoading } = useQuery({
    queryKey: [
      'my-cards',
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
  const languages = languagesResponse?.languages || [];

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <LoadingSpinner size='lg' />
          <p className='mt-4 text-gray-500'>Loading your cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Search and Filters */}
      <div className='bg-white rounded-lg shadow-sm border p-6'>
        <div className='space-y-4'>
          {/* Search Bar */}
          <div className='flex items-center space-x-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Search cards...'
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
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className='grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t'>
              {/* Card Type Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Card Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>All Types</option>
                  <option value='TRANSLATION'>Translation</option>
                  <option value='MULTIPLE_CHOICE'>Multiple Choice</option>
                  <option value='DEFINITION'>Definition</option>
                  <option value='GRAMMAR'>Grammar</option>
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
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>All Levels</option>
                  <option value={1}>Beginner (1)</option>
                  <option value={2}>Elementary (2)</option>
                  <option value={3}>Intermediate (3)</option>
                  <option value={4}>Advanced (4)</option>
                  <option value={5}>Expert (5)</option>
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
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>All Languages</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.flag} {language.name}
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
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>All Languages</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.flag} {language.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className='flex items-end'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setSelectedType('');
                    setSelectedDifficulty('');
                    setSelectedFrontLanguage('');
                    setSelectedBackLanguage('');
                    setSearchTerm('');
                  }}
                  className='w-full'
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className='w-full'>
        {cards.length === 0 ? (
          <div className='text-center py-12'>
            <h3 className='mt-4 text-lg font-semibold text-gray-900'>
              No cards found
            </h3>
            <p className='text-gray-500 mt-2'>
              Try adjusting your filters or create some new cards.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'>
            {cards.map((card: Card) => (
              <FlipCard
                key={card.id}
                card={card}
                showMetadata={true}
                onClick={() => console.log(`Studied card: ${card.front}`)}
                className='transform hover:scale-105 transition-transform duration-200'
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className='flex justify-center items-center space-x-2 mt-8'>
          <Button
            variant='outline'
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            size='sm'
          >
            Previous
          </Button>

          <div className='flex space-x-1'>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((page) => {
                const current = currentPage;
                return (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= current - 1 && page <= current + 1)
                );
              })
              .map((page, index, array) => {
                const prevPage = array[index - 1];
                const showEllipsis = prevPage && page - prevPage > 1;

                return (
                  <div key={page} className='flex items-center'>
                    {showEllipsis && (
                      <span className='px-2 text-gray-500'>...</span>
                    )}
                    <Button
                      variant={page === currentPage ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(page)}
                      size='sm'
                      className='w-10'
                    >
                      {page}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            variant='outline'
            disabled={currentPage === pagination.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            size='sm'
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
