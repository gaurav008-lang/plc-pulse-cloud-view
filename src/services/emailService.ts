
import emailjs from '@emailjs/browser';

interface EmailParams {
  userName: string;
  userEmail: string;
  otp: string;
  adminEmail: string;
}

// Initialize EmailJS with your user ID
emailjs.init("BA0OAKO82o54LdK8u"); 

export const emailService = {
  sendOTPToAdmin: async (params: EmailParams): Promise<boolean> => {
    try {
      console.log("Attempting to send email with EmailJS...");
      
      const templateParams = {
        user_name: params.userName,
        user_email: params.userEmail,
        otp: params.otp,
        admin_email: params.adminEmail
      };
      
      // Using your email service credentials
      const response = await emailjs.send(
        "service_i2d8xmr", // Your EmailJS service ID
        "template_at6wvt9", // Your EmailJS template ID
        templateParams
      );
      
      console.log("Email sent successfully to admin", response);
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
