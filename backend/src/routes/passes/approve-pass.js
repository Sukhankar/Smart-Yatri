import express from 'express';
import multer from 'multer';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';
import { uploadPaymentProof, getFileUrl } from '../../utils/multer.js';

const router = express.Router();

/**
 * Approve or reject pass request (manager/admin only)
 * PATCH /api/passes/:id/approve
 * Body: { action: 'APPROVE' | 'REJECT', status: 'ACTIVE' | 'INACTIVE' }
 */
router.patch('/:id/approve', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    const isManager = user.assignedRole?.name === 'MANAGER' || user.loginType === 'MANAGER';
    const isAdmin = user.assignedRole?.name === 'ADMIN' || user.loginType === 'ADMIN';
    
    if (!isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to approve passes',
      });
    }

    const { id } = req.params;
    const { action, status } = req.body;

    const pass = await prisma.pass.findUnique({
      where: { id: parseInt(id) },
      include: { user: { include: { profile: true } } },
    });

    if (!pass) {
      return res.status(404).json({
        success: false,
        error: 'Pass not found',
      });
    }

    let newStatus;
    if (action === 'APPROVE') {
      newStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    } else if (action === 'REJECT') {
      newStatus = 'DISABLED';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use APPROVE or REJECT',
      });
    }

    const updatedPass = await prisma.pass.update({
      where: { id: parseInt(id) },
      data: { status: newStatus },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: pass.userId,
        title: `Pass ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
        message: `Your ${pass.type} pass request has been ${action === 'APPROVE' ? 'approved' : 'rejected'}.`,
        type: action === 'APPROVE' ? 'SUCCESS' : 'WARNING',
      },
    });

    return res.json({
      success: true,
      pass: {
        id: updatedPass.id,
        userId: updatedPass.userId,
        type: updatedPass.type,
        status: updatedPass.status,
        startDate: updatedPass.startDate,
        endDate: updatedPass.endDate,
      },
    });
  } catch (err) {
    console.error('Error approving pass:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to approve pass',
    });
  }
});

/**
 * List pending pass requests (manager/admin only)
 * GET /api/passes/pending
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

    const passes = await prisma.pass.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      passes: passes.map((pass) => ({
        id: pass.id,
        userId: pass.userId,
        userName: pass.user.profile?.fullName || pass.user.username,
        type: pass.type,
        status: pass.status,
        startDate: pass.startDate,
        endDate: pass.endDate,
        createdAt: pass.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error listing pending passes:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to list pending passes',
    });
  }
});

/**
 * Upload payment proof for pass
 * PATCH /api/passes/:id/payment-proof
 * Accepts multipart/form-data with 'paymentProof' field or JSON with 'proofUrl'
 */
router.patch('/:id/payment-proof', (req, res, next) => {
  // Only use multer if content-type is multipart/form-data
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    uploadPaymentProof(req, res, (err) => {
      if (err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File size too large. Maximum size is 5MB',
            });
          }
          return res.status(400).json({
            success: false,
            error: err.message,
          });
        }
        // Handle other errors (e.g., file filter errors)
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload error',
        });
      }
      next();
    });
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const { id } = req.params;
    
    let proofUrl;
    
    // Check if file was uploaded via multer
    if (req.file) {
      proofUrl = getFileUrl(req.file.filename);
    } else if (req.body.proofUrl) {
      // Fallback to JSON body for backward compatibility (base64 or URL)
      proofUrl = req.body.proofUrl;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Payment proof file or URL is required',
      });
    }

    const reference = req.body.reference || null;

    // Get pass
    const pass = await prisma.pass.findUnique({
      where: { id: parseInt(id) },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!pass) {
      return res.status(404).json({
        success: false,
        error: 'Pass not found',
      });
    }

    // Verify user owns this pass
    if (pass.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get the most recent payment
    const payment = pass.payments[0] || null;

    // Update payment with proof
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          proofUrl,
          reference: reference || null,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found for this pass',
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Payment Proof Uploaded',
        message: 'Your payment proof has been uploaded. Waiting for manager verification.',
        type: 'INFO',
      },
    });

    return res.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      proofUrl,
    });
  } catch (err) {
    console.error('Error uploading payment proof:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to upload payment proof',
    });
  }
});

export default router;
