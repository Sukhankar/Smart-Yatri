import express from 'express';
import logger from '../../utils/logger.js';
import { validateSession } from '../../lib/auth.js';
import prisma from '../../lib/prisma.js';
import { getOrCreatePricingRule } from '../../models/PricingRule.js'; // Still use for price calculation

const router = express.Router();

function ensureAdmin(user) {
  const role = user.assignedRole?.name || user.loginType;
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';

  if (!isAdmin && !isManager) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }
}

function parseNumber(value, field, min = 0) {
  if (value === undefined || value === null || value === '') {
    const err = new Error(`${field} is required`);
    err.status = 400;
    throw err;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num < min) {
    const err = new Error(`${field} must be a number >= ${min}`);
    err.status = 400;
    throw err;
  }
  return num;
}

function parseDate(value, field) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) {
    const err = new Error(`${field} is invalid`);
    err.status = 400;
    throw err;
  }
  return d;
}

/**
 * List ticket sessions with optional filters
 * GET /api/admin/ticket-sessions
 * Query: status, fromDate, toDate, routeSearch, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    ensureAdmin(user);

    const { status, fromDate, toDate, routeSearch, page = 1, limit = 50 } = req.query;

    const where = {};
    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
      where.status = status;
    }
    if (fromDate || toDate) {
      where.departureTime = {};
      if (fromDate) {
        where.departureTime.gte = new Date(fromDate);
      }
      if (toDate) {
        where.departureTime.lte = new Date(toDate);
      }
    }
    if (routeSearch) {
      where.routeInfo = { contains: routeSearch, mode: 'insensitive' };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [sessions, total] = await Promise.all([
      prisma.ticketSession.findMany({
        where,
        orderBy: { departureTime: 'asc' },
        take: limitNum,
        skip,
      }),
      prisma.ticketSession.count({ where }),
    ]);

    return res.json({
      success: true,
      sessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error('Error listing ticket sessions:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to list ticket sessions',
    });
  }
});

/**
 * Create a new ticket session
 * POST /api/admin/ticket-sessions
 * Body: { title, routeInfo, departureTime, totalSeats, availableSeats?, basePrice }
 */
router.post('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    ensureAdmin(user);

    const { title, routeInfo, departureTime, totalSeats, availableSeats, basePrice } =
      req.body || {};

    if (!title || !routeInfo) {
      return res.status(400).json({
        success: false,
        error: 'title and routeInfo are required',
      });
    }

    const depTime = parseDate(departureTime, 'departureTime');

    // totalSeats is optional now. If provided, validate it; otherwise leave null/undefined.
    let total = null;
    if (totalSeats !== undefined && totalSeats !== null && totalSeats !== '') {
      total = parseNumber(totalSeats, 'totalSeats', 1);
    }

    const base = parseNumber(basePrice, 'basePrice', 0);

    // availableSeats is optional. If provided, validate and clamp to total when total is present.
    let available = null;
    if (availableSeats !== undefined && availableSeats !== null && availableSeats !== '') {
      const parsedAvail = Number(availableSeats);
      if (!Number.isNaN(parsedAvail) && parsedAvail >= 0) {
        available = parsedAvail;
      }
    }

    if (total != null) {
      // if available not provided, default to total
      if (available == null) available = total;
      // clamp available to [0, total]
      if (available > total) available = total;
      if (available < 0) available = 0;
    }

    // Fetch pricing rule to compute user-type prices server-side
    const pricingRule = await getOrCreatePricingRule('DAILY');

    const factor = base > 0 && pricingRule.basePrice > 0
      ? base / pricingRule.basePrice
      : 1;

    const created = await prisma.TicketSession.create({
      data: {
        title: title.trim(),
        routeInfo: routeInfo.trim(),
        departureTime: depTime,
        totalSeats: total,
        availableSeats: available,
        basePrice: base,
        studentPrice: Math.round(pricingRule.studentPrice * factor),
        staffPrice: Math.round(pricingRule.staffPrice * factor),
        regularPrice: Math.round(pricingRule.regularPrice * factor),
        status: 'ACTIVE',
      },
    });

    return res.status(201).json({
      success: true,
      session: created,
    });
  } catch (err) {
    logger.error('Error creating ticket session:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to create ticket session',
    });
  }
});

