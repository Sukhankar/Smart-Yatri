import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Verify QR code (for conductor scanning)
 * POST /api/qr/verify
 * Body: { qrId: string, routeId?: number }
 */
router.post('/', async (req, res) => {
  try {
    // Verify conductor is authenticated
    const { user } = await validateSession(req);
    
    if (user.loginType !== 'CONDUCTOR' && user.assignedRole?.name !== 'CONDUCTOR') {
      return res.status(403).json({
        success: false,
        error: 'Only conductors can verify QR codes',
      });
    }

    const { qrId, routeId } = req.body;

    if (!qrId) {
      return res.status(400).json({
        success: false,
        error: 'QR ID is required',
      });
    }

    // Find user by QR ID
    const profile = await prisma.userProfile.findUnique({
      where: { qrId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!profile || !profile.user) {
      return res.status(404).json({
        success: false,
        error: 'Invalid QR code',
      });
    }

    const userId = profile.user.id;
    const now = new Date();

    // Check for active pass
    const activePass = await prisma.pass.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check for valid daily ticket
    const validTicket = routeId
      ? await prisma.ticket.findFirst({
          where: {
            userId: userId,
            routeId: routeId,
            paymentStatus: 'PAID',
            validUntil: { gte: now },
            purchaseDate: {
              gte: new Date(now.setHours(0, 0, 0, 0)), // Today's date
            },
          },
          orderBy: { purchaseDate: 'desc' },
        })
      : null;

    const isValid = !!(activePass || validTicket);

    // Create travel history record
    if (isValid && routeId) {
      await prisma.travelHistory.create({
        data: {
          userId: userId,
          routeId: routeId,
          travelDate: now,
          ticketType: activePass ? 'PASS' : 'DAILY',
          ticketId: validTicket?.id || null,
          passId: activePass?.id || null,
          conductorId: user.id,
          validatedAt: now,
        },
      });
    }

    return res.json({
      success: true,
      valid: isValid,
      user: {
        id: profile.user.id,
        fullName: profile.fullName,
        idNumber: profile.idNumber,
        roleType: profile.roleType,
      },
      pass: activePass
        ? {
            type: activePass.type,
            endDate: activePass.endDate,
            status: activePass.status,
          }
        : null,
      ticket: validTicket
        ? {
            id: validTicket.id,
            type: validTicket.ticketType,
            validUntil: validTicket.validUntil,
          }
        : null,
      message: isValid
        ? 'Valid ticket or pass'
        : 'No valid ticket or pass found',
    });
  } catch (err) {
    console.error('Error verifying QR code:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to verify QR code',
    });
  }
});

export default router;
