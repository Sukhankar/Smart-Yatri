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
    const total = parseNumber(totalSeats, 'totalSeats', 1);
    const base = parseNumber(basePrice, 'basePrice', 0);

    let available = availableSeats != null ? Number(availableSeats) : total;
    if (Number.isNaN(available) || available < 0 || available > total) {
      available = total;
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

export default router;

