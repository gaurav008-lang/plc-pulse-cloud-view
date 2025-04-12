
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface PLCConfigFormProps {
  onConnect: (config: PLCConfig) => void;
  isConnecting: boolean;
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
}

const PLCConfigForm: React.FC<PLCConfigFormProps> = ({ onConnect, isConnecting }) => {
  const [config, setConfig] = useState<PLCConfig>({
    modbusType: 'tcp',
    ipAddress: '192.168.1.100',
    port: 502,
    comPort: 'COM1',
    baudRate: 9600,
    dataBits: 8,
    parity: 'N',
    stopBits: 1,
    coilAddress: 0,
    unitId: 1,
    enableLogging: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (config.modbusType === 'tcp' && (!config.ipAddress || !config.port)) {
      toast.error("IP Address and Port are required for Modbus TCP");
      return;
    }
    
    if (config.modbusType === 'rtu' && (!config.comPort || !config.baudRate)) {
      toast.error("COM Port and Baud Rate are required for Modbus RTU");
      return;
    }
    
    onConnect(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">PLC Connection Type</h3>
        
        <RadioGroup 
          value={config.modbusType} 
          onValueChange={(value: 'tcp' | 'rtu') => setConfig({...config, modbusType: value})}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tcp" id="tcp" />
            <Label htmlFor="tcp">Modbus TCP</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rtu" id="rtu" />
            <Label htmlFor="rtu">Modbus RTU</Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {config.modbusType === 'tcp' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP Address</Label>
            <Input 
              id="ipAddress"
              value={config.ipAddress} 
              onChange={(e) => setConfig({...config, ipAddress: e.target.value})}
              placeholder="192.168.1.100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input 
              id="port"
              type="number" 
              value={config.port} 
              onChange={(e) => setConfig({...config, port: parseInt(e.target.value)})}
              placeholder="502"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="comPort">COM Port</Label>
            <Input 
              id="comPort"
              value={config.comPort} 
              onChange={(e) => setConfig({...config, comPort: e.target.value})}
              placeholder="COM1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baudRate">Baud Rate</Label>
            <Select 
              value={config.baudRate?.toString()} 
              onValueChange={(value) => setConfig({...config, baudRate: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select baud rate" />
              </SelectTrigger>
              <SelectContent>
                {[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((rate) => (
                  <SelectItem key={rate} value={rate.toString()}>{rate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataBits">Data Bits</Label>
            <Select 
              value={config.dataBits?.toString()} 
              onValueChange={(value) => setConfig({...config, dataBits: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Data bits" />
              </SelectTrigger>
              <SelectContent>
                {[7, 8].map((bits) => (
                  <SelectItem key={bits} value={bits.toString()}>{bits}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="parity">Parity</Label>
            <Select 
              value={config.parity} 
              onValueChange={(value) => setConfig({...config, parity: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Parity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="N">None (N)</SelectItem>
                <SelectItem value="E">Even (E)</SelectItem>
                <SelectItem value="O">Odd (O)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stopBits">Stop Bits</Label>
            <Select 
              value={config.stopBits?.toString()} 
              onValueChange={(value) => setConfig({...config, stopBits: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Stop bits" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2].map((bits) => (
                  <SelectItem key={bits} value={bits.toString()}>{bits}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="coilAddress">Coil Address</Label>
          <Input 
            id="coilAddress"
            type="number" 
            value={config.coilAddress} 
            onChange={(e) => setConfig({...config, coilAddress: parseInt(e.target.value)})}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitId">Unit ID / Slave Address</Label>
          <Input 
            id="unitId"
            type="number" 
            value={config.unitId} 
            onChange={(e) => setConfig({...config, unitId: parseInt(e.target.value)})}
            placeholder="1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch 
          id="enableLogging"
          checked={config.enableLogging} 
          onCheckedChange={(checked) => setConfig({...config, enableLogging: checked})}
        />
        <Label htmlFor="enableLogging">Enable CSV Logging</Label>
      </div>

      <Button type="submit" disabled={isConnecting} className="w-full">
        {isConnecting ? "Connecting..." : "Connect to PLC"}
      </Button>
    </form>
  );
};

export default PLCConfigForm;
