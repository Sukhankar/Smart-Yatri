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

    const pass = await prisma.pass.findFirst({
      where: { userId: user.id },
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
