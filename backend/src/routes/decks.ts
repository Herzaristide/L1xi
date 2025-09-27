import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createDeckSchema, updateDeckSchema } from '../validation/deck';

const router = express.Router();
const prisma = new PrismaClient();

// Get all user decks
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      ownerId: userId,
      ...(search && {
        OR: [
          {
            title: { contains: search as string, mode: 'insensitive' as const },
          },
          {
            description: {
              contains: search as string,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [decks, total] = await Promise.all([
      prisma.deck.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              deckCards: true,
            },
          },
        },
      }),
      prisma.deck.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        decks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get decks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get single deck
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const deck = await prisma.deck.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId }, // User's own deck
          { isShared: true }, // Or public shared deck
        ],
      },
      include: {
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
            card: {
              include: {
                frontLanguage: true,
                backLanguage: true,
                statistics: true,
              },
            },
          },
        },
        statistics: true,
        _count: {
          select: {
            deckCards: true,
            ratings: true,
          },
        },
      },
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found',
      });
    }

    res.json({
      success: true,
      data: { deck },
    });
  } catch (error) {
    console.error('Get deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create new deck
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { error, value } = createDeckSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details,
      });
    }

    const deck = await prisma.deck.create({
      data: {
        ...value,
        ownerId: req.user!.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            deckCards: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Deck created successfully',
      data: { deck },
    });
  } catch (error) {
    console.error('Create deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update deck
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { error, value } = updateDeckSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details,
      });
    }

    // Check if deck exists and belongs to user
    const existingDeck = await prisma.deck.findFirst({
      where: { id, ownerId: userId },
    });

    if (!existingDeck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found',
      });
    }

    const deck = await prisma.deck.update({
      where: { id },
      data: value,
      include: {
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Deck updated successfully',
      data: { deck },
    });
  } catch (error) {
    console.error('Update deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete deck
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if deck exists and belongs to user
    const existingDeck = await prisma.deck.findFirst({
      where: { id, userId },
    });

    if (!existingDeck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found',
      });
    }

    await prisma.deck.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Deck deleted successfully',
    });
  } catch (error) {
    console.error('Delete deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get deck cards
router.get('/:id/cards', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id: deckId } = req.params;
    const userId = req.user!.id;
    const { page = 1, limit = 20, search, tags } = req.query;

    // Check if deck belongs to user
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId },
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found',
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      deckId,
      ...(search && {
        OR: [
          {
            front: { contains: search as string, mode: 'insensitive' as const },
          },
          {
            back: { contains: search as string, mode: 'insensitive' as const },
          },
        ],
      }),
      ...(tags && {
        tags: {
          hasSome: (tags as string).split(','),
        },
      }),
    };

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.card.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        cards,
        deck: { id: deck.id, name: deck.name },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get deck cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
