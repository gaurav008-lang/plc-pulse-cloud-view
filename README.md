
# PLC Pulse Cloud View

A real-time PLC data monitoring web application that connects to PLCs via Modbus TCP/RTU, displays live data, and uploads it to a cloud backend.

## Features

- Connect to PLCs using Modbus TCP or RTU protocols
- Web-based configuration of PLC connection parameters
- Real-time data monitoring and visualization
- Cloud integration with Firebase Realtime Database
- CSV data logging for record-keeping

## Technical Stack

### Frontend
- React with TypeScript
- Tailwind CSS
- Socket.IO client for real-time communication
- Firebase integration for cloud storage

### Backend
- Flask Python server
- Pymodbus for Modbus TCP/RTU communication
- Socket.IO server for real-time updates
- CSV logging functionality

## Setup Instructions

### Prerequisites
- Node.js (16+)
- Python (3.8+)
- PLC with Modbus TCP/RTU capability

### Frontend Setup
1. Install dependencies:
   ```
   npm install
   ```
2. Update Firebase configuration in `src/services/firebaseService.ts` with your Firebase credentials
3. Build the frontend:
   ```
   npm run build
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the Flask server:
   ```
   python app.py
   ```

## Usage
1. Open a web browser and navigate to `http://localhost:5000`
2. Configure your PLC connection parameters
3. Click "Connect to PLC" to establish a connection
4. View real-time data on the monitoring dashboard

## Docker Deployment
A Dockerfile is included for containerized deployment:

```
docker build -t plc-pulse-cloud-view ./backend
docker run -p 5000:5000 plc-pulse-cloud-view
```

## Notes
- To connect to a PLC, ensure the device is accessible from the machine running the backend server
- For Modbus RTU connections, appropriate hardware (like a USB-to-Serial adapter) may be required
- CSV logs are stored in the `backend/logs` directory

