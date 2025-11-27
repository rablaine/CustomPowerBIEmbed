# Quick Start - XMLA Proxy (.NET)

## Install .NET SDK

Download and install .NET 8.0 SDK:
https://dotnet.microsoft.com/download

Verify installation:
```powershell
dotnet --version
```

## Start the Service

```powershell
cd xmla-proxy-dotnet
dotnet restore
dotnet run
```

## Test the Service

```powershell
# In a new terminal
Invoke-RestMethod -Uri "http://localhost:5000/test" | ConvertTo-Json
```

Expected output:
```json
{
  "status": "success",
  "message": "XMLA connection working",
  "testResult": [
    { "[Value]": 1 }
  ]
}
```

## Start Node.js App

```powershell
# In another terminal, go to main project
cd C:\dev\CustomPowerBIEmbed
node server.js
```

## Open Browser

Navigate to: http://localhost:3000

Try query: "Show me total sales by category"

You should see green "✓ Live Fabric" badge!

## Troubleshooting

If you get authentication errors:
1. Check `appsettings.json` has correct credentials
2. Verify service principal is Admin in workspace
3. Wait 5-15 minutes after adding permissions

If dotnet command not found:
1. Install .NET 8.0 SDK from link above
2. Restart terminal
3. Try again

## Production Deployment

Build release version:
```powershell
dotnet publish -c Release -o ./publish
cd publish
.\XmlaProxy.exe
```

See README.md for Windows Service, IIS, Docker, and Azure deployment options.
