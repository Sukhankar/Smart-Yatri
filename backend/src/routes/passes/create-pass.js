import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Create pass request (monthly/yearly) - Step 1: Initialize pass and payment
 * POST /api/passes/create
 * Body: { type: 'MONTHLY' | 'YEARLY' }
 */
router.post('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { type, userId: targetUserId, targetRole } = req.body;

    if (!type || (type !== 'MONTHLY' && type !== 'YEARLY')) {
      return res.status(400).json({
        success: false,
        error: 'Type must be MONTHLY or YEARLY',
      });
    }

    // Determine target user or broadcast role
    let targetUser = user;
    let broadcastRole = null;
    if (targetUserId != null) {
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
      const roleUpper = String(targetRole).toUpperCase();
      if (!['STUDENT', 'STAFF', 'REGULAR'].includes(roleUpper)) {
        return res.status(400).json({ success: false, error: 'Invalid targetRole' });
      }
      const roleName = user.assignedRole?.name || user.loginType;
      if (!['ADMIN', 'MANAGER'].includes(String(roleName).toUpperCase())) {
        return res.status(403).json({ success: false, error: 'Unauthorized to create broadcast passes' });
      }
      broadcastRole = roleUpper;
    }

    // Check if target user already has an active or pending pass
    const existingPass = await prisma.pass.findFirst({
      where: {
        userId: targetUser.id,
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
    const passData = {
      passCode,
      type,
      status: 'PENDING',
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

    // Create payment record
    const amount = type === 'MONTHLY' ? 500 : 5000; // Configure prices
    const paymentData = {
      passId: pass.id,
      amount,
      status: 'PENDING',
      method: 'UPI',
      reference: null,
      proofUrl: null,
    };
    if (!broadcastRole) paymentData.userId = targetUser.id;

    const payment = await prisma.payment.create({ data: paymentData });

    // Create notification for the user or broadcast
    const notif = {
      title: 'Pass Created',
      message: `A ${type.toLowerCase()} pass has been created.`,
      type: 'SUCCESS',
    };
    if (broadcastRole) {
      notif.broadcastRole = broadcastRole;
    } else {
      notif.userId = targetUser.id;
    }
    await prisma.notification.create({ data: notif });

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
