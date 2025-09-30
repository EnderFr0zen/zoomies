# Zoomies - AI-Powered Learning Companion

A React-based learning platform with real-time eye-tracking attention monitoring using MediaPipe computer vision technology.

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker Desktop** (for CouchDB database)
- **Python 3.8+** (for gaze detection server)
- **Modern web browser** with camera support

### 1. Start CouchDB Database

#### Using Docker Desktop:
1. Open **Docker Desktop**
2. Find the `zoomies-couchdb` container
3. Click the **Play** button to start the container
4. Verify it's running on port `5984`

#### Using Command Line:
```bash
# Start the existing container
docker start zoomies-couchdb

# Check if it's running
docker ps

# Test connection
curl -X GET http://localhost:5984
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for gaze detection)
pip install -r requirements.txt
```

### 3. Build the Application

```bash
# Build the React application
npm run build

# Or run in development mode
npm run dev
```

### 4. Start the Application

#### Development Mode (Recommended):
```bash
npm run dev
```

#### Production Mode:
```bash
# Build first
npm run build

# Serve the built files
npm run preview
```

### 5. Access URLs

#### Local Access:
- **Frontend**: `https://localhost:7777`
- **CouchDB Admin**: `http://localhost:5984/_utils`

#### Network Access (for teammates):
- **Frontend**: `https://172.20.10.3:7777` (or your actual IP address)
- **CouchDB**: `http://172.20.10.3:5984`

#### Find Your IP Address:
```bash
# Windows
ipconfig | findstr "IPv4"

# Mac/Linux
ifconfig | grep "inet "
```

### 6. Start Python Gaze Detection Server (Optional)

For advanced eye-tracking features:

```bash
# Start the Python WebSocket server
python python_gaze_server_wss_simple.py

# Or start the simple version
python python_gaze_server_simple.py
```

The server will run on:
- **Local**: `wss://localhost:8765`
- **Network**: `wss://172.20.10.3:8765`

## 🛠️ Development Commands

### Build Commands:
```bash
# Build for production
npm run build

# Build and preview
npm run build && npm run preview

# Type checking only
npm run type-check
```

### Docker Commands:
```bash
# Start CouchDB
docker start zoomies-couchdb

# Stop CouchDB
docker stop zoomies-couchdb

# Restart CouchDB
docker restart zoomies-couchdb

# Check container status
docker ps -a

# View container logs
docker logs zoomies-couchdb
```

### Database Commands:
```bash
# Test CouchDB connection
curl -X GET http://localhost:5984

# Check database status
curl -X GET http://localhost:5984/_all_dbs
```

## 🔧 Configuration

### Port Configuration:
- **Frontend**: Port `7777` (HTTPS)
- **CouchDB**: Port `5984` (HTTP)
- **Python Server**: Port `8765` (WSS)

### Environment Variables:
Create a `.env` file in the root directory:
```env
VITE_COUCHDB_URL=http://localhost:5984
VITE_GAZE_SERVER_URL=wss://localhost:8765
```

## 🎯 Features

### Core Features:
- **Real-time Eye Tracking**: MediaPipe-based attention monitoring
- **Multi-device Support**: Multiple students can connect simultaneously
- **Course Management**: Create and manage learning courses
- **Session Tracking**: Monitor study sessions and progress
- **Koala Companion**: Interactive learning companion

### Technical Features:
- **HTTPS/WSS Support**: Secure connections for cross-device access
- **CouchDB Integration**: Robust database with real-time sync
- **TypeScript**: Full type safety
- **Responsive Design**: Works on desktop and mobile devices

## 🚨 Troubleshooting

### Common Issues:

#### Port Already in Use:
```bash
# Kill processes using port 7777
netstat -ano | findstr :7777
taskkill /PID <PID_NUMBER> /F

# Or restart Docker Desktop
```

#### CouchDB Connection Failed:
```bash
# Check if CouchDB is running
docker ps | grep couchdb

# Restart CouchDB
docker restart zoomies-couchdb

# Check logs
docker logs zoomies-couchdb
```

#### Camera Permission Denied:
1. Ensure you're using HTTPS (`https://localhost:7777`)
2. Allow camera permissions in browser
3. Check if camera is being used by another application

#### Build Errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run build -- --force
```

## 📱 Multi-Device Setup

### For Teammates to Connect:

1. **Ensure your laptop is on the same network**
2. **Find your IP address**:
   ```bash
   ipconfig | findstr "IPv4"
   ```
3. **Share the network URL**: `https://YOUR_IP:7777`
4. **Teammates should**:
   - Open the URL in their browser
   - Accept the self-signed certificate warning
   - Allow camera permissions when prompted

### Firewall Configuration:
- **Windows**: Allow Node.js through Windows Firewall
- **Mac**: Allow incoming connections in System Preferences
- **Linux**: Configure iptables or ufw

## 🔒 Security Notes

- **Self-signed certificates** are used for HTTPS (browser will show warning)
- **Camera data** is processed locally and not stored
- **Database** runs locally on your machine
- **No data** is sent to external servers

## 📊 Monitoring

### Check Application Status:
```bash
# Check if frontend is running
curl -k https://localhost:7777

# Check if CouchDB is running
curl http://localhost:5984

# Check if Python server is running
curl -k https://localhost:8765
```

### View Logs:
```bash
# Frontend logs (in terminal where you ran npm run dev)
# CouchDB logs
docker logs zoomies-couchdb

# Python server logs (in terminal where you ran python script)
```

## 🛑 Shutdown Procedures

### Graceful Shutdown:
1. **Stop the frontend**: Press `Ctrl+C` in the terminal running `npm run dev`
2. **Stop Python server**: Press `Ctrl+C` in the terminal running the Python script
3. **Stop CouchDB**: 
   ```bash
   docker stop zoomies-couchdb
   ```
4. **Close Docker Desktop** (optional)

### Emergency Shutdown:
```bash
# Kill all Node.js processes
taskkill /f /im node.exe

# Stop all Docker containers
docker stop $(docker ps -q)

# Or stop Docker Desktop completely
```

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all services are running on correct ports
3. Check browser console for errors
4. Ensure camera permissions are granted

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Frontend loads at `https://localhost:7777`
- ✅ CouchDB responds at `http://localhost:5984`
- ✅ Camera permission is granted
- ✅ Eye tracking visualization appears
- ✅ Teammates can connect via network URL

---

**Happy Learning with Zoomies! 🐨**