import express from 'express';
import prisma from '../../../lib/prisma.js';
import { generateOTP } from '../../../utils/generateOTP.js';
import transporter from '../../../utils/mailer.js';

const router = express.Router();

// POST /api/auth/forgot-password
router.post('/', async (req, res) => {
  try {
    const { email } = req.body ?? {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user by email (unique and required as per schema)
    const user = await prisma.userLogin.findFirst({
      where: {
        email: normalizedEmail
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete any recent/unexpired/unused OTPs for this user/email before creating a new one
    await prisma.passwordResetOtp.deleteMany({
      where: {
        userId: user.id,
        email: normalizedEmail,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    // Generate OTP and expiration
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Record OTP for this user in PasswordResetOtp
    await prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        otp,
        expiresAt,
        used: false
      }
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: normalizedEmail,
      subject: "Reset Your Password",
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify OTP</title>
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
            justify-content: space-between;
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
          .otp-box {
            background-color: #27272a;
            color: #a78bfa;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 10px;
            text-align: center;
            padding: 20px;
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
              padding: 20px 16px;
            }
            .otp-box {
              width: 90%;
              font-size: 22px;
              padding: 16px;
              letter-spacing: 8px;
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
      
          <h2>Confirm Verification Code</h2>
          <p>Hey ${user.username ? user.username : "User"},</p>
          <p>Please enter the following code on the page where you requested a password reset:</p>
      
          <div class="otp-box">${otp}</div>
      
          <p>This verification code will only be valid for the next 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
      
          <div class="footer">
            &copy; ${new Date().getFullYear()} DutyDeck. All rights reserved.
          </div>
        </div>
      </body>
      </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: "OTP sent to email" });
    } catch (emailError) {
      console.error("Error sending email:", emailError.message);
      return res.status(500).json({ message: "Failed to send OTP email", error: emailError.message });
    }
  } catch (error) {
    console.error("Error in forgotPassword:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});

export default router;
