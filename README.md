# Custom Power BI Embed - AI-Powered Data Visualization

An embeddable web application that uses AI to parse natural language queries, retrieve data from Microsoft Fabric, and generate visualizations.

## Features

- Natural language query interface powered by Azure OpenAI (gpt-4o-mini)
- AI-powered query parsing that converts questions into DAX
- Live data retrieval from Microsoft Fabric via XMLA endpoint
- Service principal authentication through .NET middleware
- Dynamic visualization generation with Chart.js
- Automatic fallback to mock data for demos
- Embeddable in intranet pages

## Architecture

```
Browser → Node.js/Express → Azure OpenAI (DAX generation)
                         ↓
                    .NET XMLA Proxy (ADOMD.NET)
                         ↓
                    Microsoft Fabric Semantic Model
```

## Prerequisites

- **Node.js 18+** - For the Express web server
- **.NET 8.0 SDK** - For the XMLA proxy middleware
- **Azure subscription** - For AI Foundry and Fabric
- **Microsoft Fabric** - With a Fabric capacity (F2+ or Trial work)
- **Azure AD app registration** - Service principal for authentication

---

## Complete Setup Guide

### Step 1: Provision Sample Data in Microsoft Fabric

#### 1.1 Create a Lakehouse

1. Open your Microsoft Fabric workspace
2. Click **+ New** → **Lakehouse**
3. Name it (e.g., `ContosoRetailLakehouse`)
4. Click **Create**

#### 1.2 Generate Sample Data

1. In your Lakehouse, click **Open notebook** → **New notebook**
2. Copy the contents from `scripts/generate-sample-data.py` into the notebook
3. Run all cells to generate:
   - `sales` table (~50,000 transactions)
   - `products` table (~1,000 products)
   - `customers` table (~500 customers)
   - `date` table (2022-2025)
4. Verify tables appear in your Lakehouse

**Note:** The sample script is located at `scripts/generate-sample-data.py` and includes realistic retail data with categories, regions, and time series.

#### 1.3 Create a Semantic Model

1. In your Fabric workspace, click **+ New** → **Semantic model**
2. Choose **Lakehouse** as the data source
3. Select your Lakehouse (e.g., `ContosoRetailLakehouse`)
4. Select all four tables: `sales`, `products`, `customers`, `date`
5. Click **Create**
6. Name your semantic model (e.g., `ContosoRetailSemanticModel`)

#### 1.4 Define Relationships (Recommended)

In the semantic model editor:
1. Create relationship: `sales[ProductID]` → `products[ProductID]`
2. Create relationship: `sales[CustomerID]` → `customers[CustomerID]`
3. Create relationship: `sales[OrderDate]` → `date[Date]`
4. Click **Save**

#### 1.5 Get Workspace and Dataset IDs

**Workspace ID:**
1. In your Fabric workspace, click the **⚙️ Settings** icon
2. Copy the **Workspace ID** from the URL or settings panel
3. Format: `c03f35f2-d1e6-4005-b085-e258dd1285b4`

**Dataset ID:**
1. In your workspace, find your semantic model
2. Click **⋯ More options** → **Settings**
3. Copy the **Dataset ID** from the URL
4. Format: `a35e0472-6b12-462f-a533-7946cfb16f3b`

**Alternative method - via URL:**
- Workspace ID is in the URL: `https://app.fabric.microsoft.com/groups/{workspace-id}/`
- Dataset ID is in the settings URL: `https://app.fabric.microsoft.com/groups/{workspace-id}/datasets/{dataset-id}/settings`

---

### Step 2: Create Service Principal (Azure AD App Registration)

#### 2.1 Register Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **+ New registration**
4. Configure:
   - **Name:** `FabricQueryServicePrincipal` (or your choice)
   - **Supported account types:** Single tenant
   - Click **Register**

