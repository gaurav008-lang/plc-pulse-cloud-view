
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import pymodbus
from pymodbus.client import ModbusTcpClient, ModbusSerialClient
from pymodbus.constants import Endian
from pymodbus.payload import BinaryPayloadDecoder
import csv
import os
import datetime
import time
import threading
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app and Socket.IO
app = Flask(__name__, static_folder='../dist', static_url_path='/')
app.config['SECRET_KEY'] = 'plc-pulse-secret'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables
plc_client = None
plc_config = None
is_connected = False
is_running = False
connection_thread = None
read_thread = None

# Create logs directory if it doesn't exist
if not os.path.exists('logs'):
    os.makedirs('logs')

def csv_logger(data, config):
    """Log data to CSV file"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d")
    filename = f"logs/plc_data_{timestamp}.csv"
    file_exists = os.path.isfile(filename)
    
    try:
        with open(filename, mode='a', newline='') as file:
            writer = csv.writer(file)
            if not file_exists:
                header = ['timestamp', 'coil_address', 'value']
                writer.writerow(header)
            
            writer.writerow([
                datetime.datetime.now().isoformat(),
                config['coilAddress'],
                data['value']
            ])
    except Exception as e:
        logger.error(f"Error writing to CSV: {str(e)}")

def connect_modbus_tcp(config):
    """Connect to Modbus TCP device"""
    global plc_client
    try:
        logger.info(f"Connecting to ModbusTCP at {config['ipAddress']}:{config['port']}")
        plc_client = ModbusTcpClient(
            host=config['ipAddress'],
            port=config['port'],
            timeout=10
        )
        connected = plc_client.connect()
        logger.info(f"ModbusTCP connection: {connected}")
        return connected
    except Exception as e:
        logger.error(f"ModbusTCP connection error: {str(e)}")
        return False

def connect_modbus_rtu(config):
    """Connect to Modbus RTU device"""
    global plc_client
    try:
        logger.info(f"Connecting to ModbusRTU at {config['comPort']} with baud rate {config['baudRate']}")
        plc_client = ModbusSerialClient(
            method='rtu',
            port=config['comPort'],
            baudrate=config['baudRate'],
            bytesize=config['dataBits'],
            parity=config['parity'],
            stopbits=config['stopBits'],
            timeout=1
        )
        connected = plc_client.connect()
        logger.info(f"ModbusRTU connection: {connected}")
        return connected
    except Exception as e:
        logger.error(f"ModbusRTU connection error: {str(e)}")
        return False

def read_coil_status():
    """Read coil status from PLC"""
    global plc_client, plc_config, is_connected, is_running
    
    if not plc_client or not is_connected:
        logger.error("Cannot read data: Client not connected")
        return
    
    try:
        # Read coil status from the PLC
        unit_id = int(plc_config['unitId'])
        coil_address = int(plc_config['coilAddress'])
        
        logger.info(f"Reading coil at address {coil_address} from unit ID {unit_id}")
        response = plc_client.read_coils(coil_address, 1, slave=unit_id)
        
        if response.isError():
            logger.error(f"Modbus error: {response}")
            socketio.emit('error', f"Modbus read error: {response}")
            is_connected = False
            socketio.emit('plc_connection_status', 'disconnected')
            return
        
        # Get the coil value (True/False)
        value = bool(response.bits[0])
        
        # Create a data object with timestamp
        data = {
            'timestamp': datetime.datetime.now().isoformat(),
            'value': value
        }
        
        logger.info(f"PLC data read: {data}")
        
        # Emit data to all clients
        socketio.emit('plc_data', data)
        
        # Log to CSV if enabled
        if plc_config['enableLogging']:
            csv_logger(data, plc_config)
            
        return data
    except Exception as e:
        logger.error(f"Error reading from PLC: {str(e)}")
        socketio.emit('error', f"PLC read error: {str(e)}")
        is_connected = False
        socketio.emit('plc_connection_status', 'disconnected')
        return None

def plc_read_loop():
    """Continuously read data from PLC"""
    global is_running, is_connected
    
    logger.info("Starting PLC read loop")
    
    while is_running:
        if is_connected:
            read_coil_status()
        time.sleep(1)  # Read every second
    
    logger.info("PLC read loop stopped")

def connect_to_plc(config):
    """Connect to PLC with the given configuration"""
    global plc_client, plc_config, is_connected, is_running, connection_thread, read_thread
    
    is_running = False  # Stop any existing read thread
    if read_thread and read_thread.is_alive():
        read_thread.join(timeout=2.0)
    
    plc_config = config
    
    # Emit connecting status
    socketio.emit('plc_connection_status', 'connecting')
    
    logger.info(f"Connecting to PLC with config: {config}")
    
    # Try to connect to the PLC
    if config['modbusType'] == 'tcp':
        is_connected = connect_modbus_tcp(config)
    else:
        is_connected = connect_modbus_rtu(config)
    
    # Emit connection status
    if is_connected:
        socketio.emit('plc_connection_status', 'connected')
        
        # Start read loop in a new thread
        is_running = True
        read_thread = threading.Thread(target=plc_read_loop)
        read_thread.daemon = True
        read_thread.start()
    else:
        socketio.emit('plc_connection_status', 'disconnected')
        socketio.emit('error', 'Failed to connect to PLC')

# ... keep existing code (routes and socket event handlers)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
