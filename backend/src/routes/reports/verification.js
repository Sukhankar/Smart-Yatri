import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Admin/Manager verification view across tickets & passes.
 *
 * GET /api/reports/verification
 * Query:
 *  - type: 'tickets' | 'passes' | 'all'
 *  - from: ISO date (YYYY-MM-DD)
 *  - to: ISO date (YYYY-MM-DD)
 *  - userType: 'STUDENT' | 'STAFF' | 'REGULAR'
 *  - status: 'verified' | 'pending' | 'rejected'
 *  - minPrice, maxPrice: numbers (applied to passes via payment.amount)
 */
router.get('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const role = user.assignedRole?.name || user.loginType;
    const isManager = role === 'MANAGER';
    const isAdmin = role === 'ADMIN';

    if (!isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const {
      type = 'all',
      from,
      to,
      userType,
      status,
      minPrice,
      maxPrice,
    } = req.query;

    let fromDate;
    let toDate;
    if (from) {
      fromDate = new Date(String(from));
    }
    if (to) {
      toDate = new Date(String(to));
      // include entire day
      toDate.setHours(23, 59, 59, 999);
    }

    const userTypeFilter =
      userType && ['STUDENT', 'STAFF', 'REGULAR'].includes(String(userType))
        ? String(userType)
        : undefined;

    const normStatus =
      status && ['verified', 'pending', 'rejected'].includes(String(status))
        ? String(status)
        : undefined;

    const minAmt = minPrice != null ? Number(minPrice) : undefined;
    const maxAmt = maxPrice != null ? Number(maxPrice) : undefined;

    const records = [];

    // Helper to see if a payment amount fits price range
    const inPriceRange = (amount) => {
      if (amount == null) return true;
      if (minAmt != null && amount < minAmt) return false;
      if (maxAmt != null && amount > maxAmt) return false;
      return true;
    };

    // PASSES
    if (type === 'passes' || type === 'all') {
      const passWhere = {};
      if (fromDate || toDate) {
        passWhere.createdAt = {};
        if (fromDate) passWhere.createdAt.gte = fromDate;
        if (toDate) passWhere.createdAt.lte = toDate;
      }

      const passes = await prisma.pass.findMany({
        where: passWhere,
        include: {
          user: {
            include: { profile: true },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const p of passes) {
        const payment = p.payments[0] || null;
        const rawUserType = p.user.profile?.roleType || p.user.loginType;
        const logicalUserType =
          rawUserType === 'STUDENT' || rawUserType === 'STAFF'
            ? rawUserType
            : 'REGULAR';

        if (userTypeFilter && logicalUserType !== userTypeFilter) continue;

        const amount = payment?.amount ?? null;
        if (!inPriceRange(amount)) continue;

        let verificationStatus = 'pending';
        if (payment?.status === 'PAID' && p.status === 'ACTIVE') {
          verificationStatus = 'verified';
        } else if (payment?.status === 'FAILED' || p.status === 'DISABLED') {
          verificationStatus = 'rejected';
        }

        if (normStatus && verificationStatus !== normStatus) continue;

        records.push({
          id: `PASS-${p.id}`,
          kind: 'PASS',
          userName: p.user.profile?.fullName || p.user.username,
          userType: logicalUserType,
          status: verificationStatus,
          rawStatus: p.status,
          createdAt: p.createdAt,
          price: amount,
          label: p.type,
        });
      }
    }

    // TICKETS – price range currently not enforced due to lack of ticket-linked payment
    if (type === 'tickets' || type === 'all') {
      const ticketWhere = {};
      if (fromDate || toDate) {
        ticketWhere.purchaseDate = {};
        if (fromDate) ticketWhere.purchaseDate.gte = fromDate;
        if (toDate) ticketWhere.purchaseDate.lte = toDate;
      }

      const tickets = await prisma.ticket.findMany({
        where: ticketWhere,
        include: {
          user: {
            include: { profile: true },
          },
          route: true,
        },
        orderBy: { purchaseDate: 'desc' },
      });

      for (const t of tickets) {
        const rawUserType = t.user.profile?.roleType || t.user.loginType;
        const logicalUserType =
          rawUserType === 'STUDENT' || rawUserType === 'STAFF'
            ? rawUserType
            : 'REGULAR';
        if (userTypeFilter && logicalUserType !== userTypeFilter) continue;

        let verificationStatus = 'pending';
        if (t.paymentStatus === 'PAID') {
          verificationStatus = 'verified';
        } else if (t.paymentStatus === 'FAILED') {
          verificationStatus = 'rejected';
        }

        if (normStatus && verificationStatus !== normStatus) continue;

        records.push({
          id: `TICKET-${t.id}`,
          kind: 'TICKET',
          userName: t.user.profile?.fullName || t.user.username,
          userType: logicalUserType,
          status: verificationStatus,
          rawStatus: t.paymentStatus,
          createdAt: t.purchaseDate,
          price: null,
          label: t.ticketType,
          routeName: t.route?.name || '',
        });
      }
    }

    // Basic summary for quick counts
    const summary = records.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.kind === 'PASS') acc.passes += 1;
        if (r.kind === 'TICKET') acc.tickets += 1;
        if (r.status === 'verified') acc.verified += 1;
        if (r.status === 'pending') acc.pending += 1;
        if (r.status === 'rejected') acc.rejected += 1;
        return acc;
      },
      { total: 0, tickets: 0, passes: 0, verified: 0, pending: 0, rejected: 0 }
    );

    return res.json({
      success: true,
      summary,
      records,
    });
  } catch (err) {
    console.error('Error getting verification records:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to get verification records',
    });
  }
});

export default router;

