// utilities/email.js
const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (employeeEmail, employeeCode, plainPassword) => {
  // For local testing — use Mailtrap / Ethereal / your own SMTP
  // Option A: Ethereal (fake SMTP - good for testing)
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "	smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Option B: Mailtrap (recommended for development - create free account at mailtrap.io)
  /*
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "your-mailtrap-user",
      pass: "your-mailtrap-password"
    }
  });
  */

  const loginUrl = "http://localhost:5500/account/login"; // change to your real port

  const mailOptions = {
    from: '"UHWF Tanzania" <no-reply@uhwf.or.tz>',
    to: employeeEmail,
    subject: "Welcome to UHWF Tanzania – Your Account Details",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32;">Welcome to UHWF Tanzania!</h2>
        <p>Dear colleague,</p>
        <p>Your account has been successfully created by the administrator.</p>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <strong>Your login details:</strong><br><br>
          <strong>Username / Employee Code:</strong> ${employeeCode}<br>
          <strong>Password:</strong> ${plainPassword}<br><br>
          <strong>Login here:</strong> <a href="${loginUrl}" style="color: #F9A825; font-weight: bold;">${loginUrl}</a>
        </div>

        <p>Please change your password after first login for security.</p>
        <p>If you have any questions, contact support at support@uhwf.or.tz</p>

        <p style="margin-top: 30px; color: #555; font-size: 0.9em;">
          © ${new Date().getFullYear()} Universal Haman-Wildlife Foundation Tanzania
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent! Message ID:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info)); // only for Ethereal
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

module.exports = { sendWelcomeEmail };