import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';
import { getOrCreatePricingRule } from '../../models/PricingRule.js';

const router = express.Router();

/**
 * Create/purchase a ticket (supports any ticketType)
 * POST /api/tickets/create
 * Body: { routeId: number, ticketType: 'DAILY'|'MONTHLY'|'YEARLY' }
 */
router.post('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { routeId, ticketType = 'DAILY', userId: targetUserId, targetRole } = req.body;

    // ticketType validation and normalization
    const validTicketTypes = ['DAILY', 'MONTHLY', 'YEARLY'];
    const type = String(ticketType || '').toUpperCase();
    if (!validTicketTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticketType. Must be DAILY, MONTHLY, or YEARLY',
      });
    }

    // Route is required for all ticket purchases
    if (!routeId) {
      return res.status(400).json({
        success: false,
        error: 'Route ID is required',
      });
    }

    // Verify the route exists & is active
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

    // Calculate purchaseDate & validUntil per ticketType
    const now = new Date();

    let validUntil = new Date(now);

    if (type === 'DAILY') {
      // Set valid until end of today
      validUntil.setHours(23, 59, 59, 999);

      // Prevent duplicate purchase for same route on same day for this user if PAID
      const validTicketExists = await prisma.ticket.findFirst({
        where: {
          userId: user.id,
          routeId: parseInt(routeId),
          paymentStatus: 'PAID',
          purchaseDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
            lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
          },
          validUntil: { gte: now },
        },
      });

      if (validTicketExists) {
        return res.status(400).json({
          success: false,
          error: 'You already have a valid ticket for this route today',
        });
      }
    } else if (type === 'MONTHLY') {
      // valid until same day, next month minus 1 ms
      validUntil = new Date(now);
      validUntil.setMonth(validUntil.getMonth() + 1);
      validUntil.setHours(0, 0, 0, 0);
      validUntil = new Date(validUntil.getTime() - 1);

      // Optional: Prevent purchase if one is already active
      const activeMonthly = await prisma.ticket.findFirst({
        where: {
          userId: user.id,
          routeId: parseInt(routeId),
          ticketType: 'MONTHLY',
          paymentStatus: 'PAID',
          validUntil: { gte: now },
        },
      });
      if (activeMonthly) {
        return res.status(400).json({
          success: false,
          error: 'You already have an active monthly ticket for this route',
        });
      }
    } else if (type === 'YEARLY') {
      validUntil = new Date(now);
      validUntil.setFullYear(validUntil.getFullYear() + 1);
      validUntil.setHours(0, 0, 0, 0);
      validUntil = new Date(validUntil.getTime() - 1);

      // Optional: Prevent purchase if one is already active
      const activeYearly = await prisma.ticket.findFirst({
        where: {
          userId: user.id,
          routeId: parseInt(routeId),
          ticketType: 'YEARLY',
          paymentStatus: 'PAID',
          validUntil: { gte: now },
        },
      });
      if (activeYearly) {
        return res.status(400).json({
          success: false,
          error: 'You already have an active yearly ticket for this route',
        });
      }
    }

    // Pricing rule fetch (backend has authority)
    const pricingRule = await getOrCreatePricingRule(type);
    // Determine which user this ticket is being created for.
    // If `userId` provided, admins/managers may create for that user.
    // If `targetRole` provided (and no userId), create an unassigned (broadcast) ticket
    // available to all users of that role/loginType.
    let targetUser = user;
    let broadcastRole = null;
    if (targetUserId != null) {
      // allow only admins/managers to create for other users
      const roleName = user.assignedRole?.name || user.loginType;
      if (!['ADMIN', 'MANAGER'].includes(String(roleName).toUpperCase())) {
        return res.status(403).json({ success: false, error: 'Unauthorized to create for other users' });
      }
      const found = await prisma.userLogin.findUnique({ where: { id: Number(targetUserId) } });
      if (!found) {
        return res.status(404).json({ success: false, error: 'Target user not found' });
      }
      targetUser = found;
    } else if (targetRole) {
      // create a broadcast/unassigned ticket for this role
      const roleUpper = String(targetRole).toUpperCase();
      if (!['STUDENT', 'STAFF', 'REGULAR'].includes(roleUpper)) {
        return res.status(400).json({ success: false, error: 'Invalid targetRole' });
      }
      // only admins/managers may create broadcast tickets
      const roleName = user.assignedRole?.name || user.loginType;
      if (!['ADMIN', 'MANAGER'].includes(String(roleName).toUpperCase())) {
        return res.status(403).json({ success: false, error: 'Unauthorized to create broadcast tickets' });
      }
      broadcastRole = roleUpper;
    }

    // Priority: assignedRole.name > loginType > default REGULAR
    let userType = 'REGULAR';
    if (targetUser.assignedRole?.name) {
      userType = targetUser.assignedRole.name.toUpperCase();
    } else if (targetUser.loginType) {
      userType = targetUser.loginType.toUpperCase();
    }
    let amount = pricingRule.regularPrice;
    if (userType === 'STUDENT') {
      amount = pricingRule.studentPrice;
    } else if (userType === 'STAFF') {
      amount = pricingRule.staffPrice;
    }

    // Create the ticket record (PENDING payment at this point)
    const ticketData = {
      routeId: parseInt(routeId),
      ticketType: type,
      paymentStatus: 'PENDING',
      purchaseDate: now,
      validUntil: validUntil,
    };
    if (broadcastRole) {
      ticketData.targetRole = broadcastRole;
      ticketData.userId = null;
    } else {
      ticketData.userId = targetUser.id;
    }

    const ticket = await prisma.ticket.create({
      data: ticketData,
      include: { route: true },
    });

    // Create payment record and link to user (may be linked to ticket in future via ticketId)
    const paymentData = {
      amount,
      status: 'PENDING',
      method: 'ONLINE',
      description: `Ticket purchase: ${type} for route ${route.name}`,
    };
    if (!broadcastRole) paymentData.userId = targetUser.id;

    const payment = await prisma.payment.create({
      data: paymentData,
    });

    // Simulate payment success (real code should integrate gateway)
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID' },
    });

    // Set ticket as paid
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { paymentStatus: 'PAID' },
      include: { route: true },
    });

    // Create notification: if created for a specific user, notify them; if broadcast, create a broadcast notification
    const notifData = {
      title: 'Ticket Issued',
      message: `A ${type.toLowerCase()} ticket for route ${route.name} has been issued.`,
      type: 'SUCCESS',
    };
    if (broadcastRole) {
      notifData.broadcastRole = broadcastRole;
    } else {
      notifData.userId = targetUser.id;
    }
    await prisma.notification.create({ data: notifData });

    return res.json({
      success: true,
      ticket: {
        id: updatedTicket.id,
        routeId: updatedTicket.routeId,
        routeName: updatedTicket.route?.name,
        ticketType: updatedTicket.ticketType,
        purchaseDate: updatedTicket.purchaseDate,
        validUntil: updatedTicket.validUntil,
        paymentStatus: updatedTicket.paymentStatus,
        amount: amount,
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
