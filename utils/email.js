import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, text }) => {
  // Check if email configuration is available
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || 
      !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email configuration missing. Skipping email send.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw the error, just log it
  }
};

export { sendEmail };
