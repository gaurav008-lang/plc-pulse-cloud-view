
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { toast } from "sonner";

interface PLCData {
  timestamp: string;
  value: boolean;
}

const firebaseConfig = {
  // This will need to be replaced with actual Firebase credentials
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

class FirebaseService {
  private app: any;
  private db: any;
  private initialized = false;

  initialize() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      this.initialized = true;
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Firebase initialization error:", error);
      toast.error("Failed to initialize Firebase");
    }
  }

  uploadPLCData(data: PLCData) {
    if (!this.initialized) {
      console.warn("Firebase not initialized, skipping data upload");
      return;
    }

    try {
      const plcDataRef = ref(this.db, 'plcData/latest');
      set(plcDataRef, data);
      
      // Also store in historical data with a timestamp key
      const historyRef = ref(this.db, `plcData/history/${new Date().getTime()}`);
      set(historyRef, data);
      
      console.log("Data uploaded to Firebase:", data);
    } catch (error) {
      console.error("Firebase upload error:", error);
      toast.error("Failed to upload data to Firebase");
    }
  }

  subscribeToLatestData(callback: (data: PLCData) => void) {
    if (!this.initialized) {
      console.warn("Firebase not initialized, cannot subscribe");
      return () => {};
    }

    const plcDataRef = ref(this.db, 'plcData/latest');
    const unsubscribe = onValue(plcDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });

    return unsubscribe;
  }
}

export const firebaseService = new FirebaseService();
