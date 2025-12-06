import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Create pass request (monthly/yearly)
 * POST /api/passes/create
 * Body: { type: 'MONTHLY' | 'YEARLY' }
 */
router.post('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { type } = req.body;

    if (!type || (type !== 'MONTHLY' && type !== 'YEARLY')) {
      return res.status(400).json({
        success: false,
        error: 'Type must be MONTHLY or YEARLY',
      });
    }

    // Check if user already has an active or pending pass
    const existingPass = await prisma.pass.findFirst({
      where: {
        userId: user.id,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPass) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active or pending pass',
      });
    }

    // Calculate dates
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    if (type === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Generate pass code
    const passCode = `PASS-${crypto.randomBytes(8).toString('hex').toUpperCase()}-${type.substring(0, 2)}`;

    // Create pass
    const pass = await prisma.pass.create({
      data: {
        userId: user.id,
        passCode,
        type,
        status: 'PENDING',
        startDate,
        endDate,
      },
    });

    // Create payment record
    const amount = type === 'MONTHLY' ? 500 : 5000; // Configure prices
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        passId: pass.id,
        amount,
        status: 'PENDING',
        method: 'ONLINE',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Pass Request Created',
        message: `Your ${type.toLowerCase()} pass request has been created and is pending approval.`,
        type: 'INFO',
      },
    });

    return res.json({
      success: true,
      pass: {
        id: pass.id,
        passCode: pass.passCode,
        type: pass.type,
        status: pass.status,
        startDate: pass.startDate,
        endDate: pass.endDate,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
      },
    });
  } catch (err) {
    console.error('Error creating pass:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to create pass',
    });
  }
});

export default router;
