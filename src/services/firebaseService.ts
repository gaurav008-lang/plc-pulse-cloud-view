import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';

// Define a type for Firebase configuration
export interface PLCConfig {
  id?: string;
  modbusType: 'tcp' | 'rtu';
  ipAddress?: string;
  port?: number;
  comPort?: string;
  baudRate?: number;
  unitId: number;
  coilAddress: number;
  enableLogging?: boolean;
  createdAt?: number;
}

// Define a type for PLC data
export interface PLCData {
  timestamp: string;
  value: boolean;
}

// Define Firebase configuration with fallback demo values
const firebaseConfig = {
  apiKey: "AIzaSyDbKJMShXDKUYvxazSHp0vFLeWDZ4lmLD8",
  authDomain: "plc-pulse.firebaseapp.com",
  projectId: "plc-pulse",
  storageBucket: "plc-pulse.appspot.com",
  messagingSenderId: "550547537953",
  appId: "1:550547537953:web:a1b5b7ef6fc195cecf98d5",
  measurementId: "G-RVCJV9ED7E"
};

let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let connectionListeners: ((status: boolean) => void)[] = [];
let isConnected = false;

export const firebaseService = {
  initialize: () => {
    if (!app) {
      try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase initialized successfully");
        
        // Set connection status to true for demo purposes
        setTimeout(() => {
          isConnected = true;
          connectionListeners.forEach(listener => listener(true));
        }, 1000);
        
        return app;
      } catch (error) {
        console.error("Error initializing Firebase:", error);
        return null;
      }
    }
    return app;
  },
  
  // OTP-related functions
  saveOTP: async (email: string, otp: string): Promise<void> => {
    if (!db) {
      firebaseService.initialize();
      db = getFirestore(app);
      
      if (!db) {
        return Promise.reject(new Error("Firebase not initialized"));
      }
    }
    
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
    if (!db) {
      firebaseService.initialize();
      db = getFirestore(app);
      
      if (!db) return false;
    }
    
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
  },
  
  // Functions needed for CloudStorage component
  addConnectionStatusListener: (listener: (status: boolean) => void): () => void => {
    connectionListeners.push(listener);
    
    // Immediately invoke with current status
    listener(isConnected);
    
    // Return unsubscribe function
    return () => {
      connectionListeners = connectionListeners.filter(l => l !== listener);
    };
  },
  
  getSavedPLCConfigs: (callback: (configs: PLCConfig[]) => void): () => void => {
    if (!db) {
      firebaseService.initialize();
      db = getFirestore(app);
      
      if (!db) {
        callback([]);
        return () => {};
      }
    }
    
    // For demo purposes, return some mock data
    const mockConfigs: PLCConfig[] = [
      {
        id: '1',
        modbusType: 'tcp',
        ipAddress: '192.168.1.100',
        port: 502,
        unitId: 1,
        coilAddress: 100,
        createdAt: Date.now() - 86400000 // 1 day ago
      },
      {
        id: '2',
        modbusType: 'rtu',
        comPort: 'COM1',
        baudRate: 9600,
        unitId: 2,
        coilAddress: 200,
        createdAt: Date.now() - 43200000 // 12 hours ago
      }
    ];
    
    // Call the callback immediately with mock data
    callback(mockConfigs);
    
    // In a real implementation, you would use onSnapshot to listen for changes
    
    // Return unsubscribe function
    return () => {};
  },
  
  savePLCConfig: async (config: PLCConfig): Promise<void> => {
    if (!db) {
      firebaseService.initialize();
      db = getFirestore(app);
      
      if (!db) return Promise.reject(new Error("Firebase not initialized"));
    }
    
    try {
      const configWithTimestamp = {
        ...config,
        createdAt: Date.now()
      };
      
      const configsRef = collection(db, 'plcConfigs');
      const newDocRef = doc(configsRef);
      await setDoc(newDocRef, configWithTimestamp);
      
      console.log("PLC config saved successfully");
      return Promise.resolve();
    } catch (error) {
      console.error("Error saving PLC config:", error);
      return Promise.reject(error);
    }
  },
  
  // Function for uploading PLC data
  uploadPLCData: async (data: PLCData): Promise<void> => {
    if (!db) {
      firebaseService.initialize();
      db = getFirestore(app);
      
      if (!db) return;
    }
    
    try {
      const dataRef = collection(db, 'plcData');
      const newDocRef = doc(dataRef);
      await setDoc(newDocRef, {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      });
      
      console.log("PLC data uploaded successfully");
    } catch (error) {
      console.error("Error uploading PLC data:", error);
    }
  }
};
