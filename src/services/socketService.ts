
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface PLCData {
  timestamp: string;
  value: boolean;
}

export interface SocketServiceEvents {
  onConnect: () => void;
  onDisconnect: () => void;
  onConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
  onPLCData: (data: PLCData) => void;
  onError: (error: string) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private events: SocketServiceEvents | null = null;

  initialize(serverUrl: string, events: SocketServiceEvents) {
    this.events = events;
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('Socket connected');
      if (this.events) {
        this.events.onConnect();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      if (this.events) {
        this.events.onDisconnect();
      }
    });

    this.socket.on('plc_connection_status', (status: 'connected' | 'disconnected' | 'connecting') => {
      console.log('PLC connection status:', status);
      if (this.events) {
        this.events.onConnectionStatus(status);
      }
    });

    this.socket.on('plc_data', (data: PLCData) => {
      console.log('PLC data received:', data);
      if (this.events) {
        this.events.onPLCData(data);
      }
    });

    this.socket.on('error', (error: string) => {
      console.error('Socket error:', error);
      toast.error(`Error: ${error}`);
      if (this.events) {
        this.events.onError(error);
      }
    });
  }

  connectToPLC(config: any) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    
    console.log('Sending PLC connection request with config:', config);
    this.socket.emit('connect_plc', config);
  }

  disconnectFromPLC() {
    if (!this.socket) {
      return;
    }
    
    console.log('Sending PLC disconnect request');
    this.socket.emit('disconnect_plc');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
