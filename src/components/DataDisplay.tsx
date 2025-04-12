
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PLCData {
  timestamp: string;
  value: boolean;
}

interface DataDisplayProps {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  plcType: 'tcp' | 'rtu' | '';
  plcAddress: string;
  currentData: PLCData | null;
  historicalData: PLCData[];
}

const DataDisplay: React.FC<DataDisplayProps> = ({ 
  isConnected, 
  connectionStatus, 
  plcType, 
  plcAddress, 
  currentData, 
  historicalData 
}) => {
  // Format data for chart
  const chartData = historicalData.map(item => ({
    name: new Date(item.timestamp).toLocaleTimeString(),
    value: item.value ? 1 : 0
  })).slice(-20); // Show last 20 data points for better visualization
  
  // Calculate statistics
  const totalSamples = historicalData.length;
  const trueCount = historicalData.filter(item => item.value).length;
  const truePercentage = totalSamples > 0 ? ((trueCount / totalSamples) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">PLC Connection Status</CardTitle>
            <div className="flex items-center">
              <span className={`status-indicator ${
                connectionStatus === 'connected' ? 'status-connected' :
                connectionStatus === 'connecting' ? 'status-connecting' :
                'status-disconnected'
              }`}></span>
              <span className="capitalize">{connectionStatus}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected && plcType && plcAddress && (
            <div className="text-sm text-gray-500">
              <p>Type: <span className="font-medium text-foreground uppercase">{plcType}</span></p>
              <p>Address: <span className="font-medium text-foreground">{plcAddress}</span></p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Coil Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {currentData ? (
            <div className="text-center py-4">
              <div className={`text-4xl font-bold ${currentData.value ? 'text-plc-green' : 'text-plc-red'}`}>
                {currentData.value ? 'ON' : 'OFF'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {new Date(currentData.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              Waiting for data...
            </div>
          )}
        </CardContent>
      </Card>

      {historicalData.length > 0 && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Value History</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[200px] py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(value) => value === 1 ? "ON" : "OFF"} />
                    <Tooltip formatter={(value) => [(value === 1 ? "ON" : "OFF")]} />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#3b82f6" />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Samples</p>
                  <p className="text-2xl font-bold">{totalSamples}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ON Percentage</p>
                  <p className="text-2xl font-bold">{truePercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DataDisplay;
