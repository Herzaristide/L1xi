import { useQuery } from '@tanstack/react-query';
import { UserService, CardService } from '@/lib/services';
import type { ReviewCard } from '@/lib/services';
import {
  Card as UICard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/FlipCardold';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  Brain,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await UserService.getStats();
      return response.success ? response.data : null;
    },
  });

  const { data: dueCards, isLoading: dueCardsLoading } = useQuery({
    queryKey: ['dueCards'],
    queryFn: async () => {
      const response = await CardService.getDueCards({ limit: 5 });
      return response.success ? response.data?.cards || [] : [];
    },
  });

  if (statsLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 mt-1'>
          Welcome back! Here's your learning progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <UICard>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Decks</CardTitle>
            <BookOpen className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {userStats?.totalDecks || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Your flashcard collections
            </p>
          </CardContent>
        </UICard>

        <UICard>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Cards</CardTitle>
            <Brain className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {userStats?.totalCards || 0}
            </div>
            <p className='text-xs text-muted-foreground'>Flashcards created</p>
          </CardContent>
        </UICard>

        <UICard>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Cards Due</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {userStats?.reviewsToday || 0}
            </div>
            <p className='text-xs text-muted-foreground'>Ready for review</p>
          </CardContent>
        </UICard>

        <UICard>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Reviews</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {userStats?.cardsLearned || 0}
            </div>
            <p className='text-xs text-muted-foreground'>Total completed</p>
          </CardContent>
        </UICard>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Due Cards */}
        <UICard>
          <CardHeader>
            <CardTitle>Cards Due for Review</CardTitle>
            <CardDescription>Cards scheduled for review today</CardDescription>
          </CardHeader>
          <CardContent>
            {dueCardsLoading ? (
              <div className='flex justify-center py-8'>
                <LoadingSpinner />
              </div>
            ) : dueCards && dueCards.length > 0 ? (
              <div className='space-y-4'>
                {dueCards.slice(0, 5).map((reviewCard: ReviewCard) => (
                  <div
                    key={reviewCard.id}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                  >
                    <div>
                      <p className='font-medium text-gray-900'>
                        {reviewCard.card.front}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {reviewCard.card.deck?.title}
                      </p>
                      {reviewCard.card.difficulty &&
                        reviewCard.card.difficulty > 0 && (
                          <div className='flex items-center gap-1 mt-1'>
                            {[...Array(reviewCard.card.difficulty)].map(
                              (_, i) => (
                                <div
                                  key={i}
                                  className='w-1 h-1 bg-yellow-400 rounded-full'
                                />
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                <div className='pt-4'>
                  <Button asChild className='w-full'>
                    <Link to='/study'>
                      Start Studying
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className='text-center py-8'>
                <Brain className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 mb-4'>No cards due for review!</p>
                <Button asChild variant='outline'>
                  <Link to='/decks'>Create Your First Deck</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </UICard>

        {/* Recent Activity */}
        <UICard>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest learning sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-gray-500'>Recent activity coming soon...</p>
          </CardContent>
        </UICard>
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <UICard className='cursor-pointer hover:shadow-md transition-shadow'>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Plus className='mr-2 h-5 w-5' />
              Create Deck
            </CardTitle>
            <CardDescription>
              Start a new collection of flashcards
            </CardDescription>
          </CardHeader>
        </UICard>

        <UICard className='cursor-pointer hover:shadow-md transition-shadow'>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Brain className='mr-2 h-5 w-5' />
              Quick Study
            </CardTitle>
            <CardDescription>Review cards across all decks</CardDescription>
          </CardHeader>
        </UICard>

        <UICard className='cursor-pointer hover:shadow-md transition-shadow'>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <TrendingUp className='mr-2 h-5 w-5' />
              View Analytics
            </CardTitle>
            <CardDescription>Track your learning progress</CardDescription>
          </CardHeader>
        </UICard>
      </div>
    </div>
  );
}
