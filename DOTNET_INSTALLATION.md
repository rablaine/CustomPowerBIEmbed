# .NET SDK Installation Guide

## Step 1: Download .NET 8.0 SDK

**Download link:** https://dotnet.microsoft.com/download/dotnet/8.0

**Choose the installer:**
- Windows x64: `.NET 8.0 SDK (v8.0.xxx) - Windows x64 Installer`
- Recommended: ~200 MB download

## Step 2: Install

1. Run the downloaded installer (e.g., `dotnet-sdk-8.0.xxx-win-x64.exe`)
2. Follow the installation wizard
3. Accept the license agreement
4. Wait for installation to complete (2-3 minutes)

## Step 3: Verify Installation

Open a **NEW** PowerShell terminal (important - restart terminal after install):

```powershell
dotnet --version
```

Expected output: `8.0.xxx`

## Step 4: Restore Dependencies

```powershell
cd C:\dev\CustomPowerBIEmbed\xmla-proxy-dotnet
dotnet restore
```

This will download the ADOMD.NET package (~50 MB)

## Step 5: Run the Service

```powershell
dotnet run
```

You should see:
```
============================================================
XMLA Proxy Service Starting (.NET)
============================================================
Workspace: Playgroundws
Dataset: PowerBIEmbedDataset
============================================================
```

## Step 6: Test the Service

In a NEW PowerShell terminal:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/test" | ConvertTo-Json
```

Expected result:
```json
{
  "status": "success",
  "message": "XMLA connection working",
  "testResult": [...]
}
```

## Step 7: Start Node.js App

```powershell
cd C:\dev\CustomPowerBIEmbed
node server.js
```

## Step 8: Test in Browser

Open: http://localhost:3000

Try: "Show me total sales by category"

Look for: Green "✓ Live Fabric" badge

## Troubleshooting

### "dotnet command not found" after installation

**Solution:** Close ALL terminal windows and open a new one. The PATH is updated during installation.

### Still not working after restart

**Solution:** Log out and log back in to Windows, or restart your computer.

### Installation failed

**Solution:** 
1. Check you have administrator rights
2. Check you have at least 500 MB free disk space
3. Check Windows version is Windows 10 1607+ or Windows 11

### "Unable to connect to the server" when testing

**Causes:**
- Service principal credentials incorrect in `appsettings.json`
- Service principal not added to workspace as Admin
- Workspace/dataset names don't match exactly

**Solution:**
1. Verify credentials in `xmla-proxy-dotnet\appsettings.json`
2. Check Azure AD app registration has correct client ID and secret
3. Verify service principal is Admin in Power BI workspace
4. Ensure workspace and dataset names match exactly (case-sensitive)

## Why .NET Instead of Python?

The XMLA endpoint with service principal authentication requires ADOMD.NET, which is a .NET library. Python's pyodbc uses ODBC drivers that don't support XMLA protocol. This is a Microsoft limitation, not a configuration issue.

## Next Steps After Installation

1. Install .NET SDK (this guide)
2. Restart terminal
3. Run `dotnet restore` in `xmla-proxy-dotnet` folder
4. Run `dotnet run` to start service
5. Test with PowerShell commands above
6. Start Node.js app
7. Celebrate live Fabric data! 🎉
