import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Verify a ticket by ID (for conductors - checks validity, route, etc.)
 * POST /api/tickets/verify
 * Body: { ticketId: number }
 * 
 * Returns: 
 *   { success: true, valid: boolean, ticket: {...info} }
 *   { success: false, error }
 */
router.post('/', async (req, res) => {
  try {
    // Conductors/managers only (in practice, may want to check user role)
    await validateSession(req);

    const { ticketId } = req.body;
    if (!ticketId) {
      return res.status(400).json({
        success: false,
        error: 'Ticket ID is required',
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(ticketId) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            assignedRole: { select: { name: true } },
            profile: {
              select: {
                fullName: true,
                qrId: true,
                roleType: true,
                photo: true
              }
            }
          }
        },
        route: true,
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Ticket not found',
      });
    }

    // Validity checks
    const now = new Date();
    let valid = true;
    let reason = null;

    if (ticket.paymentStatus !== 'PAID') {
      valid = false;
      reason = 'Ticket is not paid';
    } else if (ticket.validUntil && now > ticket.validUntil) {
      valid = false;
      reason = 'Ticket is expired';
    }

    return res.json({
      success: true,
      valid,
      ...(reason ? { reason } : {}),
      ticket: {
        id: ticket.id,
        routeId: ticket.routeId,
        route: ticket.route,
        user: ticket.user
          ? {
              id: ticket.user.id,
              username: ticket.user.username,
              role: ticket.user.assignedRole?.name || null,
              profile: ticket.user.profile,
            }
          : null,
        ticketType: ticket.ticketType,
        purchaseDate: ticket.purchaseDate,
        validUntil: ticket.validUntil,
        paymentStatus: ticket.paymentStatus,
        createdAt: ticket.createdAt,
      }
    });
  } catch (err) {
    console.error('Error verifying ticket:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
});

export default router;
