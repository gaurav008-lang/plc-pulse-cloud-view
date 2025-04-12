
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

@app.route('/')
def index():
    """Serve the static React app"""
    return app.send_static_file('index.html')

@app.route('/api/status')
def status():
    """Return the current status of the PLC connection"""
    global is_connected, plc_config
    return jsonify({
        'connected': is_connected,
        'config': plc_config if is_connected else None
    })

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('connect_plc')
def handle_connect_plc(config):
    """Handle PLC connection request"""
    global connection_thread
    
    logger.info(f"PLC connection request: {config}")
    
    # Start connection in a separate thread to avoid blocking
    connection_thread = threading.Thread(target=connect_to_plc, args=(config,))
    connection_thread.daemon = True
    connection_thread.start()

@socketio.on('disconnect_plc')
def handle_disconnect_plc():
    """Handle PLC disconnection request"""
    global plc_client, is_connected, is_running
    
    logger.info("PLC disconnect request")
    
    is_running = False
    if plc_client:
        try:
            plc_client.close()
        except:
            pass
        plc_client = None
    
    is_connected = False
    socketio.emit('plc_connection_status', 'disconnected')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
