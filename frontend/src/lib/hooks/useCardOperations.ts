import { useQueryClient } from '@tanstack/react-query';
import { CardService } from '@/lib/services';
import type { UpdateCardRequest } from '@/lib/services';

export const useCardOperations = () => {
  const queryClient = useQueryClient();

  const archiveCard = async (
    cardId: string,
    isCurrentlyArchived: boolean = false
  ) => {
    try {
      if (isCurrentlyArchived) {
        await CardService.unarchiveCard(cardId);
      } else {
        await CardService.archiveCard(cardId);
      }

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['my-cards'] });
      queryClient.invalidateQueries({ queryKey: ['archived-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['deck-cards'] });

      return { success: true };
    } catch (error) {
      console.error('Error archiving card:', error);
      return { success: false, error };
    }
  };

  const deleteCard = async (cardId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this card? This action cannot be undone.'
      )
    ) {
      return { success: false, cancelled: true };
    }

    try {
      await CardService.deleteCard(cardId);

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['my-cards'] });
      queryClient.invalidateQueries({ queryKey: ['archived-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['deck-cards'] });

      return { success: true };
    } catch (error) {
      console.error('Error deleting card:', error);
      return { success: false, error };
    }
  };

  const updateCard = async (cardId: string, updateData: UpdateCardRequest) => {
    try {
      const response = await CardService.updateCard(cardId, updateData);

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['my-cards'] });
      queryClient.invalidateQueries({ queryKey: ['archived-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['deck-cards'] });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating card:', error);
      return { success: false, error };
    }
  };

  return {
    archiveCard,
    deleteCard,
    updateCard,
  };
};
