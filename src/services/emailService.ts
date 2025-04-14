
import emailjs from '@emailjs/browser';

interface EmailParams {
  userName: string;
  userEmail: string;
  otp: string;
  adminEmail: string;
}

// Initialize EmailJS with user ID
emailjs.init("thamkegaurav8"); // Using the email username as the public key

export const emailService = {
  sendOTPToAdmin: async (params: EmailParams): Promise<boolean> => {
    try {
      const templateParams = {
        user_name: params.userName,
        user_email: params.userEmail,
        otp: params.otp,
        admin_email: params.adminEmail
      };

      // Using EmailJS service
      await emailjs.send(
        "service_plc_pulse", // Create this service ID in EmailJS dashboard
        "template_otp_notification", // Create this template ID in EmailJS dashboard
        templateParams
      );
      
      console.log("Email sent successfully to admin");
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
