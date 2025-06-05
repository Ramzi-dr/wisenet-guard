import nodemailer from "nodemailer";
import { logger } from "./logger.js"; // Import logger

// Create a reusable email sending function
const sendEmail = async (text) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // Use true for port 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const emailSubject = "Wisenet event server";

  const mailOptions = {
    from: '"Wisenet Monitoring server" <ramzi.d@outlook.com>',
    to: "ramzi.d@outlook.com, dridi@homesecurity.ch",
    subject: emailSubject,
    html: `
      <p>Hallo,</p>
      <p>This is a message from Wisenet Monitoring Server.</p>
      <p></p></p>
      <p>Event: ${text}</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info("Email sent:", info.response);
  } catch (error) {
    logger.error(`Error sending email with text \"${text}\":`, error);
  }
};

export default sendEmail;
