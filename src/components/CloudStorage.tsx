
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Database, CheckCircle, XCircle, Wifi, WifiOff, Save, Plus, Server } from "lucide-react";
import { firebaseService, PLCConfig } from "@/services/firebaseService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [showAllConfigs, setShowAllConfigs] = useState(false);
  
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
      toast.success("Configuration saved successfully!");
    } catch (error) {
      console.error("Failed to save config:", error);
      setIsSaving(false);
      toast.error("Failed to save configuration");
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
  
  const toggleShowAllConfigs = () => {
    setShowAllConfigs(!showAllConfigs);
  };
  
  const displayedConfigs = showAllConfigs ? savedConfigs : savedConfigs.slice(0, 3);
  
  return (
    <Card className="overflow-hidden border-2 hover:border-plc-blue/50 transition-all duration-300 shadow-md hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-plc-blue/10 to-transparent pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-plc-blue">
              <Database className="h-5 w-5" />
              Cloud Storage
            </CardTitle>
            <CardDescription>Synchronize and store your PLC data in the cloud</CardDescription>
          </div>
          <Badge 
            variant={firebaseConnected ? "default" : "destructive"}
            className={`px-3 py-1 ${firebaseConnected ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} animate-pulse-gentle`}
          >
            {firebaseConnected ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-md bg-gray-50 p-4 border border-gray-200 shadow-sm">
              <h4 className="font-medium mb-2 text-plc-blue flex items-center gap-2">
                <Server className="h-4 w-4" />
                Firebase Connection Status
              </h4>
              <div className="flex items-center gap-2 bg-white p-3 rounded-md border border-gray-100">
                {firebaseConnected ? (
                  <>
                    <Wifi className="h-5 w-5 text-green-500 animate-pulse-gentle" />
                    <span className="text-green-700 font-medium">Connected to Firebase</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 font-medium">Disconnected from Firebase</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="rounded-md bg-gray-50 p-4 border border-gray-200 shadow-sm">
              <h4 className="font-medium mb-2 text-plc-blue">Data Points in Cloud</h4>
              <div className="bg-white p-3 rounded-md border border-gray-100">
                <p className="text-2xl font-bold text-plc-blue">{historicalDataCount}</p>
                <p className="text-xs text-gray-500">Total data points uploaded</p>
              </div>
            </div>
            
            {enableLogging && (
              <div className="rounded-md bg-gray-50 p-4 border border-gray-200 shadow-sm">
                <h4 className="font-medium mb-2 text-plc-blue">CSV Logging</h4>
                <div className="flex items-center gap-2 bg-white p-3 rounded-md border border-gray-100">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Data is being logged to CSV</span>
                </div>
              </div>
            )}
            
            {plcConfig && (
              <div className="rounded-md bg-gray-50 p-4 border border-gray-200 shadow-sm">
                <h4 className="font-medium mb-2 flex justify-between items-center text-plc-blue">
                  <span>Current PLC Configuration</span>
                  <Button 
                    size="sm" 
                    onClick={handleSaveConfig} 
                    disabled={isSaving || !firebaseConnected}
                    className="flex items-center gap-1 bg-plc-blue hover:bg-plc-darkBlue"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Config"}
                  </Button>
                </h4>
                <div className="bg-white p-3 rounded-md border border-gray-100">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Type:</p>
                      <p className="font-medium uppercase">{plcConfig.modbusType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Address:</p>
                      <p className="font-medium">{getConnectionString(plcConfig)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Unit ID:</p>
                      <p className="font-medium">{plcConfig.unitId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Coil Address:</p>
                      <p className="font-medium">{plcConfig.coilAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {savedConfigs.length > 0 && (
              <Collapsible 
                open={showAllConfigs} 
                onOpenChange={setShowAllConfigs}
                className="rounded-md bg-gray-50 p-4 border border-gray-200 shadow-sm"
              >
                <h4 className="font-medium mb-2 text-plc-blue">Saved Configurations</h4>
                <div className="space-y-2">
                  {displayedConfigs.map((config) => (
                    <div key={config.id} className="bg-white p-3 rounded-md border border-gray-100 hover:border-plc-blue/30 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-medium uppercase text-plc-blue">{config.modbusType}</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(config.createdAt || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 text-sm">
                        <p>Address: <span className="font-medium">{getConnectionString(config)}</span></p>
                        <p>Unit ID: <span className="font-medium">{config.unitId}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {savedConfigs.length > 3 && (
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 text-plc-blue hover:text-plc-darkBlue"
                    >
                      {showAllConfigs ? 'Show Less' : `Show All (${savedConfigs.length})`}
                    </Button>
                  </CollapsibleTrigger>
                )}
                
                <CollapsibleContent>
                  {/* Content is already rendered above based on displayedConfigs */}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <div className="relative mx-auto h-16 w-16 mb-4">
              <Database className="absolute h-16 w-16 text-gray-300" />
              <WifiOff className="absolute bottom-0 right-0 h-8 w-8 text-red-400 bg-white rounded-full p-1 border border-gray-200" />
            </div>
            <p className="text-gray-700 font-medium mb-1">Connect to a PLC to start uploading data</p>
            <p className="text-gray-500 text-sm">Your PLC data will be synced to the cloud automatically</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CloudStorage;
