
const nodemailer = require('nodemailer');

// Helper function to send welcome email with credentials
exports.sendWelcomeEmail = async (email, firstName, lastName, password) => {
  try {
    // Create a test SMTP transporter object
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send email with defined transport object
    await transporter.sendMail({
      from: `"PFE Management System" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Welcome to PFE Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to PFE Management System</h2>
          <p>Hello ${firstName} ${lastName},</p>
          <p>Your account has been created in the PFE Management System.</p>
          <p>Please use the following credentials to log in:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>We recommend that you change your password after your first login.</p>
          <p>Thank you!</p>
        </div>
      `
    });

    console.log(`Welcome email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    return false;
  }
};
