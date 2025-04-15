
const nodemailer = require('nodemailer');

// Helper function to send welcome email with credentials
exports.sendWelcomeEmail = async (email, firstName, lastName, password) => {
  try {
    // Create a transporter object with configuration
    let transporter;
    
    // Check if we're in development environment
    if (process.env.NODE_ENV !== 'production') {
      // Use ethereal.email for testing in development
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      console.log('Using test email account for development');
    } else {
      // Use configured email service in production
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }

    // Send email with defined transport object
    const info = await transporter.sendMail({
      from: `"PFE Management System" <${process.env.EMAIL_FROM || 'noreply@pfemanager.com'}>`,
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

    // If using test account, log the URL where message preview is available
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    console.log(`Welcome email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    return false;
  }
};
