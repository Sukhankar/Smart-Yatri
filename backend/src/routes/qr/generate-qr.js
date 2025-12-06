import express from 'express';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';
import { generateQRId, generateQRCodeDataURL } from '../../utils/generateQR.js';

const router = express.Router();

/**
 * Generate or retrieve user QR code
 * GET /api/qr/generate
 */
router.get('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    // Get or create user profile
    let profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    // If no profile exists, create one with QR ID
    if (!profile) {
      const qrId = generateQRId();
      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          fullName: user.username, // Default name
          roleType: user.loginType || 'STUDENT',
          qrId: qrId,
        },
      });
    }

    // Generate QR ID if not exists
    if (!profile.qrId) {
      const qrId = generateQRId();
      profile = await prisma.userProfile.update({
        where: { userId: user.id },
        data: { qrId: qrId },
      });
    }

    // Generate QR code image
    const qrDataURL = await generateQRCodeDataURL(profile.qrId);

    return res.json({
      success: true,
      qrId: profile.qrId,
      qrCode: qrDataURL,
      profile: {
        fullName: profile.fullName,
        idNumber: profile.idNumber,
        roleType: profile.roleType,
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to generate QR code',
    });
  }
});

export default router;
