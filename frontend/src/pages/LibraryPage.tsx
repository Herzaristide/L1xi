import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Grid3X3, Table } from 'lucide-react';
import { CardService } from '@/lib/services';
import type { Card } from '@/lib/services/types';
import type { CreateCardRequest } from '@/lib/services';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FlipCard } from '@/components/ui/FlipCard';
import { useCardOperations } from '@/lib/hooks/useCardOperations';

export default function LibraryPage() {
  const [searchTerm, _setSearchTerm] = useState('');
  const [selectedType, _setSelectedType] = useState<string>('');
  const [selectedDifficulty, _setSelectedDifficulty] = useState<number | ''>(
    ''
  );
  const [selectedFrontLanguage, _setSelectedFrontLanguage] =
    useState<string>('');
  const [selectedBackLanguage, _setSelectedBackLanguage] = useState<string>('');
  const [currentPage, _setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [editingCells, setEditingCells] = useState<{ [key: string]: string }>(
    {}
  );
  const [newRows, setNewRows] = useState<
    Array<{ front: string; back: string; id: string }>
  >([]);
  const [saveTimeouts, setSaveTimeouts] = useState<{ [key: string]: number }>(
    {}
  );
  const tableEndRef = useRef<HTMLDivElement>(null);

  const { archiveCard, deleteCard, updateCard } = useCardOperations();
  const queryClient = useQueryClient();

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

  const cards = cardsResponse?.items || [];

  // Excel-like table functionality
  const generateEmptyRows = (count: number = 10) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `new-${Date.now()}-${index}`,
      front: '',
      back: '',
    }));
  };

  // Initialize empty rows if needed
  const ensureEmptyRows = () => {
    if (newRows.length < 5) {
      setNewRows((prev) => [...prev, ...generateEmptyRows(10)]);
    }
  };

  // Auto-save functionality for cells
  const autoSaveCell = useCallback(
    async (cardId: string, field: 'front' | 'back', value: string) => {
      if (!value.trim()) return;

      try {
        if (cardId.startsWith('new-')) {
          // Check if both front and back have content for new cards
          const currentRow = newRows.find((row) => row.id === cardId);
          if (!currentRow) return;

          const updatedRow = { ...currentRow, [field]: value };
          if (updatedRow.front.trim() && updatedRow.back.trim()) {
            // Create new card
            const newCard: CreateCardRequest = {
              type: 'TRANSLATION',
              front: updatedRow.front.trim(),
              back: updatedRow.back.trim(),
            };

            const response = await CardService.createCard(newCard);
            if (response.success) {
              // Remove from newRows and refresh cards list
              setNewRows((prev) => prev.filter((row) => row.id !== cardId));
              // Invalidate queries to refresh the cards list
              queryClient.invalidateQueries({ queryKey: ['my-cards'] });
            }
          } else {
            // Update the temporary row
            setNewRows((prev) =>
              prev.map((row) => (row.id === cardId ? updatedRow : row))
            );
          }
        } else {
          // Update existing card
          await updateCard(cardId, { [field]: value.trim() });
        }
      } catch (error) {
        console.error('Error saving cell:', error);
      }
    },
    [newRows, updateCard]
  );

  // Handle cell change with debounce
  const handleCellChange = (
    cardId: string,
    field: 'front' | 'back',
    value: string
  ) => {
    const cellKey = `${cardId}-${field}`;

    // Update editing state
    setEditingCells((prev) => ({ ...prev, [cellKey]: value }));

    // Clear existing timeout
    if (saveTimeouts[cellKey]) {
      clearTimeout(saveTimeouts[cellKey]);
    }

    // Set new timeout for auto-save
    const timeoutId = setTimeout(() => {
      autoSaveCell(cardId, field, value);
    }, 500) as unknown as number;

    setSaveTimeouts((prev) => ({ ...prev, [cellKey]: timeoutId }));
  };

  // Get cell value (from editing state or card data)
  const getCellValue = (cardId: string, field: 'front' | 'back') => {
    const cellKey = `${cardId}-${field}`;
    if (editingCells[cellKey] !== undefined) {
      return editingCells[cellKey];
    }

    if (cardId.startsWith('new-')) {
      const row = newRows.find((r) => r.id === cardId);
      return row?.[field] || '';
    }

    const card = cards.find((c) => c.id === cardId);
    return card?.[field] || '';
  };

  // Initialize empty rows
  useState(() => {
    setNewRows(generateEmptyRows(15));
  });

  // Archive/Unarchive handler
  const handleArchiveCard = async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    await archiveCard(cardId, card.isArchived);
  };

  // Delete handler
  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(cardId);
  };

  // Update handler
  const handleUpdateCard = async (
    cardId: string,
    updatedData: Partial<Card>
  ) => {
    await updateCard(cardId, updatedData);
  };

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
    <div className='w-full'>
      {/* View Toggle Buttons */}
      <div className='mb-6 flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-gray-900'>Your Card Library</h1>
        <div className='flex rounded-lg bg-gray-100 p-1'>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'cards'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid3X3 className='h-4 w-4' />
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Table className='h-4 w-4' />
            Table
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className='text-center py-12'>
          <h3 className='mt-4 text-lg font-semibold text-gray-900'>
            No cards found
          </h3>
          <p className='text-gray-500 mt-2'>
            Try adjusting your filters or create some new cards.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className='grid grid-cols-3 gap-6 w-full'>
          {cards.map((card: Card) => (
            <FlipCard
              key={card.id}
              card={card}
              onClick={() => console.log(`Studied card: ${card.front}`)}
              onArchive={handleArchiveCard}
              onDelete={handleDeleteCard}
              onUpdate={handleUpdateCard}
              className='transform hover:scale-105 transition-transform duration-200'
            />
          ))}
        </div>
      ) : (
        <div className='bg-white shadow-sm rounded-lg overflow-hidden'>
          <div className='overflow-auto max-h-[70vh]'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 sticky top-0 z-10'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-12'>
                    #
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                    Front
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Back
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white'>
                {/* Existing cards */}
                {cards.map((card: Card, index) => (
                  <tr
                    key={card.id}
                    className='hover:bg-gray-50 border-b border-gray-100'
                  >
                    <td className='px-4 py-2 text-sm text-gray-500 border-r border-gray-200 bg-gray-50'>
                      {index + 1}
                    </td>
                    <td className='px-4 py-2 border-r border-gray-200'>
                      <textarea
                        value={getCellValue(card.id, 'front')}
                        onChange={(e) =>
                          handleCellChange(card.id, 'front', e.target.value)
                        }
                        className='w-full min-h-[40px] p-2 text-sm border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset bg-transparent overflow-hidden'
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.max(
                            40,
                            target.scrollHeight
                          )}px`;
                        }}
                        placeholder='Front text...'
                      />
                    </td>
                    <td className='px-4 py-2'>
                      <textarea
                        value={getCellValue(card.id, 'back')}
                        onChange={(e) =>
                          handleCellChange(card.id, 'back', e.target.value)
                        }
                        className='w-full min-h-[40px] p-2 text-sm border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset bg-transparent overflow-hidden'
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.max(
                            40,
                            target.scrollHeight
                          )}px`;
                        }}
                        placeholder='Back text...'
                      />
                    </td>
                  </tr>
                ))}

                {/* New/Empty rows for adding cards */}
                {newRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className='hover:bg-gray-50 border-b border-gray-100'
                  >
                    <td className='px-4 py-2 text-sm text-gray-500 border-r border-gray-200 bg-gray-50'>
                      {cards.length + index + 1}
                    </td>
                    <td className='px-4 py-2 border-r border-gray-200'>
                      <textarea
                        value={getCellValue(row.id, 'front')}
                        onChange={(e) =>
                          handleCellChange(row.id, 'front', e.target.value)
                        }
                        className='w-full min-h-[40px] p-2 text-sm border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset bg-transparent overflow-hidden'
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.max(
                            40,
                            target.scrollHeight
                          )}px`;
                        }}
                        onFocus={() => {
                          // Ensure we have enough empty rows when user starts typing
                          if (index >= newRows.length - 5) {
                            ensureEmptyRows();
                          }
                        }}
                        placeholder='Front text...'
                      />
                    </td>
                    <td className='px-4 py-2'>
                      <textarea
                        value={getCellValue(row.id, 'back')}
                        onChange={(e) =>
                          handleCellChange(row.id, 'back', e.target.value)
                        }
                        className='w-full min-h-[40px] p-2 text-sm border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset bg-transparent overflow-hidden'
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.max(
                            40,
                            target.scrollHeight
                          )}px`;
                        }}
                        onFocus={() => {
                          // Ensure we have enough empty rows when user starts typing
                          if (index >= newRows.length - 5) {
                            ensureEmptyRows();
                          }
                        }}
                        placeholder='Back text...'
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div ref={tableEndRef} className='h-4' />
        </div>
      )}
    </div>
  );
}
