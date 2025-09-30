# CouchDB Setup for Zoomies Learning Platform

This guide will help you set up CouchDB for the Zoomies learning platform to support multi-device real-time demonstrations.

## Prerequisites

- Docker Desktop installed and running
- Node.js and npm installed

## Quick Start

1. **Start CouchDB with Docker:**
   ```bash
   npm run couchdb:start
   ```

2. **Wait for CouchDB to be ready (about 10-15 seconds), then set up the databases:**
   ```bash
   npm run couchdb:setup
   ```

3. **Start the React application:**
   ```bash
   npm run dev
   ```

## Manual Setup (if needed)

If the automated setup doesn't work, you can set up CouchDB manually:

1. **Start CouchDB:**
   ```bash
   docker-compose up -d
   ```

2. **Wait for CouchDB to be ready, then access the admin interface:**
   - Open http://localhost:5984/_utils
   - Username: `admin`
   - Password: `password`

3. **Create databases manually:**
   - Create these databases in CouchDB:
     - `zoomies_users`
     - `zoomies_courses`
     - `zoomies_sessions`
     - `zoomies_events`
     - `zoomies_metrics`
     - `zoomies_settings`

## Multi-Device Demo Setup

For your demo with 4 laptops:

1. **On your main laptop (teacher):**
   - Start CouchDB: `npm run couchdb:start`
   - Set up databases: `npm run couchdb:setup`
   - Start the app: `npm run dev`
   - Note your laptop's IP address (e.g., 192.168.1.100)

2. **On the 3 student laptops:**
   - Connect to the same WiFi network
   - Access the app at: `http://YOUR_LAPTOP_IP:5173`
   - Login as student1, student2, or student3

## Configuration

The CouchDB configuration is in `src/database/couchdb.ts`:

```typescript
const COUCHDB_URL = 'http://localhost:5984'
const COUCHDB_DATABASE_PREFIX = 'zoomies_'
```

For multi-device access, you may need to change the URL to:
```typescript
const COUCHDB_URL = 'http://YOUR_LAPTOP_IP:5984'
```

## Troubleshooting

### CouchDB not starting
- Make sure Docker Desktop is running
- Check if port 5984 is available: `netstat -an | findstr 5984`

### Connection refused errors
- Wait a bit longer for CouchDB to fully start
- Check Docker logs: `docker logs zoomies-couchdb`

### Database not found errors
- Run the setup script: `npm run couchdb:setup`
- Or manually create the databases in the CouchDB admin interface

### Reset everything
```bash
npm run couchdb:reset
```

## CouchDB Admin Interface

Access the admin interface at: http://localhost:5984/_utils

- Username: `admin`
- Password: `password`

## Default Users

The setup script creates these default users:

- **teacher1** (password: any) - Teacher account
- **student1** (password: any) - Student account
- **student2** (password: any) - Student account  
- **student3** (password: any) - Student account

## Network Configuration

For the demo, make sure all devices are on the same network:

1. Create a mobile hotspot from your phone
2. Connect all 4 laptops to the same hotspot
3. Find your laptop's IP address: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
4. Update the CouchDB URL in the code if needed

## Stopping CouchDB

```bash
npm run couchdb:stop
```

This will stop the CouchDB container but keep the data.

To completely remove everything:
```bash
docker-compose down -v
```
