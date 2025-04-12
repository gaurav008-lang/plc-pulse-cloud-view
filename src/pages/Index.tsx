
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, Cpu, Database } from "lucide-react";
import PLCConfigForm, { PLCConfig } from "@/components/PLCConfigForm";
import DataDisplay from "@/components/DataDisplay";
import CloudStorage from "@/components/CloudStorage";
import { socketService } from "@/services/socketService";
import { firebaseService } from "@/services/firebaseService";

interface PLCData {
  timestamp: string;
  value: boolean;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("monitor");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [currentData, setCurrentData] = useState<PLCData | null>(null);
  const [historicalData, setHistoricalData] = useState<PLCData[]>([]);
  const [plcConfig, setPlcConfig] = useState<PLCConfig | null>(null);

  // Initialize services
  useEffect(() => {
    // Set up Socket.IO events
    const serverUrl = window.location.hostname.includes('localhost') 
      ? 'http://localhost:5000'
      : window.location.origin;
    
    socketService.initialize(serverUrl, {
      onConnect: () => {
        toast.success("Connected to server");
      },
      onDisconnect: () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        toast.error("Disconnected from server");
      },
      onConnectionStatus: (status) => {
        setConnectionStatus(status);
        setIsConnected(status === 'connected');
        setIsConnecting(status === 'connecting');
        
        if (status === 'connected') {
          toast.success("PLC Connected");
          setActiveTab("monitor"); // Switch to monitor tab when connected
        } else if (status === 'disconnected') {
          toast.error("PLC Disconnected");
        }
      },
      onPLCData: (data) => {
        setCurrentData(data);
        setHistoricalData(prev => [...prev, data]);
        
        // Upload to Firebase if connected
        firebaseService.uploadPLCData(data);
      },
      onError: (error) => {
        toast.error(`Error: ${error}`);
      }
    });

    // Initialize Firebase
    firebaseService.initialize();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Handle PLC connection request
  const handleConnectToPLC = (config: PLCConfig) => {
    setIsConnecting(true);
    setPlcConfig(config);
    
    try {
      socketService.connectToPLC(config);
      toast.info("Connecting to PLC...");
    } catch (error) {
      setIsConnecting(false);
      toast.error(`Failed to connect: ${error}`);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    socketService.disconnectFromPLC();
  };

  // Get connection address display string
  const getConnectionAddress = () => {
    if (!plcConfig) return '';
    
    if (plcConfig.modbusType === 'tcp') {
      return `${plcConfig.ipAddress}:${plcConfig.port}`;
    } else {
      return `${plcConfig.comPort} @ ${plcConfig.baudRate}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-plc-blue mb-2">PLC Pulse Cloud View</h1>
          <p className="text-gray-600">Real-time PLC monitoring dashboard</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="rounded-md bg-gray-50 p-4 border">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Cpu className="mr-2 h-4 w-4" /> 
                        Connected Device
                      </h4>
                      <div className="text-sm">
                        <p>Type: <span className="font-medium uppercase">{plcConfig?.modbusType}</span></p>
                        <p>Address: <span className="font-medium">{getConnectionAddress()}</span></p>
                        <p>Unit ID: <span className="font-medium">{plcConfig?.unitId}</span></p>
                        <p>Coil Address: <span className="font-medium">{plcConfig?.coilAddress}</span></p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full" 
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <PLCConfigForm onConnect={handleConnectToPLC} isConnecting={isConnecting} />
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="monitor" className="flex items-center">
                  <Cpu className="mr-2 h-4 w-4" /> Data Monitor
                </TabsTrigger>
                <TabsTrigger value="cloud" className="flex items-center">
                  <Database className="mr-2 h-4 w-4" /> Cloud Storage
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="monitor">
                <DataDisplay
                  isConnected={isConnected}
                  connectionStatus={connectionStatus}
                  plcType={plcConfig?.modbusType || ''}
                  plcAddress={getConnectionAddress()}
                  currentData={currentData}
                  historicalData={historicalData}
                />
              </TabsContent>
              
              <TabsContent value="cloud">
                <CloudStorage 
                  isConnected={isConnected}
                  historicalDataCount={historicalData.length}
                  enableLogging={plcConfig?.enableLogging}
                  plcConfig={plcConfig}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>PLC Pulse Cloud View &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
