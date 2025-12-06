import prisma from '../../../lib/prisma.js';
import crypto from 'crypto';

export async function logoutHandler(req, res) {
  try {
    // Get session token from cookie
    const cookieToken = req.cookies?.sessionToken;

    if (!cookieToken) {
      // No session token, but logout should still clear cookie
      res.clearCookie('sessionToken', {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
      });
      return res.json({ success: true, message: 'Logged out.' });
    }

    // Hash token to match DB storage
    const hashedToken = crypto.createHash('sha256').update(cookieToken).digest('hex');

    // Delete session from DB
    await prisma.session.deleteMany({
      where: { token: hashedToken }
    });

    // Clear the cookie
    res.clearCookie('sessionToken', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });

    return res.json({ success: true, message: 'Logged out.' });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Logout failed.'
    });
  }
}
