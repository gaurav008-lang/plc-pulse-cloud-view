import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add or update the OTP-related functions
export const firebaseService = {
  
  saveOTP: async (email: string, otp: string): Promise<void> => {
    try {
      const sanitizedEmail = email.replace(/\./g, '_dot_').replace(/@/g, '_at_');
      const docRef = doc(db, 'otps', sanitizedEmail);
      
      await setDoc(docRef, {
        otp,
        createdAt: serverTimestamp(),
        email: email
      });
      
      // Also send notification to admin
      const adminDocRef = doc(db, 'notifications', 'admin');
      await setDoc(adminDocRef, {
        message: `New access request from ${email}`,
        otp: otp,
        timestamp: serverTimestamp()
      }, { merge: true });
      
      console.log("OTP saved successfully for", email);
    } catch (error) {
      console.error("Error saving OTP:", error);
      throw error;
    }
  },
  
  verifyOTP: async (email: string, enteredOTP: string): Promise<boolean> => {
    try {
      const sanitizedEmail = email.replace(/\./g, '_dot_').replace(/@/g, '_at_');
      const docRef = doc(db, 'otps', sanitizedEmail);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const storedOTP = data.otp;
        
        // Check OTP expiration (10 minutes)
        const createdAt = data.createdAt?.toDate() || new Date(0);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
        
        if (diffMinutes > 10) {
          console.log("OTP expired");
          return false;
        }
        
        // Compare OTPs
        return storedOTP === enteredOTP;
      }
      
      return false;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return false;
    }
  }
};
