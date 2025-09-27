import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  createCardSchema,
  updateCardSchema,
  createBulkCardsSchema,
} from '../validation/card';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's own cards
router.get('/my', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      page = 1,
      limit = 20,
      search,
      type,
      frontLanguageId,
      backLanguageId,
      difficulty,
      tags,
      deckId,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      ownerId: userId,
      isArchived: false,
    };

    // Search in front and back content
    if (search) {
      where.OR = [
        { front: { contains: search as string, mode: 'insensitive' } },
        { back: { contains: search as string, mode: 'insensitive' } },
        { hint: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by card type
    if (type) {
      where.type = type;
    }

    // Filter by languages
    if (frontLanguageId) {
      where.frontLanguageId = frontLanguageId;
    }
    if (backLanguageId) {
      where.backLanguageId = backLanguageId;
    }

    // Filter by difficulty
    if (difficulty) {
      where.difficulty = Number(difficulty);
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray };
    }

    // Filter by deck
    if (deckId) {
      where.deckCards = {
        some: {
          deckId: deckId as string,
        },
      };
    }

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          frontLanguage: true,
          backLanguage: true,
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          deckCards: {
            include: {
              deck: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          statistics: true,
          _count: {
            select: {
              ratings: true,
              deckCards: true,
            },
          },
        },
      }),
      prisma.card.count({ where }),
    ]);

    // Transform cards to include deck info from deckCards
    const transformedCards = cards.map((card) => ({
      ...card,
      deck: card.deckCards[0]?.deck || null,
    }));

    const totalPages = Math.ceil(total / take);
    const hasNext = Number(page) < totalPages;
    const hasPrev = Number(page) > 1;

    res.json({
      success: true,
      data: {
        items: transformedCards,
        pagination: {
          page: Number(page),
          totalPages,
          total,
          limit: take,
          hasNext,
          hasPrev,
        },
      },
    });
  } catch (error) {
    console.error('Get user cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get all cards (browse/discover cards)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      frontLanguageId,
      backLanguageId,
      difficulty,
      isShared = 'true', // Default to shared cards only
      tags,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      isArchived: false,
    };

    // Only show shared cards by default (public discovery)
    if (isShared === 'true') {
      where.isShared = true;
    }

    // Search in front and back content
    if (search) {
      where.OR = [
        { front: { contains: search as string, mode: 'insensitive' } },
        { back: { contains: search as string, mode: 'insensitive' } },
        { hint: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by card type
    if (type) {
      where.type = type;
    }

    // Filter by languages
    if (frontLanguageId) {
      where.frontLanguageId = frontLanguageId;
    }
    if (backLanguageId) {
      where.backLanguageId = backLanguageId;
    }

    // Filter by difficulty
    if (difficulty) {
      where.difficulty = Number(difficulty);
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray };
    }

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          frontLanguage: true,
          backLanguage: true,
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          statistics: true,
          _count: {
            select: {
              ratings: true,
              deckCards: true,
            },
          },
        },
      }),
      prisma.card.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        cards,
        pagination: {
          current: Number(page),
          total: totalPages,
          count: total,
          limit: take,
        },
      },
    });
  } catch (error) {
    console.error('Browse cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create new cards (bulk creation)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    // Validate the request body as an array of cards
    const { error } = createBulkCardsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details,
      });
    }

    const userId = req.user!.id;
    const cardsData = req.body;

    // Collect all unique deck IDs to validate them upfront
    const deckIds = [
      ...new Set(
        cardsData
          .map((card: any) => card.deckId)
          .filter((deckId: any) => deckId !== undefined)
      ),
    ];

    // If any deckIds are provided, check if they exist and belong to user
    if (deckIds.length > 0) {
      const decks = await prisma.deck.findMany({
        where: {
          id: { in: deckIds },
          ownerId: userId,
        },
        select: { id: true },
      });

      const foundDeckIds = decks.map((deck) => deck.id);
      const invalidDeckIds = deckIds.filter(
        (deckId) => !foundDeckIds.includes(deckId)
      );

      if (invalidDeckIds.length > 0) {
        return res.status(404).json({
          success: false,
          message: `Deck(s) not found or you do not have permission to add cards to them: ${invalidDeckIds.join(
            ', '
          )}`,
        });
      }
    }

    // Create all cards in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdCards = [];

      for (const cardData of cardsData) {
        const { deckId, ...cleanCardData } = cardData;

        const card = await tx.card.create({
          data: {
            ...cleanCardData,
            ownerId: userId,
          },
          include: {
            frontLanguage: true,
            backLanguage: true,
            owner: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        createdCards.push(card);

        // Add card to deck if deckId is specified
        if (deckId) {
          await tx.deckCard.create({
            data: {
              deckId,
              cardId: card.id,
            },
          });
        }
      }

      return createdCards;
    });

    const responseMessage =
      cardsData.length === 1
        ? 'Card created successfully'
        : `${cardsData.length} cards created successfully`;

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        cards: result,
        count: result.length,
      },
    });
  } catch (error) {
    console.error('Create cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get single card
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const card = await prisma.card.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        frontLanguage: true,
        backLanguage: true,
        deckCards: {
          include: {
            deck: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    res.json({
      success: true,
      data: { card },
    });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update card
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { error, value } = updateCardSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details,
      });
    }

    // Check if card exists and belongs to user
    const existingCard = await prisma.card.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    const card = await prisma.card.update({
      where: { id },
      data: value,
      include: {
        frontLanguage: true,
        backLanguage: true,
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Card updated successfully',
      data: { card },
    });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete card
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if card exists and belongs to user
    const existingCard = await prisma.card.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    await prisma.card.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get cards due for review
router.get('/review/due', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { deckId, limit = 20 } = req.query;

    // Get user's card statuses that are due for review
    const userCardStatuses = await prisma.userCardStatus.findMany({
      where: {
        userId,
        nextReviewAt: { lte: new Date() },
        ...(deckId && {
          card: {
            deckCards: {
              some: {
                deckId: deckId as string,
              },
            },
          },
        }),
      },
      take: Number(limit),
      orderBy: { nextReviewAt: 'asc' },
      include: {
        card: {
          include: {
            frontLanguage: true,
            backLanguage: true,
            deckCards: {
              include: {
                deck: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform to the expected format
    const cards = userCardStatuses.map((status) => ({
      ...status.card,
      reviewStatus: status,
    }));

    res.json({
      success: true,
      data: { cards },
    });
  } catch (error) {
    console.error('Get due cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