/**
 * Update a ticket session
 * PUT /api/admin/ticket-sessions/:id
 * Body: { title?, routeInfo?, departureTime?, totalSeats?, availableSeats?, basePrice?, status? }
 */
router.put('/:id', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    ensureAdmin(user);

    const { id } = req.params;
    const existing = await prisma.ticketSession.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Ticket session not found',
      });
    }

    const updates = {};
    const body = req.body || {};

    if (body.title != null) updates.title = String(body.title).trim();
    if (body.routeInfo != null) updates.routeInfo = String(body.routeInfo).trim();
    if (body.departureTime != null) {
      updates.departureTime = parseDate(body.departureTime, 'departureTime');
    }
    if (body.totalSeats != null) {
      updates.totalSeats = parseNumber(body.totalSeats, 'totalSeats', 1);
      // Ensure availableSeats does not exceed totalSeats
      if (
        body.availableSeats == null &&
        (existing.availableSeats || 0) > updates.totalSeats
      ) {
        updates.availableSeats = updates.totalSeats;
      }
    }
    if (body.availableSeats != null) {
      const total = updates.totalSeats ?? existing.totalSeats;
      let avail = parseNumber(body.availableSeats, 'availableSeats', 0);
      if (avail > total) avail = total;
      updates.availableSeats = avail;
    }

    let baseChanged = false;
    if (body.basePrice != null) {
      updates.basePrice = parseNumber(body.basePrice, 'basePrice', 0);
      baseChanged = true;
    }

    if (body.status && ['ACTIVE', 'INACTIVE'].includes(body.status)) {
      updates.status = body.status;
    }

    // If base price changed, recompute user-type prices using the same rule
    if (baseChanged) {
      const pricingRule = await getOrCreatePricingRule('DAILY');
      const base = updates.basePrice;
      const factor = base > 0 && pricingRule.basePrice > 0
        ? base / pricingRule.basePrice
        : 1;

      updates.studentPrice = Math.round(pricingRule.studentPrice * factor);
      updates.staffPrice = Math.round(pricingRule.staffPrice * factor);
      updates.regularPrice = Math.round(pricingRule.regularPrice * factor);
    }

    const updated = await prisma.ticketSession.update({
      where: { id: Number(id) },
      data: updates,
    });

    return res.json({
      success: true,
      session: updated,
    });
  } catch (err) {
    logger.error('Error updating ticket session:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to update ticket session',
    });
  }
});

/**
 * Delete a ticket session
 * DELETE /api/admin/ticket-sessions/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    ensureAdmin(user);

    const { id } = req.params;

    // Ensure exists
    const existing = await prisma.TicketSession.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Ticket session not found',
      });
    }

    await prisma.ticketSession.delete({
      where: { id: Number(id) },
    });

    return res.json({
      success: true,
      message: 'Ticket session deleted',
    });
  } catch (err) {
    logger.error('Error deleting ticket session:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to delete ticket session',
    });
  }
});

/**
 * Toggle session status (enable/disable)
 * PATCH /api/admin/ticket-sessions/:id/status
 * Body: { status: 'ACTIVE' | 'INACTIVE' }
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    ensureAdmin(user);

    const { id } = req.params;
    const { status } = req.body || {};

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be ACTIVE or INACTIVE',
      });
    }

    // Ensure exists
    const existing = await prisma.ticketSession.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Ticket session not found',
      });
    }

    const updated = await prisma.ticketSession.update({
      where: { id: Number(id) },
      data: { status },
    });

    return res.json({
      success: true,
      session: updated,
    });
  } catch (err) {
    logger.error('Error updating ticket session status:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to update ticket session status',
    });
  }
});

/**
 * Issue a ticket or pass for a session on behalf of a user (admin/manager)
 * POST /api/admin/ticket-sessions/:id/issue
 * Body: { kind: 'ticket'|'pass', userId: number, ticketType?: 'DAILY'|'MONTHLY'|'YEARLY', passType?: 'MONTHLY'|'YEARLY' }
 */
