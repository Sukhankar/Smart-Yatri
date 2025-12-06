import prisma from './prisma.js';
import crypto from 'crypto';

/**
 * Validate session token from cookie (Node.js/Express version)
 * @param {import('express').Request} req
 * @returns {Promise<{user: object, session: object}>} - throws Error on failure
 */
export async function validateSession(req) {
  // Express cookies middleware puts cookies on req.cookies directly
  const cookieToken = req.cookies?.sessionToken;

  if (!cookieToken) {
    const error = new Error('Unauthorized: No session token.');
    error.status = 401;
    throw error;
  }

  // Hash token to match DB storage
  const hashedToken = crypto.createHash('sha256').update(cookieToken).digest('hex');

  const session = await prisma.session.findUnique({
    where: { token: hashedToken },
    include: { user: { include: { assignedRole: true } } },
  });

  if (!session || !session.user) {
    const error = new Error('Unauthorized: Invalid session.');
    error.status = 401;
    throw error;
  }

  return { session, user: session.user };
}
