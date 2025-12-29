import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get user's tickets (with additional info)
 * GET /api/tickets/list
 */
router.get('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            stops: true,
            scheduleTime: true,
            active: true,
          }
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return res.json({
      success: true,
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        routeId: ticket.routeId,
        route: ticket.route
          ? {
              id: ticket.route.id,
              name: ticket.route.name,
              stops: ticket.route.stops,
              scheduleTime: ticket.route.scheduleTime,
              active: ticket.route.active,
            }
          : null,
        ticketType: ticket.ticketType,
        purchaseDate: ticket.purchaseDate,
        validUntil: ticket.validUntil,
        paymentStatus: ticket.paymentStatus,
        createdAt: ticket.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error listing tickets:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to list tickets',
    });
  }
});

export default router;
