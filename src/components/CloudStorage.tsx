
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, CheckCircle, XCircle, Wifi, WifiOff, Save, Plus } from "lucide-react";
import { firebaseService, PLCConfig } from "@/services/firebaseService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CloudStorageProps {
  isConnected: boolean;
  historicalDataCount: number;
  enableLogging?: boolean;
  plcConfig?: PLCConfig | null;
}

const CloudStorage: React.FC<CloudStorageProps> = ({ 
  isConnected, 
  historicalDataCount, 
  enableLogging,
  plcConfig 
}) => {
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [savedConfigs, setSavedConfigs] = useState<PLCConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
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
  
  // Get saved configurations
  useEffect(() => {
    if (firebaseConnected) {
      const unsubscribe = firebaseService.getSavedPLCConfigs((configs) => {
        console.log("Fetched saved PLC configurations:", configs);
        setSavedConfigs(configs);
      });
      
      return () => unsubscribe();
    }
  }, [firebaseConnected]);
  
  const handleSaveConfig = async () => {
    if (!plcConfig) {
      toast.error("No PLC configuration to save");
      return;
    }
    
    setIsSaving(true);
    try {
      await firebaseService.savePLCConfig(plcConfig);
      setIsSaving(false);
    } catch (error) {
      console.error("Failed to save config:", error);
      setIsSaving(false);
    }
  };
  
  // Function to format connection string based on PLC type
  const getConnectionString = (config: PLCConfig) => {
    if (config.modbusType === 'tcp') {
      return `${config.ipAddress}:${config.port}`;
    } else {
      return `${config.comPort} @ ${config.baudRate}`;
    }
  };
  
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
            
            {plcConfig && (
              <div>
                <h4 className="font-medium mb-2 flex justify-between items-center">
                  <span>Current PLC Configuration</span>
                  <Button 
                    size="sm" 
                    onClick={handleSaveConfig} 
                    disabled={isSaving || !firebaseConnected}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Config"}
                  </Button>
                </h4>
                <div className="rounded-md bg-gray-50 p-3 border">
                  <p className="text-sm">Type: <span className="font-medium uppercase">{plcConfig.modbusType}</span></p>
                  <p className="text-sm">Address: <span className="font-medium">{getConnectionString(plcConfig)}</span></p>
                  <p className="text-sm">Unit ID: <span className="font-medium">{plcConfig.unitId}</span></p>
                </div>
              </div>
            )}
            
            {savedConfigs.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Saved Configurations</h4>
                <div className="space-y-2">
                  {savedConfigs.slice(0, 3).map((config) => (
                    <div key={config.id} className="rounded-md bg-gray-50 p-2 border text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium uppercase">{config.modbusType}</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(config.createdAt || 0).toLocaleString()}
                        </span>
                      </div>
                      <p>Address: {getConnectionString(config)}</p>
                    </div>
                  ))}
                  {savedConfigs.length > 3 && (
                    <p className="text-xs text-gray-500 text-right">
                      {savedConfigs.length - 3} more configuration(s)
                    </p>
                  )}
                </div>
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
