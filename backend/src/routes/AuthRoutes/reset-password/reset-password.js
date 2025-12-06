import express from 'express';
import prisma from '../../../lib/prisma.js'; // Use relative path, no '@'
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const router = express.Router();

/**
 * Helper to send password reset confirmation email, using rich HTML template.
 */
async function sendPasswordResetEmail(user, email) {
  if (!email) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let name = (user && user.username) || '';
  if (user && user.warehouse && user.warehouse.name) name = user.warehouse.name;
  if (user && user.store && user.store.name) name = user.store.name;

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset Successful</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #0d0d0d;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #ffffff;
        -webkit-font-smoothing: antialiased;
      }
      .email-wrapper {
        max-width: 600px;
        margin: 40px auto;
        padding: 30px 24px;
        background-color: #1a1a1a;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .header {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #2e2e2e;
        padding-bottom: 16px;
        margin-bottom: 24px;
      }
      .app-name {
        font-size: 26px;
        font-weight: 600;
        color: #a78bfa;
      }
      h2 {
        font-size: 22px;
        margin-bottom: 10px;
        color: #ffffff;
      }
      p {
        font-size: 15px;
        line-height: 1.6;
        color: #e5e7eb;
        margin: 8px 0;
      }
      .success-box {
        background-color: #22c55e1a;
        color: #22c55e;
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 8px;
        text-align: center;
        padding: 30px;
        border-radius: 10px;
        margin: 30px auto;
        width: 220px;
      }
      .footer {
        text-align: center;
        margin-top: 40px;
        font-size: 13px;
        color: #9ca3af;
        border-top: 1px solid #2e2e2e;
        padding-top: 16px;
      }
      @media (max-width: 480px) {
        .email-wrapper {
          padding: 20px 12px;
        }
        .success-box {
          width: 90%;
          font-size: 22px;
          padding: 20px;
          letter-spacing: 4px;
        }
        .app-name {
          font-size: 22px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="header">
        <div class="app-name">DutyDeck</div>
      </div>
  
      <h2>Password Reset Successful</h2>
      <p>Hey ${name || "User"},</p>
      <div class="success-box">✔️</div>
      <p>Your password has been successfully reset. You may now use your new password to log in.</p>
      <p>If you did not perform this action, please contact our support team immediately.</p>
  
      <div class="footer">
        &copy; ${new Date().getFullYear()} DutyDeck. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your password has been reset',
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    // Do not throw, just log for debugging
    console.error('Failed to send password reset email:', err);
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { email, otp, newPassword }
 */
router.post('/reset-password', async (req, res) => {
  try {
    let body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON body',
      });
    }

    const { email, otp, newPassword } = body || {};

    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      typeof newPassword !== "string" ||
      !email.trim() ||
      !otp.trim() ||
      !newPassword.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required (and must be non-empty strings)"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long"
      });
    }

    // Find OTP record (unused, unexpired)
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    // Find the user by ID (from OTP record)
    const user = await prisma.userLogin.findUnique({
      where: { id: otpRecord.userId },
      include: { warehouse: true, store: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Hash and update password in UserLogin
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.userLogin.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetOtp.updateMany({
        where: {
          email: normalizedEmail,
          otp,
          used: false
        },
        data: { used: true }
      }),
      prisma.passwordResetOtp.deleteMany({
        where: {
          email: normalizedEmail,
          used: true
        }
      })
    ]);

    // Try to send confirmation email using new HTML template
    let userEmail = user.email;
    if (!userEmail && user.warehouse && user.warehouse.email) userEmail = user.warehouse.email;
    if (!userEmail && user.store && user.store.email) userEmail = user.store.email;
    if (userEmail) {
      await sendPasswordResetEmail(user, userEmail);
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully in UserLogin"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
});

export default router;
