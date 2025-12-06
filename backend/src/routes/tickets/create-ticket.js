import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Create/purchase a daily ticket
 * POST /api/tickets/create
 * Body: { routeId: number, ticketType: 'DAILY' }
 */
router.post('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { routeId, ticketType = 'DAILY' } = req.body;

    if (!routeId) {
      return res.status(400).json({
        success: false,
        error: 'Route ID is required',
      });
    }

    // Verify route exists
    const route = await prisma.route.findUnique({
      where: { id: parseInt(routeId) },
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found',
      });
    }

    if (!route.active) {
      return res.status(400).json({
        success: false,
        error: 'Route is not active',
      });
    }

    // Set valid until end of today
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setHours(23, 59, 59, 999);

    // Check if user already has a valid ticket for today
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        userId: user.id,
        routeId: parseInt(routeId),
        paymentStatus: 'PAID',
        purchaseDate: {
          gte: new Date(now.setHours(0, 0, 0, 0)),
        },
        validUntil: { gte: now },
      },
    });

    if (existingTicket) {
      return res.status(400).json({
        success: false,
        error: 'You already have a valid ticket for this route today',
      });
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        routeId: parseInt(routeId),
        ticketType: ticketType,
        paymentStatus: 'PENDING',
        purchaseDate: now,
        validUntil: validUntil,
      },
      include: {
        route: true,
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 50, // Default ticket price, can be configured
        status: 'PENDING',
        method: 'ONLINE',
      },
    });

    // Simulate payment success (in production, integrate with payment gateway)
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID' },
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { paymentStatus: 'PAID' },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Ticket Purchased',
        message: `Your ${ticketType.toLowerCase()} ticket for route ${route.name} has been purchased successfully.`,
        type: 'SUCCESS',
      },
    });

    return res.json({
      success: true,
      ticket: {
        id: ticket.id,
        routeId: ticket.routeId,
        routeName: ticket.route?.name,
        ticketType: ticket.ticketType,
        purchaseDate: ticket.purchaseDate,
        validUntil: ticket.validUntil,
        paymentStatus: 'PAID',
      },
    });
  } catch (err) {
    console.error('Error creating ticket:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to create ticket',
    });
  }
});

export default router;
