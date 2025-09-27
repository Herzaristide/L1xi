import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Grid3X3,
  Table,
  X,
  Upload,
  Check,
  Square,
  Archive,
  Trash2,
  RotateCcw,
  CheckSquare,
} from 'lucide-react';
import { CardService, LanguageService } from '@/lib/services';
import type { Card, Language } from '@/lib/services/types';
import type { CreateCardRequest } from '@/lib/services';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FlipCard } from '@/components/ui/FlipCard';
import { useCardOperations } from '@/lib/hooks/useCardOperations';
import { LanguageFlag } from '@/components/ui/LanguageFlag';
import ImportCardsPopup from '@/components/ui/ImportCardsPopup';
import { Button } from '@/components/ui/Button';

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
    Array<{
      front: string;
      back: string;
      id: string;
      frontLanguageId?: string;
      backLanguageId?: string;
    }>
  >([]);
  const [saveTimeouts, setSaveTimeouts] = useState<{ [key: string]: number }>(
    {}
  );
  const [languageModal, setLanguageModal] = useState<{
    isOpen: boolean;
    cardId: string | null;
    field: 'front' | 'back' | null;
    currentLanguageId: string | null;
  }>({ isOpen: false, cardId: null, field: null, currentLanguageId: null });
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
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

  // Query for available languages
  const { data: languagesResponse } = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const response = await LanguageService.getLanguages();
      return response.success ? response.data : [];
    },
  });

  const languages = Array.isArray(languagesResponse) ? languagesResponse : [];

  const cards = cardsResponse?.items || [];

  // Excel-like table functionality
  const generateEmptyRows = (count: number = 10) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `new-${Date.now()}-${index}`,
      front: '',
      back: '',
      frontLanguageId: undefined,
      backLanguageId: undefined,
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
            // Create new card with language IDs
            const newCard: CreateCardRequest = {
              type: 'TRANSLATION',
              front: updatedRow.front.trim(),
              back: updatedRow.back.trim(),
              frontLanguageId: updatedRow.frontLanguageId,
              backLanguageId: updatedRow.backLanguageId,
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

  // Language editing functions
  const handleLanguageFlagClick = (
    cardId: string,
    field: 'front' | 'back',
    currentLanguageId: string | null
  ) => {
    setLanguageModal({
      isOpen: true,
      cardId,
      field,
      currentLanguageId,
    });
  };

  const handleLanguageSelect = async (languageId: string | null) => {
    if (!languageModal.cardId || !languageModal.field) return;

    try {
      if (languageModal.cardId.startsWith('new-')) {
        // Handle new row language selection
        const fieldName =
          languageModal.field === 'front'
            ? 'frontLanguageId'
            : 'backLanguageId';
        setNewRows((prev) =>
          prev.map((row) =>
            row.id === languageModal.cardId
              ? { ...row, [fieldName]: languageId }
              : row
          )
        );
      } else {
        // Handle existing card language selection
        const fieldName =
          languageModal.field === 'front'
            ? 'frontLanguageId'
            : 'backLanguageId';

        await handleUpdateCard(languageModal.cardId, {
          [fieldName]: languageId,
        });
      }

      // Close modal
      setLanguageModal({
        isOpen: false,
        cardId: null,
        field: null,
        currentLanguageId: null,
      });
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const closeLanguageModal = () => {
    setLanguageModal({
      isOpen: false,
      cardId: null,
      field: null,
      currentLanguageId: null,
    });
  };

  // Handle card import
  const handleImportCards = useCallback(
    async (cardsData: any[]) => {
      try {
        // Use bulk create endpoint
        await CardService.createCards(cardsData);

        // Refresh the cards list
        queryClient.invalidateQueries({ queryKey: ['cards'] });

        // Show success message or notification
        console.log(`Successfully imported ${cardsData.length} cards`);
      } catch (error) {
        console.error('Failed to import cards:', error);
        throw error;
      }
    },
    [queryClient]
  );

  // Selection handlers
  const toggleCardSelection = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const selectAllCards = () => {
    if (selectedCards.size === cards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(cards.map((card) => card.id)));
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedCards.size === 0) return;

    try {
      const deletePromises = Array.from(selectedCards).map((cardId) =>
        deleteCard(cardId)
      );
      await Promise.all(deletePromises);
      setSelectedCards(new Set());
    } catch (error) {
      console.error('Failed to delete cards:', error);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedCards.size === 0) return;

    try {
      const archivePromises = Array.from(selectedCards).map((cardId) =>
        archiveCard(cardId)
      );
      await Promise.all(archivePromises);
      setSelectedCards(new Set());
    } catch (error) {
      console.error('Failed to archive cards:', error);
    }
  };

  const handleBulkFlip = async () => {
    if (selectedCards.size === 0) return;

    try {
      const flipPromises = Array.from(selectedCards).map((cardId) => {
        const card = cards.find((c) => c.id === cardId);
        if (card) {
          return updateCard(cardId, {
            front: card.back,
            back: card.front,
            frontLanguageId: card.backLanguage?.id,
            backLanguageId: card.frontLanguage?.id,
          });
        }
        return Promise.resolve();
      });
      await Promise.all(flipPromises);
      setSelectedCards(new Set());
    } catch (error) {
      console.error('Failed to flip cards:', error);
    }
  };

  // Keyboard shortcuts for card selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === 'Escape') {
        setSelectedCards(new Set());
      } else if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
            event.preventDefault();
            selectAllCards();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectAllCards]);

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
      {/* Header with Action Bar, Import Button and View Toggle */}
      <div className='mb-6 flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-gray-900'>Your Card Library</h1>
        <div className='flex items-center gap-4'>
          {/* Action Bar - Visible when cards are selected */}
          {selectedCards.size > 0 && (
            <div className='flex items-center gap-3 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg shadow-sm'>
              <div className='flex items-center gap-2'>
                <CheckSquare className='h-4 w-4 text-primary-600' />
                <span className='text-sm text-primary-700 font-medium'>
                  {selectedCards.size} selected
                </span>
              </div>
              <div className='w-px h-6 bg-primary-200'></div>
              <div className='flex gap-1'>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={handleBulkDelete}
                  className='text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5'
                  title={`Delete ${selectedCards.size} selected card${
                    selectedCards.size > 1 ? 's' : ''
                  }`}
                >
                  <Trash2 className='h-4 w-4 mr-1' />
                  Delete
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={handleBulkArchive}
                  className='text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-3 py-1.5'
                  title={`Archive ${selectedCards.size} selected card${
                    selectedCards.size > 1 ? 's' : ''
                  }`}
                >
                  <Archive className='h-4 w-4 mr-1' />
                  Archive
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={handleBulkFlip}
                  className='text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5'
                  title={`Flip ${selectedCards.size} selected card${
                    selectedCards.size > 1 ? 's' : ''
                  } (swap front/back)`}
                >
                  <RotateCcw className='h-4 w-4 mr-1' />
                  Flip
                </Button>
              </div>
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={() => setIsImportPopupOpen(true)}
            variant='outline'
            className='flex items-center gap-2'
          >
            <Upload className='h-4 w-4' />
            Import Cards
          </Button>

          {/* View Toggle Buttons */}
          <div className='flex items-center gap-2'>
            {/* Select All Button - Always visible */}
            <Button
              onClick={selectAllCards}
              variant='ghost'
              size='sm'
              className='text-sm'
              title={
                selectedCards.size === cards.length
                  ? 'Deselect all'
                  : 'Select all'
              }
            >
              {selectedCards.size === cards.length ? (
                <CheckSquare className='h-4 w-4 mr-1' />
              ) : (
                <Square className='h-4 w-4 mr-1' />
              )}
              {selectedCards.size === cards.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>

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
            <div key={card.id} className='relative'>
              <FlipCard
                card={card}
                onClick={() => {
                  console.log(`Clicked card: ${card.front}`);
                }}
                onArchive={handleArchiveCard}
                onDelete={handleDeleteCard}
                onUpdate={handleUpdateCard}
                isSelected={selectedCards.has(card.id)}
                onToggleSelection={toggleCardSelection}
                className={`transform hover:scale-105 transition-transform duration-200 ${
                  selectedCards.has(card.id)
                    ? 'ring-2 ring-primary-500 ring-offset-2'
                    : ''
                }`}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className='bg-white shadow-sm rounded-lg overflow-hidden'>
          <div className='overflow-auto max-h-[70vh]'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 sticky top-0 z-10'>
                <tr>
                  {/* Selection Column Header - Always visible */}
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-12'>
                    <button
                      onClick={selectAllCards}
                      className='w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-primary-400 transition-colors'
                      title={
                        selectedCards.size === cards.length
                          ? 'Deselect all'
                          : 'Select all'
                      }
                    >
                      {selectedCards.size === cards.length && (
                        <Check className='h-3 w-3 text-primary-600' />
                      )}
                    </button>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-12'>
                    #
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                    <div className='flex items-center gap-2'>
                      <span>Front</span>
                      <span className='text-gray-400'>🌍</span>
                    </div>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center gap-2'>
                      <span>Back</span>
                      <span className='text-gray-400'>🌍</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white'>
                {/* Existing cards */}
                {cards.map((card: Card, index) => (
                  <tr
                    key={card.id}
                    className={`hover:bg-gray-50 border-b border-gray-100 ${
                      selectedCards.has(card.id)
                        ? 'bg-primary-50 hover:bg-primary-100'
                        : ''
                    }`}
                  >
                    <td className='px-4 py-2 text-center border-r border-gray-200'>
                      <button
                        onClick={() => toggleCardSelection(card.id)}
                        className='w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-primary-400 transition-colors mx-auto'
                      >
                        {selectedCards.has(card.id) && (
                          <Check className='h-3 w-3 text-primary-600' />
                        )}
                      </button>
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500 border-r border-gray-200 bg-gray-50'>
                      {index + 1}
                    </td>
                    <td className='px-4 py-2 border-r border-gray-200'>
                      <div className='flex items-center justify-between'>
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
                        <div className='ml-2 flex-shrink-0'>
                          <button
                            onClick={() =>
                              handleLanguageFlagClick(
                                card.id,
                                'front',
                                card.frontLanguage?.id || null
                              )
                            }
                            className='hover:bg-gray-100 rounded p-1 transition-colors'
                            title={`Current: ${
                              card.frontLanguage?.name || 'No language'
                            } - Click to change`}
                          >
                            <LanguageFlag language={card.frontLanguage} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-2'>
                      <div className='flex items-center justify-between'>
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
                        <div className='ml-2 flex-shrink-0'>
                          <button
                            onClick={() =>
                              handleLanguageFlagClick(
                                card.id,
                                'back',
                                card.backLanguage?.id || null
                              )
                            }
                            className='hover:bg-gray-100 rounded p-1 transition-colors'
                            title={`Current: ${
                              card.backLanguage?.name || 'No language'
                            } - Click to change`}
                          >
                            <LanguageFlag language={card.backLanguage} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* New/Empty rows for adding cards */}
                {newRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className='hover:bg-gray-50 border-b border-gray-100'
                  >
                    {/* Selection Cell Placeholder for New Rows - Always visible */}
                    <td className='px-4 py-2 text-center border-r border-gray-200'>
                      {/* Empty cell for new rows */}
                    </td>
                    <td className='px-4 py-2 text-sm text-gray-500 border-r border-gray-200 bg-gray-50'>
                      {cards.length + index + 1}
                    </td>
                    <td className='px-4 py-2 border-r border-gray-200'>
                      <div className='flex items-center justify-between'>
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
                        <div className='ml-2 flex-shrink-0'>
                          <button
                            onClick={() => {
                              const currentRow = newRows.find(
                                (r) => r.id === row.id
                              );
                              handleLanguageFlagClick(
                                row.id,
                                'front',
                                currentRow?.frontLanguageId || null
                              );
                            }}
                            className='hover:bg-gray-100 rounded p-1 transition-colors'
                            title={`Current: ${
                              (Array.isArray(languages)
                                ? languages.find(
                                    (lang) =>
                                      lang.id ===
                                      newRows.find((r) => r.id === row.id)
                                        ?.frontLanguageId
                                  )?.name
                                : undefined) || 'No language'
                            } - Click to change`}
                          >
                            <LanguageFlag
                              language={
                                (Array.isArray(languages)
                                  ? languages.find(
                                      (lang) =>
                                        lang.id ===
                                        newRows.find((r) => r.id === row.id)
                                          ?.frontLanguageId
                                    )
                                  : undefined) || undefined
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-2'>
                      <div className='flex items-center justify-between'>
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
                        <div className='ml-2 flex-shrink-0'>
                          <button
                            onClick={() => {
                              const currentRow = newRows.find(
                                (r) => r.id === row.id
                              );
                              handleLanguageFlagClick(
                                row.id,
                                'back',
                                currentRow?.backLanguageId || null
                              );
                            }}
                            className='hover:bg-gray-100 rounded p-1 transition-colors'
                            title={`Current: ${
                              (Array.isArray(languages)
                                ? languages.find(
                                    (lang) =>
                                      lang.id ===
                                      newRows.find((r) => r.id === row.id)
                                        ?.backLanguageId
                                  )?.name
                                : undefined) || 'No language'
                            } - Click to change`}
                          >
                            <LanguageFlag
                              language={
                                (Array.isArray(languages)
                                  ? languages.find(
                                      (lang) =>
                                        lang.id ===
                                        newRows.find((r) => r.id === row.id)
                                          ?.backLanguageId
                                    )
                                  : undefined) || undefined
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div ref={tableEndRef} className='h-4' />
        </div>
      )}

      {/* Language Selection Modal */}
      {languageModal.isOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>
                Select {languageModal.field === 'front' ? 'Front' : 'Back'}{' '}
                Language
              </h3>
              <button
                onClick={closeLanguageModal}
                className='text-gray-400 hover:text-gray-600'
                title='Close modal'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='mb-4'>
              <p className='text-sm text-gray-600'>
                Choose the language for the{' '}
                {languageModal.field === 'front' ? 'front' : 'back'} side of
                this card. Click on a language flag to change it.
              </p>
            </div>

            <div className='space-y-2 max-h-60 overflow-y-auto'>
              {/* No Language Option */}
              <button
                onClick={() => handleLanguageSelect(null)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  languageModal.currentLanguageId === null
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className='flex items-center gap-3'>
                  <div className='w-6 h-6 rounded border border-gray-300 bg-gray-100 flex items-center justify-center'>
                    <span className='text-xs text-gray-500'>?</span>
                  </div>
                  <span className='text-gray-700'>No Language</span>
                </div>
              </button>

              {/* Language Options */}
              {Array.isArray(languages) &&
                languages.map((language: Language) => (
                  <button
                    key={language.id}
                    onClick={() => handleLanguageSelect(language.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      languageModal.currentLanguageId === language.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-2xl'>{language.flag}</span>
                      <div className='flex-1'>
                        <span className='font-medium text-gray-900'>
                          {language.name}
                        </span>
                        <div className='text-sm text-gray-500'>
                          {language.code}
                        </div>
                      </div>
                      {languageModal.currentLanguageId === language.id && (
                        <div className='text-blue-500'>✓</div>
                      )}
                    </div>
                  </button>
                ))}
            </div>

            <div className='flex gap-2 mt-6'>
              <button
                onClick={closeLanguageModal}
                className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Cards Popup */}
      <ImportCardsPopup
        isOpen={isImportPopupOpen}
        onClose={() => setIsImportPopupOpen(false)}
        onImport={handleImportCards}
      />
    </div>
  );
}
