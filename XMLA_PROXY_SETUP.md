# XMLA Proxy Integration Guide

## Overview

The XMLA Proxy is a Python Flask service that enables service principal authentication for Power BI DAX queries. This is necessary because the Power BI REST API `executeQueries` endpoint does not support service principal authentication, but the XMLA endpoint (via pyodbc) does.

## Quick Start

### 1. Setup the XMLA Proxy Service

```powershell
# Navigate to the xmla-proxy directory
cd xmla-proxy

# Run the automated setup script
.\setup.ps1
```

The setup script will:
- Check Python installation
- Verify ODBC Driver for SQL Server is installed
- Create Python virtual environment
- Install required packages
- Create .env configuration file

### 2. Verify Configuration

Check that `xmla-proxy\.env` has correct values:
```
FABRIC_TENANT_ID=your-tenant-id-here
FABRIC_CLIENT_ID=your-client-id-here
FABRIC_CLIENT_SECRET=your-client-secret-here
FABRIC_WORKSPACE_NAME=YourWorkspaceName
FABRIC_DATASET_NAME=YourDatasetName
PORT=5000
```

### 3. Start the XMLA Proxy Service

```powershell
cd xmla-proxy

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start the service
python app.py
```

You should see:
```
============================================================
XMLA Proxy Service Starting
============================================================
Workspace: YourWorkspaceName
Dataset: YourDatasetName
Port: 5000
============================================================
```

### 4. Test the Service

Open a new PowerShell window:

```powershell
cd xmla-proxy

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run test suite
python test_service.py
```

This will run 4 tests:
- ✓ Health Check
- ✓ Connection Test
- ✓ Simple Query (EVALUATE { 1 })
- ✓ Dataset Query (real data from your dataset)

### 5. Start the Node.js App

In another PowerShell window:

```powershell
# Make sure you're in the main project directory
cd C:\dev\CustomPowerBIEmbed

# Start the Node.js server
node server.js
```

The Node.js app will now use the XMLA proxy for all Fabric queries!

## Architecture

```
┌─────────────────┐      HTTP POST         ┌──────────────────┐
│                 │  /api/query (DAX)      │                  │
│   Web Browser   │──────────────────────> │   Node.js App    │
│                 │                        │   (Express)      │
└─────────────────┘                        └──────────────────┘
                                                    │
                                                    │ HTTP POST
                                                    │ /query (DAX)
                                                    ▼
                                           ┌──────────────────┐
                                           │  Python Flask    │
                                           │  XMLA Proxy      │
                                           │  (pyodbc)        │
                                           └──────────────────┘
                                                    │
                                                    │ XMLA Protocol
                                                    │ (Service Principal)
                                                    ▼
                                           ┌──────────────────┐
                                           │  Microsoft       │
                                           │  Fabric          │
                                           │  Semantic Model  │
                                           └──────────────────┘
```

## How It Works

1. **User makes a natural language query** in the web UI
2. **Node.js app uses Azure OpenAI** to convert to DAX query
3. **Node.js sends DAX to Python XMLA proxy** via HTTP POST
4. **Python proxy authenticates with service principal** using XMLA connection string
5. **Python executes DAX via pyodbc** against Power BI XMLA endpoint
6. **Results flow back** through Python → Node.js → Browser
7. **Chart.js visualizes the data** with green "Live Fabric" badge

## Troubleshooting

### Error: "ODBC Driver not found"

**Solution:**
1. Download ODBC Driver 18 for SQL Server: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
2. Install the driver
3. Verify with: `Get-OdbcDriver | Where-Object {$_.Name -like "*SQL Server*"}`
4. Restart the XMLA proxy service

### Error: "ECONNREFUSED" in Node.js logs

**Meaning:** The XMLA proxy service is not running.

**Solution:**
```powershell
cd xmla-proxy
.\venv\Scripts\Activate.ps1
python app.py
```

### Error: "Authentication failed" in Python logs

**Causes:**
1. Wrong credentials in `xmla-proxy\.env`
2. Service principal not added to workspace
3. Service principal not enabled in tenant settings

**Solution:**
1. Verify credentials match main `.env` file or `.NET appsettings.json`
2. Check service principal has Admin/Member role in your Fabric workspace
3. Verify "Allow service principals to use Power BI APIs" is enabled in tenant settings

### Error: "Dataset not found"

**Cause:** Workspace name or dataset name doesn't match exactly (case-sensitive).

**Solution:**
1. Get exact names from Fabric portal or test-fabric-connection.js output
2. Update `xmla-proxy\.env` or `.NET appsettings.json` with exact names
3. Restart XMLA proxy service

### XMLA proxy works but app still shows mock data

**Solution:**
1. Check main `.env` has: `XMLA_PROXY_URL=http://localhost:5000`
2. Restart Node.js server: `node server.js`
3. Check browser console for errors
4. Verify XMLA proxy logs show incoming requests

## Production Deployment

For production environments:

1. **Use production WSGI server:**
   ```powershell
   pip install waitress
   waitress-serve --port=5000 app:app
   ```

2. **Enable HTTPS:**
   - Configure SSL certificates
   - Update XMLA_PROXY_URL to use https://

3. **Add authentication:**
   - Implement API key authentication
   - Add to both Python service and Node.js client

4. **Configure logging:**
   - Set up proper logging to files
   - Monitor service health

5. **Deploy as Windows Service:**
   ```powershell
   # Install NSSM (Non-Sucking Service Manager)
   choco install nssm
   
   # Create service
   nssm install XmlaProxy "C:\dev\CustomPowerBIEmbed\xmla-proxy\venv\Scripts\python.exe" "C:\dev\CustomPowerBIEmbed\xmla-proxy\app.py"
   nssm start XmlaProxy
   ```

## Benefits

✅ **Service principal authentication works** - No need for user sign-in  
✅ **Automatic and unattended** - Queries run without user interaction  
✅ **Live Fabric data** - Real-time data from your semantic model  
✅ **Seamless fallback** - Automatically uses mock data if proxy is down  
✅ **Easy to deploy** - Simple Python service, no complex infrastructure  
✅ **Performant** - Direct XMLA connection, typically 100-500ms per query  

## Files Created

- `xmla-proxy/app.py` - Flask service with XMLA connectivity
- `xmla-proxy/requirements.txt` - Python dependencies
- `xmla-proxy/.env` - Configuration (credentials)
- `xmla-proxy/.env.example` - Configuration template
- `xmla-proxy/README.md` - Detailed documentation
- `xmla-proxy/setup.ps1` - Automated setup script
- `xmla-proxy/test_service.py` - Test suite for the service

## Next Steps

1. Run the setup: `cd xmla-proxy && .\setup.ps1`
2. Start the service: `python app.py`
3. Test the service: `python test_service.py`
4. Start Node.js app: `node server.js`
5. Open browser: http://localhost:3000
6. Ask: "Show me total sales by category"
7. See green "✓ Live Fabric" badge! 🎉
