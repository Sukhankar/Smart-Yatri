import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get user travel history
 * GET /api/travel-history/list
 */
router.get('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const history = await prisma.travelHistory.findMany({
      where: { userId: user.id },
      include: {
        route: true,
      },
      orderBy: { travelDate: 'desc' },
      take: 100,
    });

    return res.json({
      success: true,
      history: history.map((entry) => ({
        id: entry.id,
        routeId: entry.routeId,
        routeName: entry.route?.name,
        travelDate: entry.travelDate,
        ticketType: entry.ticketType,
        validatedAt: entry.validatedAt,
      })),
    });
  } catch (err) {
    console.error('Error listing travel history:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to list travel history',
    });
  }
});

export default router;
