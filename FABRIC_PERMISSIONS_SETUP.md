# Power BI API Permissions Setup Guide

Your service principal can authenticate but cannot see any workspaces (found 0). This means the Azure AD app registration needs proper API permissions.

## Required Steps

### 1. Add Power BI Service API Permissions

1. Go to **Azure Portal** (https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find your app: Client ID `6222b4f2-7b8d-4059-81d1-5e8bb0293fa1`
4. Click on your app to open it
5. In the left menu, click **API permissions**
6. Click **+ Add a permission**
7. Select **Power BI Service**
8. Choose **Delegated permissions** (NOT Application permissions)
9. Check these permissions:
   - ☑ **Dataset.Read.All** - Read all datasets
   - ☑ **Workspace.Read.All** - Read all workspaces
   - ☑ **Dataflow.Read.All** - Read all dataflows (optional)
   - ☑ **Content.Create** - Create content (optional)
10. Click **Add permissions**
11. Click **Grant admin consent for [Your Organization]** ← **CRITICAL STEP**
12. Confirm when prompted

### 2. Enable Power BI Service Principal Access

Service principals are **disabled by default** in Power BI. You must enable them:

1. Go to **Power BI Admin Portal** (https://app.powerbi.com)
2. Click the **Settings gear icon** (top right) → **Admin portal**
3. In the left menu, click **Tenant settings**
4. Scroll down to **Developer settings** section
5. Find **Service principals can use Fabric APIs**
6. Toggle it to **Enabled**
7. Choose one of:
   - **The entire organization** (easiest for testing)
   - **Specific security groups** (recommended for production)
     - If using groups, add your service principal to that group
8. Click **Apply**

**Wait 5-15 minutes** for this change to propagate.

### 3. Verify Workspace Role

Even with API permissions, the service principal needs workspace access:

1. Go to **Power BI Service** (https://app.powerbi.com)
2. Navigate to your workspace: `c03f35f2-d1e6-4005-b085-e258dd1285b4`
3. Click the workspace name → **Manage access**
4. Click **Add people or groups**
5. Search for your app name or paste Client ID: `6222b4f2-7b8d-4059-81d1-5e8bb0293fa1`
6. Assign role: **Admin** or **Contributor**
7. Click **Add**

### 4. Test Again

After completing steps 1-3 and waiting ~10 minutes:

```bash
node test-fabric-connection.js
```

You should now see:
```
✓ Can access Power BI API
  Found 1+ workspaces
✓ Found target workspace: "YourWorkspaceName"
```

## Troubleshooting

### Still getting "found 0 workspaces"?

**Most common cause**: Service principals not enabled in Power BI tenant settings (Step 2 above)

Check:
1. Power BI Admin Portal → Tenant settings → Developer settings
2. "Service principals can use Fabric APIs" must be **Enabled**
3. Your service principal must be in the allowed list

### Getting 401 Unauthorized?

**Cause**: Missing "Grant admin consent" 

Fix:
1. Azure Portal → App registrations → Your app → API permissions
2. Click **Grant admin consent** button
3. Must be done by a tenant admin

### Getting 403 Forbidden?

**Cause**: Service principal not in workspace or wrong role

Fix:
1. Power BI workspace → Manage access
2. Add service principal with Admin or Contributor role

### Workspace ID is correct but still not found?

**Possible causes**:
1. Workspace is in a **Premium Per User (PPU)** capacity - service principals don't work with PPU
2. Workspace is in a **Personal workspace** - use regular workspaces only
3. Permissions haven't propagated - wait 15-30 minutes

### How to check if service principals are enabled?

Run this PowerShell (requires Power BI admin):
```powershell
Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser
Connect-PowerBIServiceAccount
Get-PowerBIWorkspace -Scope Organization | Where-Object { $_.Id -eq "c03f35f2-d1e6-4005-b085-e258dd1285b4" }
```

## Expected Result After Setup

When you run `node test-fabric-connection.js`, you should see:

```
Step 2: Testing Workspace Access...
------------------------------------------------------------
✓ Can access Power BI API
  Found 1 workspaces
✓ Found target workspace: "YourWorkspaceName"
  ID: c03f35f2-d1e6-4005-b085-e258dd1285b4
  Type: Workspace

Step 3: Testing Specific Workspace Access...
------------------------------------------------------------
✓ Can access workspace directly
  Name: YourWorkspaceName
  ID: c03f35f2-d1e6-4005-b085-e258dd1285b4

Step 6: Testing DAX Query Execution...
------------------------------------------------------------
✓ Successfully executed DAX query
  Response: {"[Value]":1}
```

## Important Notes

- **Application permissions** (app-only) require different setup than **Delegated permissions**
- For service principals, use **Delegated permissions** despite the name
- Power BI tenant settings override all other permissions
- Premium capacity is required for service principal access (P1-P5, F64+, or Premium Per Capacity)
- Premium Per User (PPU) does NOT support service principals

## Next Steps After Fixing

Once diagnostic shows success:
1. Restart your application: `npm start`
2. Test a query in the UI
3. You should see **"✓ Live Fabric"** badge instead of **"⚠ Mock Data"**
