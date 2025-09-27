import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all available languages
router.get('/', async (req, res) => {
  try {
    const languages = await prisma.language.findMany({
      orderBy: [{ difficulty: 'asc' }, { name: 'asc' }],
    });

    res.json({
      success: true,
      data: { languages },
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get language by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const language = await prisma.language.findUnique({
      where: { id },
    });

    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found',
      });
    }

    res.json({
      success: true,
      data: { language },
    });
  } catch (error) {
    console.error('Get language error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get language statistics (cards, users, etc.)
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify language exists
    const language = await prisma.language.findUnique({
      where: { id },
    });

    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found',
      });
    }

    // Get statistics
    const [totalCards, totalDecks, nativeUsers, learningUsers] =
      await Promise.all([
        prisma.card.count({
          where: {
            OR: [{ frontLanguageId: id }, { backLanguageId: id }],
          },
        }),
        prisma.deck.count({
          where: {
            deckCards: {
              some: {
                card: {
                  OR: [{ frontLanguageId: id }, { backLanguageId: id }],
                },
              },
            },
          },
        }),
        prisma.user.count({
          where: { nativeLanguageId: id },
        }),
        prisma.user.count({
          where: { learningLanguageId: id },
        }),
      ]);

    const stats = {
      totalCards,
      totalDecks,
      nativeUsers,
      learningUsers,
      totalUsers: nativeUsers + learningUsers,
    };

    res.json({
      success: true,
      data: {
        language,
        stats,
      },
    });
  } catch (error) {
    console.error('Get language stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
