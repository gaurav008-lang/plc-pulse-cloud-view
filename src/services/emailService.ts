
import emailjs from '@emailjs/browser';

interface EmailParams {
  userName: string;
  userEmail: string;
  otp: string;
  adminEmail: string;
}

export const emailService = {
  sendOTPToAdmin: async (params: EmailParams): Promise<boolean> => {
    try {
      // Initialize EmailJS with your user ID
      emailjs.init("YOUR_USER_ID"); // Replace with your EmailJS user ID in production

      const templateParams = {
        user_name: params.userName,
        user_email: params.userEmail,
        otp: params.otp,
        admin_email: params.adminEmail
      };

      await emailjs.send(
        "YOUR_SERVICE_ID", // Replace with your EmailJS service ID in production
        "YOUR_TEMPLATE_ID", // Replace with your EmailJS template ID in production
        templateParams
      );
      
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }
};

// Helper function to generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
