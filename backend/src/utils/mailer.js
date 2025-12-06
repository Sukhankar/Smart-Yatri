// /utils/mailer.js
import nodemailer from 'nodemailer';

const email = process.env.EMAIL;
const emailPassword = process.env.EMAIL_PASSWORD;

if (!email || !emailPassword) {
  throw new Error('EMAIL and EMAIL_PASSWORD must be set in your environment variables');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: email,
    pass: emailPassword,
  },
});

export default transporter;
