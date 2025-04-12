
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, onDisconnect, serverTimestamp } from "firebase/database";
import { toast } from "sonner";

interface PLCData {
  timestamp: string;
  value: boolean;
}

export interface PLCConfig {
  modbusType: 'tcp' | 'rtu';
  ipAddress?: string;
  port?: number;
  comPort?: string;
  baudRate?: number;
  dataBits?: number;
  parity?: string;
  stopBits?: number;
  coilAddress: number;
  unitId: number;
  enableLogging: boolean;
  createdAt?: number;
  id?: string;
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
  private isConnected = false;

  initialize() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      this.initialized = true;
      console.log("Firebase initialized successfully");
      
      // Monitor connection state
      const connectedRef = ref(this.db, '.info/connected');
      onValue(connectedRef, (snap) => {
        this.isConnected = snap.val() === true;
        console.log("Firebase connection state:", this.isConnected ? "connected" : "disconnected");
        this.notifyConnectionListeners(this.isConnected);
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
    
    // Immediately notify with current status
    listener(this.isConnected);
    
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
  
  get connectionStatus() {
    return this.isConnected;
  }

  // New method to save PLC configuration
  savePLCConfig(config: PLCConfig): Promise<string> {
    if (!this.initialized) {
      console.warn("Firebase not initialized, skipping config save");
      return Promise.reject("Firebase not initialized");
    }

    try {
      // Generate a unique ID if not provided
      const configId = config.id || `config_${new Date().getTime()}`;
      const configWithTimestamp = {
        ...config,
        createdAt: config.createdAt || new Date().getTime(),
        id: configId
      };
      
      // Save to Firebase
      const configRef = ref(this.db, `plcConfigs/${configId}`);
      return set(configRef, configWithTimestamp)
        .then(() => {
          console.log("PLC configuration saved to Firebase:", configWithTimestamp);
          toast.success("PLC configuration saved to Firebase");
          return configId;
        })
        .catch((error) => {
          console.error("Error saving PLC config:", error);
          toast.error("Failed to save PLC configuration");
          throw error;
        });
    } catch (error) {
      console.error("Firebase save error:", error);
      toast.error("Failed to save PLC configuration");
      return Promise.reject(error);
    }
  }

  // Method to get saved PLC configurations
  getSavedPLCConfigs(callback: (configs: PLCConfig[]) => void) {
    if (!this.initialized) {
      console.warn("Firebase not initialized, cannot get saved configs");
      return () => {};
    }

    const configsRef = ref(this.db, 'plcConfigs');
    const unsubscribe = onValue(configsRef, (snapshot) => {
      const data = snapshot.val();
      const configs: PLCConfig[] = [];
      
      if (data) {
        Object.keys(data).forEach(key => {
          configs.push(data[key]);
        });
        // Sort by created date, newest first
        configs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
      
      callback(configs);
    });

    return unsubscribe;
  }
}

export const firebaseService = new FirebaseService();
