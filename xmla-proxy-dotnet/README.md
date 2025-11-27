# XMLA Proxy Service (.NET)

ASP.NET minimal API service that enables service principal authentication for Power BI DAX queries using ADOMD.NET.

## Why .NET?

The XMLA endpoint with service principal authentication requires ADOMD.NET client libraries, which are only available for .NET. Python's pyodbc uses ODBC drivers that don't support the XMLA protocol.

## Prerequisites

- **.NET 8.0 SDK** - Download from https://dotnet.microsoft.com/download
- **Service Principal** configured in Azure AD with Power BI permissions
- **Workspace access** - Service principal must be Admin/Member of the workspace

## Installation

### Step 1: Install .NET SDK

**Windows:**
1. Download .NET 8.0 SDK from https://dotnet.microsoft.com/download
2. Run the installer
3. Verify installation:
   ```powershell
   dotnet --version
   ```

### Step 2: Restore Dependencies

```powershell
cd xmla-proxy-dotnet
dotnet restore
```

This will download:
- Microsoft.AnalysisServices.AdomdClient.NetCore.retail.amd64 (19.84.2)
- ASP.NET Core runtime dependencies

### Step 3: Configure Settings

Edit `appsettings.json` with your values:

```json
{
  "FabricConfig": {
    "TenantId": "your-tenant-id",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret",
    "WorkspaceName": "Playgroundws",
    "DatasetName": "PowerBIEmbedDataset"
  }
}
```

## Running the Service

### Development Mode

```powershell
cd xmla-proxy-dotnet
dotnet run
```

The service will start on http://localhost:5000

### Production Mode

```powershell
dotnet publish -c Release -o ./publish
cd publish
.\XmlaProxy.exe
```

## API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "XMLA Proxy (.NET)",
  "workspace": "Playgroundws",
  "dataset": "PowerBIEmbedDataset"
}
```

### Test Connection
```
GET /test
```

Tests XMLA connection with `EVALUATE { 1 }` query.

**Response:**
```json
{
  "status": "success",
  "message": "XMLA connection working",
  "testResult": [
    { "[Value]": 1 }
  ]
}
```

### Execute DAX Query
```
POST /query
Content-Type: application/json

{
  "query": "EVALUATE TOPN(10, Sales)"
}
```

**Response:**
```json
{
  "data": [
    { "ProductName": "Widget", "Sales": 1500 },
    { "ProductName": "Gadget", "Sales": 2300 }
  ],
  "rowCount": 2
}
```

## Testing

### PowerShell Tests

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:5000/health" | ConvertTo-Json

# Connection test
Invoke-RestMethod -Uri "http://localhost:5000/test" | ConvertTo-Json

# Execute query
$body = @{ query = "EVALUATE { 1 }" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/query" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json
```

### curl Tests

```powershell
# Health check
curl http://localhost:5000/health

# Connection test
curl http://localhost:5000/test

# Execute query
curl -X POST http://localhost:5000/query `
  -H "Content-Type: application/json" `
  -d '{"query":"EVALUATE { 1 }"}'
```

## Integration with Node.js App

The Node.js `fabricService.js` is already configured to use the proxy at `http://localhost:5000`. Just make sure `XMLA_PROXY_URL=http://localhost:5000` is set in your main `.env` file.

## Architecture

```
┌─────────────┐     HTTP POST        ┌───────────────┐
│             │  /api/query (DAX)    │               │
│  Browser    │────────────────────> │  Node.js App  │
│             │                      │  (Express)    │
└─────────────┘                      └───────────────┘
                                             │
                                             │ HTTP POST
                                             │ /query (DAX)
                                             ▼
                                     ┌───────────────┐
                                     │  ASP.NET API  │
                                     │  ADOMD.NET    │
                                     │  (.NET 8)     │
                                     └───────────────┘
                                             │
                                             │ XMLA Protocol
                                             │ (Service Principal)
                                             ▼
                                     ┌───────────────┐
                                     │  Microsoft    │
                                     │  Fabric       │
                                     │  Dataset      │
                                     └───────────────┘
```

## Deployment Options

### Option 1: Windows Service

Install as a Windows Service using NSSM:

