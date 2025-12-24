import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * List all pending payments (manager/admin only)
 * GET /api/payments/pending
 */
router.get('/pending', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const isManager = user.assignedRole?.name === 'MANAGER' || user.loginType === 'MANAGER';
    const isAdmin = user.assignedRole?.name === 'ADMIN' || user.loginType === 'ADMIN';
    
    if (!isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const payments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        pass: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      payments: payments.map((payment) => ({
        id: payment.id,
        userId: payment.userId,
        userName: payment.user.profile?.fullName || payment.user.username,
        userEmail: payment.user.email,
        passId: payment.passId,
        passCode: payment.pass?.passCode,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        reference: payment.reference,
        proofUrl: payment.proofUrl,
        createdAt: payment.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error listing pending payments:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to list pending payments',
    });
  }
});

/**
 * Verify payment (approve/reject) (manager/admin only)
 * PATCH /api/payments/:id/verify
 * Body: { action: 'APPROVE' | 'REJECT' }
 */
router.patch('/:id/verify', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const isManager = user.assignedRole?.name === 'MANAGER' || user.loginType === 'MANAGER';
    const isAdmin = user.assignedRole?.name === 'ADMIN' || user.loginType === 'ADMIN';
    
    if (!isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const { action } = req.body;

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return res.status(400).json({
        success: false,
        error: 'Action must be APPROVE or REJECT',
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        pass: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Payment is not pending',
      });
    }

    const newStatus = action === 'APPROVE' ? 'PAID' : 'FAILED';

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: { status: newStatus },
    });

    // If approved and has pass, activate the pass
    if (action === 'APPROVE' && payment.passId) {
      await prisma.pass.update({
        where: { id: payment.passId },
        data: { status: 'ACTIVE' },
      });

      // Create success notification
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Approved',
          message: `Your payment of ₹${payment.amount} has been approved. Your pass is now active.`,
          type: 'SUCCESS',
        },
      });
    } else if (action === 'REJECT') {
      // Create rejection notification
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Rejected',
          message: `Your payment of ₹${payment.amount} has been rejected. Please contact support.`,
          type: 'WARNING',
        },
      });

      // Reject the associated pass if exists
      if (payment.passId) {
        await prisma.pass.update({
          where: { id: payment.passId },
          data: { status: 'DISABLED' },
        });
      }
    }

    return res.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
      },
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to verify payment',
    });
  }
});

/**
 * Upload payment proof (for users)
 * PATCH /api/payments/:id/proof
 * Body: { proofUrl: string }
 */
router.patch('/:id/proof', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { id } = req.params;
    const { proofUrl } = req.body;

    if (!proofUrl) {
      return res.status(400).json({
        success: false,
        error: 'Proof URL is required',
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Only allow user to update their own payment
    if (payment.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: { proofUrl },
    });

    return res.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        proofUrl: updatedPayment.proofUrl,
      },
    });
  } catch (err) {
    console.error('Error updating payment proof:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to update payment proof',
    });
  }
});

export default router;