#### 2.2 Create Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **+ New client secret**
3. Add description: `FabricAccess`
4. Set expiration (90 days, 180 days, or custom)
5. Click **Add**
6. **IMPORTANT:** Copy the **Value** immediately (you won't see it again!)
7. Save this as `FABRIC_CLIENT_SECRET`

#### 2.3 Copy Application (Client) ID and Tenant ID

1. Go to **Overview** page of your app registration
2. Copy **Application (client) ID** → Save as `FABRIC_CLIENT_ID`
3. Copy **Directory (tenant) ID** → Save as `FABRIC_TENANT_ID`

---

### Step 3: Grant Service Principal Access to Fabric

#### 3.1 Enable Service Principals in Tenant Settings

1. Go to [Power BI Admin Portal](https://app.powerbi.com/admin-portal)
2. Click **Tenant settings**
3. Find **Developer settings** → **Allow service principals to use Power BI APIs**
4. Set to **Enabled**
5. Choose **Specific security groups** (recommended) or **Entire organization**
6. If using security groups:
   - Create an Azure AD security group (e.g., `FabricAccessGroup`)
   - Add your service principal as a member
   - Add the security group name here
7. Click **Apply**

#### 3.2 Add Service Principal to Workspace

1. Open your Fabric workspace (where your semantic model lives)
2. Click **Manage access** or **⋯ More options** → **Workspace access**
3. Click **+ Add people or groups**
4. Search for your app name: `FabricQueryServicePrincipal`
5. Select it (shows as a service principal)
6. Grant **Viewer** or above role
7. Click **Add**

---

### Step 4: Set Up Azure AI Foundry (gpt-4o-mini)

#### 4.1 Create Azure OpenAI Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **+ Create a resource**
3. Search for **Azure OpenAI**
4. Click **Create**
5. Configure:
   - **Subscription:** Your subscription
   - **Resource group:** Create new or use existing
   - **Region:** Choose a region with GPT-4o availability
   - **Name:** `your-ai-foundry-resource`
   - **Pricing tier:** Standard S0
6. Click **Review + create** → **Create**

#### 4.2 Deploy gpt-4o-mini Model

1. Once created, go to your Azure OpenAI resource
2. Click **Model deployments** (or **Go to Azure OpenAI Studio**)
3. Click **+ Create new deployment**
4. Configure:
   - **Model:** `gpt-4o-mini`
   - **Deployment name:** `gpt-4o-mini` (recommended)
   - **Deployment type:** Standard
   - **Tokens per minute rate limit:** 10K (or higher)
5. Click **Create**

#### 4.3 Get Endpoint and API Key

1. In Azure Portal, go to your Azure OpenAI resource
2. Click **Keys and Endpoint**
3. Copy:
   - **Endpoint:** `https://your-resource.cognitiveservices.azure.com/`
   - **KEY 1:** Your API key
4. Save these as:
   - `AI_FOUNDRY_ENDPOINT`
   - `AI_FOUNDRY_API_KEY`
   - `AI_FOUNDRY_DEPLOYMENT_NAME` = `gpt-4o-mini`

---

### Step 5: Configure the Application

#### 5.1 Install Node.js Dependencies

```powershell
cd C:\dev\CustomPowerBIEmbed
npm install
```

#### 5.2 Configure Main Application (.env)

Edit `.env` file in the root directory:

```env
# Azure AI Foundry Configuration
AI_FOUNDRY_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AI_FOUNDRY_API_KEY=your-api-key-here
AI_FOUNDRY_DEPLOYMENT_NAME=gpt-4o-mini

# Microsoft Fabric Configuration
FABRIC_WORKSPACE_ID=your-workspace-id
FABRIC_DATASET_ID=your-dataset-id
FABRIC_TENANT_ID=your-tenant-id
FABRIC_CLIENT_ID=your-client-id
FABRIC_CLIENT_SECRET=your-client-secret

# Server Configuration
PORT=3000
NODE_ENV=development

# XMLA Proxy Configuration
XMLA_PROXY_URL=http://localhost:5000
```

#### 5.3 Configure .NET XMLA Proxy

Edit `xmla-proxy-dotnet/appsettings.json`:

```json
{
  "FabricConfig": {
    "TenantId": "your-tenant-id",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret",
    "WorkspaceName": "YourWorkspaceName",
    "DatasetName": "ContosoRetailSemanticModel"
  },
  "Urls": "http://0.0.0.0:5000"
}
```

**Important:** Use the **workspace name** and **dataset name** (not IDs) in appsettings.json.

---

### Step 6: Start the XMLA Proxy (.NET Middleware)

The .NET middleware is required for service principal authentication with Fabric XMLA endpoint.

#### 6.1 Open a Dedicated Terminal

```powershell
cd C:\dev\CustomPowerBIEmbed\xmla-proxy-dotnet
```

#### 6.2 Start the Service

```powershell
dotnet run
```

You should see:
```
============================================================
XMLA Proxy Service Starting (.NET)
============================================================
Workspace: YourWorkspaceName
Dataset: ContosoRetailSemanticModel
============================================================
Now listening on: http://0.0.0.0:5000
```

**Keep this terminal open** - the service must stay running.

#### 6.3 Test the Middleware (Optional)

In a **new** PowerShell window:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/test" | ConvertTo-Json
```

Expected output:
```json
{
  "status": "success",
  "message": "XMLA connection working",
  "testResult": [...]
}
```

---

### Step 7: Start the Node.js Application

#### 7.1 Open Another Terminal

```powershell
cd C:\dev\CustomPowerBIEmbed
```

#### 7.2 Start the Server

```powershell
node server.js
```

You should see:
```
Server running on http://localhost:3000
Environment: development
```

---

### Step 8: Test the Application

1. Open your browser to **http://localhost:3000**
2. Try these sample queries:
   - "Sales by category"
   - "Top 10 products by revenue"
   - "Customer segment performance"
   - "Regional sales comparison"
   - "Monthly sales trend"

3. Look for the **green "✓ Live Fabric"** badge indicating live data
4. If you see **orange "⚠ Mock Data"**, the middleware isn't connected

---

## Troubleshooting

### Test Fabric Connection

If queries are falling back to mock data, run the connection test:

1. **Start the .NET middleware first** (Step 6)
2. In a new terminal:

```powershell
cd C:\dev\CustomPowerBIEmbed
node test-fabric-connection.js
```

This will test:
- ✓ XMLA proxy is running on port 5000
- ✓ Service principal authentication works
- ✓ Can connect to your workspace
- ✓ Can access your dataset
- ✓ Can execute DAX queries

### Common Issues

**"ECONNREFUSED" or proxy errors:**
- The .NET middleware isn't running
- Solution: Start `dotnet run` in `xmla-proxy-dotnet` folder

**"401 Unauthorized" or "403 Forbidden":**
- Service principal doesn't have workspace access
- Solution: Add service principal as Admin to workspace (Step 3.2)

**"404 Not Found" or "Dataset not found":**
- Workspace name or dataset name is incorrect in `appsettings.json`
- Solution: Verify exact names (case-sensitive) match your Fabric workspace

**"Cannot find table" errors:**
- Schema doesn't match generated queries
- Solution: Run `node discover-schema.js` to see actual table structure

**AI not generating valid DAX:**
- Model deployment name is incorrect
- Solution: Verify `AI_FOUNDRY_DEPLOYMENT_NAME` matches your deployment

### Getting Help

1. Check console logs in both terminals (Node.js and .NET)
2. Run `test-fabric-connection.js` for detailed diagnostics
3. Verify all credentials are correct in `.env` and `appsettings.json`
4. Ensure workspace is on Fabric capacity (not trial)

---

## Development

### Running in Development Mode

```bash
npm run dev
```

### Discovering Schema

To see your actual dataset structure:

```bash
node discover-schema.js
```

This creates `schema.json` with your tables, columns, and data types.

---

## Embedding in Intranet

To embed in SharePoint, Teams, or other intranet pages:

```html
<iframe 
  src="http://your-server:3000" 
  width="100%" 
  height="600px" 
  frameborder="0"
  allow="clipboard-write"
></iframe>
```

### Production Deployment

For production:
1. Deploy Node.js app to Azure App Service or container
2. Deploy .NET middleware as Windows Service or container
3. Use Azure Key Vault for secrets
4. Enable HTTPS on both services
5. Configure CORS appropriately

---

## Project Structure

```
CustomPowerBIEmbed/
├── server.js                  # Express server
├── .env                       # Configuration (not in git)
├── public/                    # Frontend files
│   ├── index.html            # Web UI
│   ├── app.js                # Client-side JavaScript
│   └── styles.css            # Styling
├── services/
│   ├── aiService.js          # Azure OpenAI integration
│   └── fabricService.js      # Fabric data access
├── routes/
│   └── query.js              # API endpoints
├── xmla-proxy-dotnet/        # .NET XMLA middleware
│   ├── Program.cs            # ASP.NET minimal API
│   ├── appsettings.json      # Configuration
│   └── XmlaProxy.csproj      # Project file
├── scripts/
│   └── generate-sample-data.py  # Lakehouse data generation
├── test-fabric-connection.js # Connection diagnostics
└── discover-schema.js        # Schema discovery tool
```

---

## License

MIT
