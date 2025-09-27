import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DeckService } from '@/lib/services';
import type { Deck } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Card as UICard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/FlipCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, getRandomColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function DecksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: decksData, isLoading } = useQuery({
    queryKey: ['decks', searchTerm],
    queryFn: async () => {
      const response = await DeckService.getDecks({ search: searchTerm });
      return response.success ? response.data?.items || [] : [];
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (deckId: string) => {
      const response = await DeckService.deleteDeck(deckId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete deck');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success('Deck deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete deck');
    },
  });

  const handleDeleteDeck = (deck: Deck) => {
    if (
      confirm(
        `Are you sure you want to delete "${deck.name}"? This action cannot be undone.`
      )
    ) {
      deleteDeckMutation.mutate(deck.id);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const decks = decksData?.decks || [];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>My Decks</h1>
          <p className='text-gray-600 mt-1'>
            Organize your flashcards into collections
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Create Deck
        </Button>
      </div>

      {/* Search and Filters */}
      <div className='flex items-center space-x-4'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Search decks...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
        <Button variant='outline'>
          <Filter className='mr-2 h-4 w-4' />
          Filter
        </Button>
      </div>

      {/* Decks Grid */}
      {decks.length === 0 ? (
        <div className='text-center py-12'>
          <div className='mx-auto h-24 w-24 text-gray-400 mb-4'>
            <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
              />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No decks yet
          </h3>
          <p className='text-gray-600 mb-6'>
            Create your first deck to start learning
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Create Your First Deck
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {decks.map((deck: Deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onDelete={() => handleDeleteDeck(deck)}
              isDeleting={deleteDeckMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create Deck Modal */}
      {showCreateModal && (
        <CreateDeckModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['decks'] });
          }}
        />
      )}
    </div>
  );
}

interface DeckCardProps {
  deck: Deck;
  onDelete: () => void;
  isDeleting: boolean;
}

function DeckCard({ deck, onDelete, isDeleting }: DeckCardProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <UICard className='relative group hover:shadow-md transition-shadow'>
      <div
        className='absolute top-0 left-0 right-0 h-1 rounded-t-lg'
        style={{ backgroundColor: deck.color }}
      />

      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <CardTitle className='text-lg'>{deck.name}</CardTitle>
            {deck.description && (
              <CardDescription className='mt-1'>
                {deck.description}
              </CardDescription>
            )}
          </div>

          <div className='relative'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowOptions(!showOptions)}
              className='opacity-0 group-hover:opacity-100 transition-opacity'
            >
              <MoreVertical className='h-4 w-4' />
            </Button>

            {showOptions && (
              <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10'>
                <div className='py-1'>
                  <button className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left'>
                    <Edit className='mr-3 h-4 w-4' />
                    Edit Deck
                  </button>
                  <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className='flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left'
                  >
                    <Trash2 className='mr-3 h-4 w-4' />
                    Delete Deck
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center justify-between text-sm text-gray-500 mt-2'>
          <span>{deck._count?.cards || 0} cards</span>
          <span>
            {deck.language} → {deck.targetLang}
          </span>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-500'>
            Updated {formatDate(deck.updatedAt)}
          </div>

          <div className='flex space-x-2'>
            <Button variant='outline' size='sm' asChild>
              <Link to={`/decks/${deck.id}`}>View Cards</Link>
            </Button>

            <Button size='sm' asChild>
              <Link to={`/study/${deck.id}`}>
                <Play className='mr-1 h-3 w-3' />
                Study
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </UICard>
  );
}

interface CreateDeckModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateDeckModal({ onClose, onSuccess }: CreateDeckModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'en',
    targetLang: 'es',
    color: getRandomColor(),
  });

  const createDeckMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await DeckService.createDeck(data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create deck');
      }
      return response;
    },
    onSuccess: () => {
      toast.success('Deck created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create deck');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDeckMutation.mutate(formData);
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-xl font-semibold mb-4'>Create New Deck</h2>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Deck Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder='e.g., Spanish Basics'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='Brief description (optional)'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>From</label>
              <select
                value={formData.language}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value })
                }
                className='input'
              >
                <option value='en'>English</option>
                <option value='es'>Spanish</option>
                <option value='fr'>French</option>
                <option value='de'>German</option>
                <option value='it'>Italian</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>To</label>
              <select
                value={formData.targetLang}
                onChange={(e) =>
                  setFormData({ ...formData, targetLang: e.target.value })
                }
                className='input'
              >
                <option value='es'>Spanish</option>
                <option value='en'>English</option>
                <option value='fr'>French</option>
                <option value='de'>German</option>
                <option value='it'>Italian</option>
              </select>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Color</label>
            <div className='flex space-x-2'>
              {[
                '#EF4444',
                '#F97316',
                '#EAB308',
                '#22C55E',
                '#3B82F6',
                '#8B5CF6',
                '#EC4899',
              ].map((color) => (
                <button
                  key={color}
                  type='button'
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color
                      ? 'border-gray-400'
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className='flex justify-end space-x-3 mt-6'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' isLoading={createDeckMutation.isPending}>
              Create Deck
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