```powershell
# Install NSSM
choco install nssm

# Create service
nssm install XmlaProxyNet "C:\dev\CustomPowerBIEmbed\xmla-proxy-dotnet\publish\XmlaProxy.exe"
nssm set XmlaProxyNet AppDirectory "C:\dev\CustomPowerBIEmbed\xmla-proxy-dotnet\publish"
nssm start XmlaProxyNet
```

### Option 2: IIS Hosting

1. Publish the app:
   ```powershell
   dotnet publish -c Release -o ./publish
   ```

2. Create IIS Application Pool and Website

3. Point to the `publish` folder

4. Ensure ApplicationPoolIdentity has access to config files

### Option 3: Docker

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY publish/ .
EXPOSE 5000
ENTRYPOINT ["dotnet", "XmlaProxy.dll"]
```

```powershell
dotnet publish -c Release -o ./publish
docker build -t xmla-proxy .
docker run -p 5000:5000 xmla-proxy
```

### Option 4: Azure App Service

```powershell
# Create App Service
az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name my-xmla-proxy --runtime "DOTNET:8.0"

# Deploy
dotnet publish -c Release -o ./publish
az webapp deployment source config-zip --resource-group myResourceGroup --name my-xmla-proxy --src ./publish.zip
```

## Performance

- **ADOMD.NET** is the official Microsoft client library for Analysis Services
- **Typical query response:** 50-200ms depending on dataset complexity
- **Concurrent requests:** Supports multiple simultaneous queries
- **Connection pooling:** Automatically managed by ADOMD.NET
- **Production-ready:** Built on ASP.NET Core minimal API

## Troubleshooting

### Error: "Unable to connect to the server"

**Causes:**
1. Service principal credentials incorrect
2. Service principal not added to workspace
3. Workspace/dataset names don't match exactly

**Solution:**
1. Verify credentials in `appsettings.json`
2. Check service principal is Admin/Member in workspace
3. Verify names are case-sensitive matches

### Error: "The user is not authorized"

**Cause:** Service principal doesn't have workspace access

**Solution:**
1. Add service principal to workspace as Admin or Member
2. Ensure "Allow service principals to use Power BI APIs" is enabled in tenant settings
3. Wait 5-15 minutes for permission propagation

### Error: dotnet command not found

**Cause:** .NET SDK not installed or not in PATH

**Solution:**
1. Install .NET 8.0 SDK from https://dotnet.microsoft.com/download
2. Restart terminal after installation
3. Verify with: `dotnet --version`

### Error: Package Microsoft.AnalysisServices.AdomdClient not found

**Cause:** NuGet package restore failed

**Solution:**
```powershell
dotnet restore --force
dotnet clean
dotnet build
```

## Security Best Practices

- **Never commit appsettings.json** with real credentials to git
- **Use Azure Key Vault** for production secrets
- **Enable HTTPS** in production
- **Add API authentication** between Node.js and .NET service
- **Run as limited service account** not administrator
- **Rotate client secrets** regularly (every 90 days recommended)

## Advantages over Python

✅ **Native ADOMD.NET support** - Official Microsoft library  
✅ **Better performance** - Direct XMLA protocol, no translation layer  
✅ **Production-ready** - ASP.NET Core is battle-tested  
✅ **Easy deployment** - Single executable with `dotnet publish`  
✅ **Windows Service support** - Native OS integration  
✅ **Excellent tooling** - Visual Studio, Rider, VS Code support  

## Files

- `Program.cs` - Main application with minimal API endpoints
- `XmlaProxy.csproj` - Project file with dependencies
- `appsettings.json` - Configuration (credentials, workspace, dataset)
- `README.md` - This file

## Next Steps

1. Install .NET 8.0 SDK
2. Run `dotnet restore` to download dependencies
3. Edit `appsettings.json` with your credentials
4. Run `dotnet run` to start the service
5. Test with `Invoke-RestMethod -Uri "http://localhost:5000/test"`
6. Start Node.js app: `node server.js`
7. Open browser: http://localhost:3000
8. Ask: "Show me total sales by category"
9. See green "✓ Live Fabric" badge! 🎉
