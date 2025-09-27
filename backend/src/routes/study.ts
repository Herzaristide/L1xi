import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Start study session
router.post('/session/start', authenticate, async (req: AuthRequest, res) => {
  try {
    const { deckId } = req.body;
    const userId = req.user!.id;

    // Verify deck ownership if deckId provided
    if (deckId) {
      const deck = await prisma.deck.findFirst({
        where: { id: deckId, userId },
      });

      if (!deck) {
        return res.status(404).json({
          success: false,
          message: 'Deck not found',
        });
      }
    }

    const session = await prisma.studySession.create({
      data: {
        userId,
        deckId: deckId || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Study session started',
      data: { session },
    });
  } catch (error) {
    console.error('Start study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// End study session
router.put('/session/:id/end', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { cardsStudied, correctCards, totalTime } = req.body;
    const userId = req.user!.id;

    // Verify session ownership
    const existingSession = await prisma.studySession.findFirst({
      where: { id, userId, completedAt: null },
    });

    if (!existingSession) {
      return res.status(404).json({
        success: false,
        message: 'Active study session not found',
      });
    }

    const averageQuality =
      correctCards > 0 ? (correctCards / cardsStudied) * 5 : 0;

    const session = await prisma.studySession.update({
      where: { id },
      data: {
        cardsStudied: cardsStudied || 0,
        correctCards: correctCards || 0,
        totalTime: totalTime || 0,
        averageQuality,
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Study session completed',
      data: { session },
    });
  } catch (error) {
    console.error('End study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get study sessions
router.get('/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, deckId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      userId,
      ...(deckId && { deckId: deckId as string }),
    };

    const [sessions, total] = await Promise.all([
      prisma.studySession.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          deck: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.studySession.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get study sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get study progress
router.get('/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const [studyStreak, totalStudyTime, cardsLearned, sessionStats] =
      await Promise.all([
        // Calculate study streak (consecutive days with sessions)
        prisma.studySession.findMany({
          where: {
            userId,
            completedAt: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),

        // Total study time in period
        prisma.studySession.aggregate({
          where: {
            userId,
            completedAt: {
              gte: startDate,
              lte: endDate,
              not: null,
            },
          },
          _sum: {
            totalTime: true,
          },
        }),

        // Cards learned in period (reviews with quality >= 3)
        prisma.review.count({
          where: {
            userId,
            quality: { gte: 3 },
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        // Session statistics
        prisma.studySession.groupBy({
          by: ['createdAt'],
          where: {
            userId,
            completedAt: {
              gte: startDate,
              lte: endDate,
              not: null,
            },
          },
          _sum: {
            cardsStudied: true,
            correctCards: true,
            totalTime: true,
          },
          _count: {
            id: true,
          },
        }),
      ]);

    // Calculate study streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const studyDates = studyStreak.map((session) => {
      const date = new Date(session.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    const uniqueStudyDates = [...new Set(studyDates)].sort((a, b) => b - a);

    for (let i = 0; i < uniqueStudyDates.length; i++) {
      const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      if (uniqueStudyDates[i] === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        period,
        studyStreak: streak,
        totalStudyTime: totalStudyTime._sum.totalTime || 0,
        cardsLearned,
        averageSessionTime:
          sessionStats.length > 0
            ? Math.round(
                sessionStats.reduce(
                  (sum, stat) => sum + (stat._sum.totalTime || 0),
                  0
                ) / sessionStats.length
              )
            : 0,
        sessionsPerDay: sessionStats.map((stat) => ({
          date: stat.createdAt,
          sessions: stat._count.id,
          cardsStudied: stat._sum.cardsStudied || 0,
          correctCards: stat._sum.correctCards || 0,
          totalTime: stat._sum.totalTime || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Get study progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
