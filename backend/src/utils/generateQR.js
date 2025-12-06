import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate a unique QR ID for a user
 */
export function generateQRId() {
  return `QR-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
}

/**
 * Generate QR code image data URL from QR ID
 */
export async function generateQRCodeDataURL(qrId) {
  try {
    const dataURL = await QRCode.toDataURL(qrId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
    });
    return dataURL;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code buffer for file storage
 */
export async function generateQRCodeBuffer(qrId) {
  try {
    const buffer = await QRCode.toBuffer(qrId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
    });
    return buffer;
  } catch (err) {
    console.error('Error generating QR code buffer:', err);
    throw new Error('Failed to generate QR code buffer');
  }
}
