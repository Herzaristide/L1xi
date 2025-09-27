import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { updateProfileSchema } from '../validation/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        trialEndDate: true,
        nativeLanguage: {
          select: {
            id: true,
            name: true,
            nativeName: true,
            flag: true,
          },
        },
        learningLanguage: {
          select: {
            id: true,
            name: true,
            nativeName: true,
            flag: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ownedDecks: true,
            ownedCards: true,
            cardStatuses: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update user profile
router.put('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details,
      });
    }

    // Validate language IDs if provided
    if (value.nativeLanguageId) {
      const nativeLanguage = await prisma.language.findUnique({
        where: { id: value.nativeLanguageId },
      });
      if (!nativeLanguage) {
        return res.status(400).json({
          success: false,
          message: 'Invalid native language ID',
        });
      }
    }

    if (value.learningLanguageId) {
      const learningLanguage = await prisma.language.findUnique({
        where: { id: value.learningLanguageId },
      });
      if (!learningLanguage) {
        return res.status(400).json({
          success: false,
          message: 'Invalid learning language ID',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: value,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        subscriptionStatus: true,
        nativeLanguage: {
          select: {
            id: true,
            name: true,
            nativeName: true,
            flag: true,
          },
        },
        learningLanguage: {
          select: {
            id: true,
            name: true,
            nativeName: true,
            flag: true,
          },
        },
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get user statistics
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const [decksCount, cardsCount, userCardStatuses] = await Promise.all([
      prisma.deck.count({ where: { ownerId: userId } }),
      prisma.card.count({ where: { ownerId: userId } }),
      prisma.userCardStatus.findMany({
        where: { userId },
        include: {
          card: {
            select: {
              id: true,
              front: true,
              type: true,
              difficulty: true,
            },
          },
        },
      }),
    ]);

    // Calculate learning statistics
    const cardsDue = userCardStatuses.filter(
      (status) => status.nextReviewAt && status.nextReviewAt <= new Date()
    ).length;

    const masteredCards = userCardStatuses.filter(
      (status) => status.status === 'MASTERED'
    ).length;

    const learningCards = userCardStatuses.filter(
      (status) => status.status === 'LEARNING'
    ).length;

    const newCards = userCardStatuses.filter(
      (status) => status.status === 'NEW'
    ).length;

    res.json({
      success: true,
      data: {
        stats: {
          ownedDecks: decksCount,
          ownedCards: cardsCount,
          totalStudyingCards: userCardStatuses.length,
          cardsDue,
          newCards,
          learningCards,
          masteredCards,
        },
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update subscription (admin only or self for trial)
router.put('/subscription', authenticate, async (req: AuthRequest, res) => {
  try {
    const { subscriptionStatus, subscriptionEndDate, trialEndDate } = req.body;
    const userId = req.user!.id;

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, subscriptionStatus: true },
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Only allow certain updates based on role and current status
    const allowedUpdates: any = {};

    if (currentUser.role === 'ADMIN') {
      // Admins can update any subscription field
      if (subscriptionStatus)
        allowedUpdates.subscriptionStatus = subscriptionStatus;
      if (subscriptionEndDate)
        allowedUpdates.subscriptionEndDate = new Date(subscriptionEndDate);
      if (trialEndDate) allowedUpdates.trialEndDate = new Date(trialEndDate);

      // Set subscription start date for paid plans
      if (
        subscriptionStatus &&
        subscriptionStatus !== 'FREE' &&
        subscriptionStatus !== 'TRIAL'
      ) {
        allowedUpdates.subscriptionStartDate = new Date();
      }
    } else {
      // Regular users can only start trials
      if (
        subscriptionStatus === 'TRIAL' &&
        currentUser.subscriptionStatus === 'FREE'
      ) {
        allowedUpdates.subscriptionStatus = 'TRIAL';
        allowedUpdates.trialEndDate = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ); // 7 days trial
      } else {
        return res.status(403).json({
          success: false,
          message:
            'You can only start a trial. Contact support for other subscription changes.',
        });
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid updates provided',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: allowedUpdates,
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        trialEndDate: true,
      },
    });

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
