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

    // Find session to get user info before deleting
    const session = await prisma.session.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    // Delete session from DB
    await prisma.session.deleteMany({
      where: { token: hashedToken }
    });

    // Log logout if session existed
    if (session) {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'LOGOUT',
          details: JSON.stringify({
            loginType: session.user.loginType,
            role: session.user.assignedRole?.name,
          }),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
    }

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
