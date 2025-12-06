import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../../lib/prisma.js'; // Do not use '@', use relative path
import transporter from '../../../utils/mailer.js'; // Use central mailer utility for emails

const router = express.Router();

// Helper to get session user from cookie (ES Module, async/await everywhere)
const getSessionUser = async (req) => {
  const cookieToken = req.cookies?.sessionToken;
  if (!cookieToken) return null;
  const hashed = crypto.createHash('sha256').update(cookieToken).digest('hex');
  const session = await prisma.session.findUnique({
    where: { token: hashed },
    include: { user: { include: { warehouse: true, store: true } } }
  });
  if (!session?.user) return null;
  return session.user;
};

// Helper to send email notification
const sendPasswordChangeEmail = async (user, email) => {
  if (!email) return;

  let name = user.username;
  if (user.warehouse && user.warehouse.name) name = user.warehouse.name;
  if (user.store && user.store.name) name = user.store.name;

  const mailOptions = {
    from: `"Warehouse App" <${process.env.EMAIL}>`,
    to: email,
    subject: 'Your password was changed',
    text: `Hello ${name},\n\nYour password was successfully changed. If you did not perform this action, please contact support immediately.\n\nThank you.`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    // Do not throw, just log
    // eslint-disable-next-line no-console
    console.error('Failed to send password change email:', err);
  }
};

router.post('/', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new password are required.' });
    }

    // Get current user from session
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Optionally: enforce password policy (min length, etc.)
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await prisma.userLogin.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    // Invalidate all sessions for this user (force re-login)
    await prisma.session.deleteMany({ where: { userId: user.id } });

    // Try to send notification email if possible
    let email = user.email;
    if (!email && user.warehouse && user.warehouse.email) email = user.warehouse.email;
    if (!email && user.store && user.store.email) email = user.store.email;
    if (email) {
      await sendPasswordChangeEmail(user, email);
    }

    // Return success
    return res.json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to change password.' });
  }
});

export default router;
