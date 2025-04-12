
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, CheckCircle, XCircle, Wifi, WifiOff } from "lucide-react";
import { firebaseService } from "@/services/firebaseService";

interface CloudStorageProps {
  isConnected: boolean;
  historicalDataCount: number;
  enableLogging?: boolean;
}

const CloudStorage: React.FC<CloudStorageProps> = ({ isConnected, historicalDataCount, enableLogging }) => {
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  
  useEffect(() => {
    console.log("CloudStorage: Setting up Firebase connection listener");
    // Subscribe to Firebase connection status
    const unsubscribe = firebaseService.addConnectionStatusListener((status) => {
      console.log("CloudStorage: Firebase connection status changed to:", status);
      setFirebaseConnected(status);
    });
    
    return () => {
      console.log("CloudStorage: Cleaning up Firebase connection listener");
      unsubscribe();
    };
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cloud Storage</CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-md bg-gray-50 p-4 border">
              <h4 className="font-medium mb-2">Firebase Connection Status</h4>
              <p className="flex items-center gap-2">
                {firebaseConnected ? (
                  <>
                    <Wifi className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 font-medium">Connected to Firebase</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 font-medium">Disconnected from Firebase</span>
                  </>
                )}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Uploaded Data Points</h4>
              <p className="text-2xl font-bold text-plc-blue">{historicalDataCount}</p>
            </div>
            
            {enableLogging && (
              <div>
                <h4 className="font-medium mb-2">CSV Logging</h4>
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Data is being logged to CSV</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Database className="mx-auto h-12 w-12 mb-2 opacity-30" />
            <p>Connect to a PLC to start uploading data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudStorage;