router.post('/:id/issue', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    ensureAdmin(user);

    const { id } = req.params;
    const { kind, userId: targetUserId, ticketType = 'DAILY', passType = 'MONTHLY' } = req.body || {};

    const session = await prisma.TicketSession.findUnique({ where: { id: Number(id) } });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Ticket session not found' });
    }

    // Allow issuing to a specific user (userId) OR as a broadcast to a role (targetRole)
    let targetUser = null;
    let broadcastRole = null;
    if (targetUserId) {
      targetUser = await prisma.userLogin.findUnique({ where: { id: Number(targetUserId) } });
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'Target user not found' });
      }
    } else if (req.body.targetRole) {
      const roleUpper = String(req.body.targetRole).toUpperCase();
      if (!['STUDENT', 'STAFF', 'REGULAR'].includes(roleUpper)) {
        return res.status(400).json({ success: false, error: 'Invalid targetRole' });
      }
      broadcastRole = roleUpper;
    } else {
      return res.status(400).json({ success: false, error: 'userId or targetRole is required' });
    }

    if (kind === 'ticket') {
      // Determine amount based on session prices and user type
      let userType = 'REGULAR';
      if (targetUser) {
        if (targetUser.assignedRole?.name) userType = targetUser.assignedRole.name.toUpperCase();
        else if (targetUser.loginType) userType = targetUser.loginType.toUpperCase();
      } else if (broadcastRole) {
        userType = broadcastRole;
      }

      let amount = session.regularPrice;
      if (userType === 'STUDENT') amount = session.studentPrice;
      else if (userType === 'STAFF') amount = session.staffPrice;

      const now = new Date();
      let validUntil = new Date(now);
      if (ticketType === 'DAILY') {
        validUntil.setHours(23, 59, 59, 999);
      } else if (ticketType === 'MONTHLY') {
        validUntil.setMonth(validUntil.getMonth() + 1);
        validUntil.setHours(0,0,0,0);
        validUntil = new Date(validUntil.getTime() - 1);
      } else if (ticketType === 'YEARLY') {
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        validUntil.setHours(0,0,0,0);
        validUntil = new Date(validUntil.getTime() - 1);
      }

      const ticketData = {
        routeId: null,
        ticketType: ticketType,
        paymentStatus: 'PAID',
        purchaseDate: now,
        validUntil,
      };
      if (broadcastRole) {
        ticketData.targetRole = broadcastRole;
        ticketData.userId = null;
      } else {
        ticketData.userId = targetUser.id;
      }

      const ticket = await prisma.ticket.create({ data: ticketData });

      const paymentData = {
        amount: Math.round(amount),
        status: 'PAID',
        method: 'ADMIN_ISSUE',
        description: `Issued ticket for session ${session.title}`,
      };
      if (!broadcastRole) paymentData.userId = targetUser.id;

      const payment = await prisma.payment.create({ data: paymentData });

      return res.json({ success: true, ticket: ticket, payment });
    }

    if (kind === 'pass') {
      // Create a pass (use passType MONTHLY|YEARLY)
      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(0,0,0,0);
      const endDate = new Date(startDate);
      if (passType === 'MONTHLY') endDate.setMonth(endDate.getMonth() + 1);
      else endDate.setFullYear(endDate.getFullYear() + 1);

      const passCode = `PASS-${Math.random().toString(36).slice(2,10).toUpperCase()}-${passType.substring(0,2)}`;

      const passData = {
        passCode,
        type: passType,
        status: 'ACTIVE',
        startDate,
        endDate,
      };
      if (broadcastRole) {
        passData.targetRole = broadcastRole;
        passData.userId = null;
      } else {
        passData.userId = targetUser.id;
      }

      const pass = await prisma.pass.create({ data: passData });

      const amount = passType === 'MONTHLY' ? 500 : 5000; // keep same pricing as create-pass
      const paymentData = {
        passId: pass.id,
        amount,
        status: 'PAID',
        method: 'ADMIN_ISSUE',
        description: `Issued pass ${passCode} for session ${session.title}`,
      };
      if (!broadcastRole) paymentData.userId = targetUser.id;

      const payment = await prisma.payment.create({ data: paymentData });

      return res.json({ success: true, pass, payment });
    }

    return res.status(400).json({ success: false, error: 'Invalid kind; expected ticket or pass' });
  } catch (err) {
    logger.error('Error issuing for ticket session:', err);
    return res.status(err.status || 500).json({ success: false, error: err.message || 'Failed to issue' });
  }
});

export default router;

