import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get user's pass
 * GET /api/passes/user
 */
router.get('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    // Try to find a user-specific pass first; if none, find an active broadcast pass for user's role
    const userRole = user.assignedRole?.name ? user.assignedRole.name.toUpperCase() : (user.loginType || 'REGULAR').toUpperCase();
    const pass = await prisma.pass.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { userId: null, targetRole: userRole, status: 'ACTIVE' },
        ],
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pass) {
      return res.json({
        success: true,
        pass: null,
      });
    }

    // Check if pass is expired
    const now = new Date();
    if (pass.endDate < now && pass.status === 'ACTIVE') {
      await prisma.pass.update({
        where: { id: pass.id },
        data: { status: 'EXPIRED' },
      });
      pass.status = 'EXPIRED';
    }

    const payment = pass.payments[0] || null;

    return res.json({
      success: true,
      pass: {
        id: pass.id,
        passCode: pass.passCode,
        type: pass.type,
        status: pass.status,
        startDate: pass.startDate,
        endDate: pass.endDate,
        createdAt: pass.createdAt,
      },
      payment: payment
        ? {
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            method: payment.method,
            reference: payment.reference,
            proofUrl: payment.proofUrl,
          }
        : null,
    });
  } catch (err) {
    console.error('Error getting user pass:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to get pass',
    });
  }
});

export default router;
