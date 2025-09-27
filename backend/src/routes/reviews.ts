import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Submit card review (spaced repetition)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { cardId, quality, timeSpent } = req.body;
    const userId = req.user!.id;

    // Validate input
    if (!cardId || quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review data. Quality must be between 0 and 5.',
      });
    }

    // Check if card exists and is accessible
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    // Get or create user card status
    let userCardStatus = await prisma.userCardStatus.findUnique({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
    });

    // SM-2 Algorithm implementation
    const calculateNextReview = (
      quality: number,
      easeFactor: number,
      interval: number,
      repetitions: number
    ) => {
      let newEaseFactor = easeFactor;
      let newInterval = interval;
      let newRepetitions = repetitions;
      let newStatus: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED' = 'LEARNING';

      if (quality >= 3) {
        // Correct response
        newRepetitions += 1;

        if (newRepetitions === 1) {
          newInterval = 1;
        } else if (newRepetitions === 2) {
          newInterval = 6;
        } else {
          newInterval = Math.round(interval * newEaseFactor);
        }

        // Update ease factor
        newEaseFactor =
          newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

        if (newEaseFactor < 1.3) {
          newEaseFactor = 1.3;
        }

        // Check if mastered (quality 4+ and interval > 21 days)
        if (quality >= 4 && newInterval > 21) {
          newStatus = 'MASTERED';
        } else if (newRepetitions >= 2) {
          newStatus = 'REVIEW';
        }
      } else {
        // Incorrect response
        newRepetitions = 0;
        newInterval = 1;
        newStatus = 'LEARNING';
      }

      return {
        easiness: newEaseFactor,
        interval: newInterval,
        repetition: newRepetitions,
        status: newStatus,
      };
    };

    const now = new Date();
    const reviewData = calculateNextReview(
      quality,
      userCardStatus?.easiness || 2.5,
      userCardStatus?.interval || 1,
      userCardStatus?.repetition || 0
    );

    // Calculate next review date
    const nextReviewAt = new Date(
      now.getTime() + reviewData.interval * 24 * 60 * 60 * 1000
    );

    // Update or create user card status
    if (userCardStatus) {
      userCardStatus = await prisma.userCardStatus.update({
        where: {
          userId_cardId: {
            userId,
            cardId,
          },
        },
        data: {
          status: reviewData.status,
          lastReviewedAt: now,
          nextReviewAt,
          reviewCount: { increment: 1 },
          correctCount: quality >= 3 ? { increment: 1 } : undefined,
          lastQuality: quality,
          interval: reviewData.interval,
          repetition: reviewData.repetition,
          easiness: reviewData.easiness,
        },
      });
    } else {
      userCardStatus = await prisma.userCardStatus.create({
        data: {
          userId,
          cardId,
          status: reviewData.status,
          lastReviewedAt: now,
          nextReviewAt,
          reviewCount: 1,
          correctCount: quality >= 3 ? 1 : 0,
          lastQuality: quality,
          interval: reviewData.interval,
          repetition: reviewData.repetition,
          easiness: reviewData.easiness,
        },
      });
    }

    // Update card statistics
    const existingStats = await prisma.cardStatistics.findUnique({
      where: { cardId },
    });

    let newAverageQuality: number;
    let newSuccessRate: number;

    if (existingStats) {
      // Calculate weighted average quality
      const totalReviews = existingStats.totalReviews + 1;
      const currentAverage = existingStats.averageQuality || 0;
      newAverageQuality =
        (currentAverage * existingStats.totalReviews + quality) / totalReviews;

      // Calculate new success rate
      const currentSuccessRate = existingStats.successRate || 0;
      const currentSuccessful = Math.round(
        (currentSuccessRate / 100) * existingStats.totalReviews
      );
      const newSuccessful = currentSuccessful + (quality >= 3 ? 1 : 0);
      newSuccessRate = Math.round((newSuccessful / totalReviews) * 100);
    } else {
      // First review
      newAverageQuality = quality;
      newSuccessRate = quality >= 3 ? 100 : 0;
    }

    await prisma.cardStatistics.upsert({
      where: { cardId },
      create: {
        cardId,
        totalReviews: 1,
        averageQuality: quality,
        successRate: quality >= 3 ? 100 : 0,
        lastReviewedAt: now,
      },
      update: {
        totalReviews: { increment: 1 },
        averageQuality: newAverageQuality,
        successRate: newSuccessRate,
        lastReviewedAt: now,
      },
    });

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        userCardStatus,
        nextReview: nextReviewAt,
      },
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get cards due for review
router.get('/due', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, languages, difficulty } = req.query;

    const now = new Date();
    const where: any = {
      userId,
      OR: [
        { nextReviewAt: { lte: now } }, // Cards due for review
        { status: 'NEW' }, // New cards
      ],
    };

    // Filter by card properties through the relation
    const cardWhere: any = {
      isArchived: false,
    };

    if (languages) {
      const languageArray = Array.isArray(languages) ? languages : [languages];
      cardWhere.OR = [
        { frontLanguageId: { in: languageArray } },
        { backLanguageId: { in: languageArray } },
      ];
    }

    if (difficulty !== undefined) {
      cardWhere.difficulty = Number(difficulty);
    }

    const cardStatuses = await prisma.userCardStatus.findMany({
      where: {
        ...where,
        card: cardWhere,
      },
      take: Number(limit),
      orderBy: [
        { status: 'asc' }, // NEW cards first
        { nextReviewAt: 'asc' }, // Then by due date
      ],
      include: {
        card: {
          include: {
            frontLanguage: true,
            backLanguage: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        cards: cardStatuses,
        count: cardStatuses.length,
      },
    });
  } catch (error) {
    console.error('Get due cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get review statistics
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { period = '7' } = req.query; // days

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - Number(period));

    const [totalReviews, correctReviews, cardStatuses] = await Promise.all([
      prisma.userCardStatus.aggregate({
        where: {
          userId,
          lastReviewedAt: { gte: periodStart },
        },
        _sum: { reviewCount: true },
      }),
      prisma.userCardStatus.aggregate({
        where: {
          userId,
          lastReviewedAt: { gte: periodStart },
        },
        _sum: { correctCount: true },
      }),
      prisma.userCardStatus.findMany({
        where: { userId },
        select: { status: true },
      }),
    ]);

    // Count cards by status
    const statusCounts = cardStatuses.reduce((acc, status) => {
      acc[status.status] = (acc[status.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalReviews: totalReviews._sum.reviewCount || 0,
      correctReviews: correctReviews._sum.correctCount || 0,
      accuracy: totalReviews._sum.reviewCount
        ? Math.round(
            ((correctReviews._sum.correctCount || 0) /
              totalReviews._sum.reviewCount) *
              100
          )
        : 0,
      statusCounts,
      period: Number(period),
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
