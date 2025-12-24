import express from 'express';
import { validateSession } from '../../lib/auth.js';

const router = express.Router();

/**
 * Get UPI QR code for payment
 * GET /api/payments/upi-qr
 */
router.get('/upi-qr', async (req, res) => {
  try {
    // Validate session (optional - can be public or require auth)
    try {
      await validateSession(req);
    } catch {
      // Allow public access to UPI QR
    }

    // UPI QR code data
    // In production, this would be generated dynamically or fetched from payment gateway
    const upiData = {
      upiId: process.env.UPI_ID || 'schoolbus@paytm', // Set this in your .env
      merchantName: process.env.MERCHANT_NAME || 'School Bus Department',
      amount: null, // Amount will be set by frontend
    };

    // Generate UPI payment string
    // Format: upi://pay?pa=<UPI_ID>&pn=<MERCHANT_NAME>&am=<AMOUNT>&cu=INR
    const generateUPIString = (amount) => {
      return `upi://pay?pa=${upiData.upiId}&pn=${encodeURIComponent(upiData.merchantName)}&am=${amount}&cu=INR`;
    };

    return res.json({
      success: true,
      upi: {
        upiId: upiData.upiId,
        merchantName: upiData.merchantName,
        qrString: generateUPIString(''), // Empty amount, frontend will generate with actual amount
        generateQR: (amount) => generateUPIString(amount),
      },
    });
  } catch (err) {
    console.error('Error getting UPI QR:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to get UPI QR',
    });
  }
});

export default router;

