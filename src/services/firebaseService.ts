
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, onDisconnect, serverTimestamp } from "firebase/database";
import { toast } from "sonner";

interface PLCData {
  timestamp: string;
  value: boolean;
}

const firebaseConfig = {

  apiKey: "AIzaSyByNDDxXK_plHoZUHVGT6HQQTuMti1rckc", 
  authDomain: "plcwebapp.firebaseapp.com",
  databaseURL: "https://plcwebapp-default-rtdb.firebaseio.com",
  projectId: "plcwebapp",
  storageBucket: "plcwebapp.firebasestorage.app",
  messagingSenderId: "424899404299",
  appId: "1:424899404299:web:640112c4531b145674dd0e"
};

class FirebaseService {
  private app: any;
  private db: any;
  private initialized = false;
  private connectionStatusListeners: ((status: boolean) => void)[] = [];

  initialize() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      this.initialized = true;
      console.log("Firebase initialized successfully");
      
      // Monitor connection state
      const connectedRef = ref(this.db, '.info/connected');
      onValue(connectedRef, (snap) => {
        const connected = snap.val() === true;
        console.log("Firebase connection state:", connected ? "connected" : "disconnected");
        this.notifyConnectionListeners(connected);
      });
      
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

  addConnectionStatusListener(listener: (status: boolean) => void) {
    this.connectionStatusListeners.push(listener);
    
    // Immediately notify with current status if known
    if (this.initialized) {
      // Force a check by trying to access the database
      const connectedRef = ref(this.db, '.info/connected');
      onValue(connectedRef, (snap) => {
        listener(snap.val() === true);
      }, { onlyOnce: true });
    } else {
      listener(false);
    }
    
    return () => {
      this.connectionStatusListeners = this.connectionStatusListeners.filter(l => l !== listener);
    };
  }
  
  private notifyConnectionListeners(status: boolean) {
    this.connectionStatusListeners.forEach(listener => {
      listener(status);
    });
  }
  
  get isInitialized() {
    return this.initialized;
  }
}

export const firebaseService = new FirebaseService();
