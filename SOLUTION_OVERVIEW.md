# AI-Powered Data Visualization Solution

## Executive Summary

This application provides an intelligent, natural language interface for querying and visualizing data stored in Microsoft Fabric semantic models. Users can ask questions in plain English (e.g., "Show me top 10 products by revenue") and receive interactive visualizations powered by Azure OpenAI and Microsoft Fabric's XMLA endpoint.

**Key Benefits:**
- **No Technical Skills Required**: Business users can explore data without knowing DAX or Power BI
- **Real-Time Insights**: Queries are processed in seconds, generating charts and data tables on demand
- **Embeddable**: Designed to integrate into intranet portals, SharePoint sites, or internal dashboards
- **Extensible**: Easy to connect to any Fabric semantic model with minimal configuration

---

## How It Works

### Architecture Overview

```
┌─────────────────┐
│   User Input    │  "Show me sales by region"
│  (Natural Lang) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Web Application                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   Express    │  │   Services   │     │
│  │  (HTML/JS)   │──│     API      │──│   Layer      │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
└────────────────────────────────────────────│───────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
         ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
         │  Azure OpenAI    │   │ Microsoft Fabric │   │   Chart.js       │
         │   (GPT-4o)       │   │  (XMLA Endpoint) │   │ (Visualization)  │
         │                  │   │                  │   │                  │
         │ Converts natural │   │ Executes DAX     │   │ Renders charts   │
         │ language to DAX  │   │ queries, returns │   │ from data        │
         │                  │   │ data             │   │                  │
         └──────────────────┘   └──────────────────┘   └──────────────────┘
```

### End-to-End Flow

**Step 1: User Query Input**
- User types a question in natural language via the web interface
- Example: "What are the top 5 products by revenue this year?"

**Step 2: AI Query Translation**
- Query is sent to Azure OpenAI (via AI Foundry endpoint)
- GPT-4o model receives:
  - System prompt: Instructions to act as a DAX expert
  - User prompt: Question + complete schema of the Fabric semantic model
- AI returns valid DAX query:
```dax
EVALUATE
TOPN(
    5,
    SUMMARIZECOLUMNS(
        'Products'[Product Name],
        "Revenue", [Total Sales]
    ),
    [Revenue], DESC
)
```

**Step 3: Data Retrieval**
- DAX query is executed against Microsoft Fabric via Power BI REST API
- Application authenticates using Azure AD service principal
- Fabric processes the query against the semantic model's XMLA endpoint
- Data is returned as JSON array of objects

**Step 4: AI-Powered Interpretation**
- Raw data is sent back to Azure OpenAI with the original question
- AI analyzes the data structure and content
- Returns:
  - Suggested chart type (bar, line, pie, doughnut, radar)
  - Human-readable title
  - Summary interpretation

**Step 5: Visualization Rendering**
- Frontend receives complete result package
- Chart.js renders the interactive visualization
- Data table displays raw results
- Generated DAX query is shown for transparency
- Full AI prompts and responses displayed in debug section

---

## Technical Implementation

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | User interface, form handling |
| **Visualization** | Chart.js 4.4.0 | Interactive charts (bar, line, pie, doughnut, radar) |
| **Backend** | Node.js 18+, Express 4.18.2 | API server, request orchestration |
| **AI Engine** | Azure OpenAI (GPT-4o-mini) | Natural language to DAX conversion, result interpretation |
| **Data Source** | Microsoft Fabric (Power BI XMLA) | Semantic model queries via REST API |
| **Authentication** | Azure Identity (@azure/identity) | Service principal authentication |

### Project Structure

```
CustomPowerBIEmbed/
├── server.js                 # Express application entry point
├── package.json              # Node.js dependencies
├── .env                      # Configuration (credentials, endpoints)
├── routes/
│   ├── query.js             # POST /api/query - Main query processing
│   └── schema.js            # GET /api/schema - Schema discovery
├── services/
│   ├── aiService.js         # Azure OpenAI integration
│   └── fabricService.js     # Microsoft Fabric data access
├── public/
│   ├── index.html           # Frontend UI
│   ├── app.js               # Frontend logic
│   └── styles.css           # Styling
└── docs/
    ├── README.md            # Quick start guide
    ├── SETUP.md             # Detailed setup instructions
    ├── ARCHITECTURE.md      # Technical architecture
    ├── SCHEMA_GUIDE.md      # Schema configuration
    └── DAX_MODE.md          # DAX implementation details
```

### Key Components Explained

#### 1. AI Service (`services/aiService.js`)

**Purpose**: Manages all interactions with Azure OpenAI.

**Key Functions**:

```javascript
parseQuery(userQuery)
```
- **Input**: Natural language question from user
- **Process**:
  1. Retrieves semantic model schema (cached for 1 hour)
  2. Constructs detailed prompt with schema context and DAX examples
  3. Calls Azure OpenAI with system prompt defining role as "DAX expert"
  4. Cleans response (removes markdown, extra whitespace)
- **Output**: Valid DAX query + confidence score + debug info

```javascript
interpretResults(originalQuery, data)
```
- **Input**: Original question + query results
- **Process**:
  1. Samples first 5 rows of data
  2. Sends to OpenAI with instruction to suggest visualization
  3. Requests JSON response with title, summary, chartType
- **Output**: Interpretation object with visualization recommendations

**AI Prompt Engineering**:

The prompt includes:
- Complete table and column definitions from Fabric
- Measure names and formulas
- DAX syntax rules (EVALUATE, SUMMARIZECOLUMNS, TOPN)
- Multiple example queries showing correct patterns
- Column naming conventions ('Table'[Column], [Measure])

#### 2. Fabric Service (`services/fabricService.js`)

**Purpose**: Executes DAX queries against Microsoft Fabric semantic models.

**Key Functions**:

```javascript
executeQuery(daxQuery)
```
- **Authentication**: Uses `ClientSecretCredential` from @azure/identity
- **Endpoint**: `https://api.powerbi.com/v1.0/myorg/groups/{workspaceId}/datasets/{datasetId}/executeQueries`
- **Request Format**:
```json
{
  "queries": [
    {
      "query": "EVALUATE SUMMARIZECOLUMNS(...)"
    }
  ],
  "serializerSettings": {
    "includeNulls": true
  }
}
```
- **Response**: Parses Power BI API response into clean array of objects
- **Fallback**: If credentials missing or API fails, returns realistic mock data

```javascript
getSchema()
```
- **Purpose**: Discovers semantic model structure dynamically
- **Method 1**: Queries DMV (Dynamic Management View) `$SYSTEM.DISCOVER_TABLES`
- **Method 2**: Falls back to `INFORMATION_SCHEMA.COLUMNS` if DMV unavailable
- **Output**: Formatted text description of all tables, columns, and measures
- **Cache**: Results cached in aiService for 1 hour to reduce API calls

#### 3. Query Route (`routes/query.js`)

**Purpose**: Orchestrates the 4-step query processing pipeline.

**Request Flow**:
```
POST /api/query
Body: { "query": "Show me sales by region" }
```

**Processing Steps**:
1. Validate input (ensure query is non-empty string)
2. Call `aiService.parseQuery()` → Get DAX query
3. Call `fabricService.executeQuery()` → Get data from Fabric
4. Call `aiService.interpretResults()` → Get visualization suggestion
5. Return complete response package

**Response Format**:
```json
{
  "originalQuery": "Show me sales by region",
  "daxQuery": "EVALUATE SUMMARIZECOLUMNS(...)",
  "interpretation": "Sales are highest in the West region",
  "suggestedChartType": "bar",
  "title": "Sales by Region",
  "data": [
    { "Geography[Region]": "West", "[Total Sales]": 2450000 },
    { "Geography[Region]": "East", "[Total Sales]": 2180000 }
  ],
  "debug": {
    "parseQuery": { /* Full AI request/response */ },
    "interpretation": { /* Full AI request/response */ }
  }
}
```

#### 4. Frontend (`public/app.js`)

**Purpose**: Handles user interactions and data visualization.

**Key Features**:
- **Suggestion Chips**: Pre-defined queries users can click ("Show me sales by region")
- **Loading States**: Visual feedback during processing
- **Chart Rendering**: Dynamically creates Chart.js visualizations
- **Chart Type Switching**: Users can change visualization type after results load
- **Data Export**: Download results as CSV
- **Debug Display**: Shows full AI prompts and responses for transparency

**Data Transformation**:
```javascript
prepareChartData(rawData, chartType)
```
- Extracts first column as labels
- Remaining columns become data series
- Generates color palette
- Formats for Chart.js consumption

---

## Configuration Guide

### Required Environment Variables

Edit `.env` file in project root:

```bash
# Azure OpenAI (AI Foundry)
AI_FOUNDRY_ENDPOINT=https://your-resource.openai.azure.com/
AI_FOUNDRY_API_KEY=your-api-key-here
AI_FOUNDRY_DEPLOYMENT_NAME=gpt-4o-mini

# Microsoft Fabric
FABRIC_WORKSPACE_ID=your-workspace-guid
FABRIC_DATASET_ID=your-dataset-guid
FABRIC_TENANT_ID=your-tenant-guid
FABRIC_CLIENT_ID=your-app-registration-client-id
FABRIC_CLIENT_SECRET=your-app-registration-secret

# Server
PORT=3000
```

### Azure Setup Requirements

**1. Azure OpenAI Resource**
- Create Azure OpenAI resource in Azure Portal
- Deploy `gpt-4o-mini` or `gpt-4o` model
- Copy endpoint URL and API key

**2. Azure AD App Registration**
- Create new app registration in Azure AD
- Generate client secret
- Grant API permissions: `Power BI Service` → `Dataset.Read.All`
- Note Client ID and Tenant ID

**3. Microsoft Fabric Workspace**
- Create or use existing Fabric workspace
- Note Workspace ID (from URL: `https://app.fabric.microsoft.com/groups/{WORKSPACE_ID}`)
- Create semantic model with tables and relationships
- Grant app registration "Contributor" role on workspace

### Semantic Model Requirements

Your Fabric semantic model should include:

**Tables** (dimension and fact tables):
```
Sales (fact)
Products (dimension)
Customers (dimension)
Date (dimension)
Geography (dimension)
```

**Relationships**:
```
Sales[ProductID] → Products[ProductID]
Sales[CustomerID] → Customers[CustomerID]
Sales[OrderDate] → Date[Date]
Sales[RegionKey] → Geography[RegionKey]
```

**Measures** (DAX calculations):
```dax
Total Sales = SUM(Sales[SalesAmount])
Total Quantity = SUM(Sales[Quantity])
Total Orders = COUNTROWS(Sales)
Average Order Value = DIVIDE([Total Sales], [Total Orders])
```

---

## Deployment Options

### Option 1: Local Development
```bash
npm install
npm start
# Access at http://localhost:3000
```

### Option 2: Azure App Service
1. Create App Service (Node.js 18 LTS)
2. Configure environment variables in Application Settings
3. Deploy via GitHub Actions, Azure DevOps, or ZIP deployment
4. Enable HTTPS only
5. Configure CORS if embedding in other sites

### Option 3: Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Option 4: Embedded in SharePoint/Intranet
- Deploy backend to Azure App Service
- Embed frontend via iframe:
```html
<iframe 
    src="https://your-app.azurewebsites.net" 
    width="100%" 
    height="800px" 
    frameborder="0">
</iframe>
```

---

## Usage Examples

### Example 1: Sales Performance
**User Query**: "Show me monthly sales trend for 2024"

**Generated DAX**:
```dax
EVALUATE
SUMMARIZECOLUMNS(
    'Date'[Year],
    'Date'[Month Name],
    FILTER('Date', 'Date'[Year] = 2024),
    "Total Sales", [Total Sales]
)
ORDER BY 'Date'[Month]
```

**Result**: Line chart showing sales progression across months

### Example 2: Product Analysis
**User Query**: "Top 10 products by revenue"

**Generated DAX**:
```dax
EVALUATE
TOPN(
    10,
    SUMMARIZECOLUMNS(
        'Products'[Product Name],
        "Revenue", [Total Sales]
    ),
    [Revenue], DESC
)
```

**Result**: Bar chart ranking products

### Example 3: Regional Comparison
**User Query**: "Compare sales across regions"

**Generated DAX**:
```dax
EVALUATE
SUMMARIZECOLUMNS(
    'Geography'[Region],
    "Total Sales", [Total Sales],
    "Total Orders", [Total Orders]
)
ORDER BY [Total Sales] DESC
```

**Result**: Bar chart or pie chart showing regional distribution

---

## Customization Guide

### Adapting to Your Data Model

**Step 1: Update Schema Description** (`services/aiService.js`)
```javascript
getDefaultSchemaDescription() {
    return `YOUR COMPANY SEMANTIC MODEL:
    
    TABLE: 'YourFactTable'
    Columns:
    - 'YourFactTable'[Column1]
    - 'YourFactTable'[Column2]
    
    MEASURES:
    - [Your Measure Name]
    `;
}
```

**Step 2: Update Mock Data** (`services/fabricService.js`)
```javascript
mockExecuteQuery(daxQuery) {
    // Add realistic sample data matching your schema
    if (lowerQuery.includes('your-keyword')) {
        return [
            { 'YourTable[Column]': 'Value1', '[Measure]': 12345 }
        ];
    }
}
```

**Step 3: Update Suggestion Chips** (`public/index.html`)
```html
<span class="chip">Your suggested query 1</span>
<span class="chip">Your suggested query 2</span>
```

### Extending Functionality

**Add New Chart Types**:
1. Update `chartTypeSelector` options in `index.html`
2. Add case handling in `prepareChartData()` in `app.js`
3. Configure Chart.js options for new type

**Add Authentication**:
1. Implement user authentication middleware in Express
2. Pass user context to Fabric queries for Row-Level Security
3. Use `EffectiveUserName` in XMLA query execution

**Add Query History**:
1. Store queries in database (Azure SQL, Cosmos DB)
2. Create `/api/history` endpoint
3. Display recent queries in sidebar

---

## Troubleshooting

### Issue: "AI Foundry credentials not configured"
**Solution**: Verify `.env` file has correct `AI_FOUNDRY_ENDPOINT` and `AI_FOUNDRY_API_KEY`

### Issue: "Failed to execute query against Fabric"
**Causes**:
- Invalid credentials (check `FABRIC_CLIENT_ID`, `FABRIC_CLIENT_SECRET`)
- Missing API permissions on app registration
- Workspace or dataset ID incorrect
- App registration not granted workspace access

**Solution**: 
1. Verify app registration has `Dataset.Read.All` permission
2. Check workspace settings → Manage Access → Add app as Contributor
3. Test credentials using Power BI REST API documentation

### Issue: Generated DAX query fails
**Causes**:
- Schema mismatch (AI doesn't know correct table/column names)
- Invalid DAX syntax from AI

**Solution**:
1. Run `/api/schema` endpoint to verify schema discovery works
2. Check if schema description matches actual model
3. Review AI debug output to see what schema was provided
4. Update prompt examples to match your specific patterns

### Issue: Mock data always returned
**Expected**: When credentials are missing, app falls back to mock mode
**Solution**: Configure all required environment variables to use real Fabric

---

## Security Considerations

### Authentication & Authorization
- **Service Principal**: Uses client credentials flow (not user delegation)
- **Secrets Management**: Store credentials in Azure Key Vault for production
- **CORS**: Configure allowed origins to prevent unauthorized access
- **HTTPS**: Always use HTTPS in production environments

### Data Privacy
- **Row-Level Security**: Fabric RLS is respected in queries
- **No Data Storage**: Application doesn't persist query results
- **Audit Logging**: Consider logging queries for compliance

### API Rate Limiting
- **Azure OpenAI**: Monitor token usage, implement rate limiting if needed
- **Fabric API**: Standard Power BI API limits apply (check Microsoft documentation)

---

## Performance Optimization

### Caching Strategy
- **Schema Cache**: 1-hour TTL (reduces metadata queries)
- **Azure OpenAI**: No caching (each query is unique)
- **Browser Cache**: Static assets cached via HTTP headers

### Query Optimization
- Use specific filters in queries (date ranges, top N)
- Avoid `EVALUATE ALL` without filters
- Leverage Fabric aggregations and columnar storage

### Scaling Considerations
- **Horizontal Scaling**: Deploy multiple app instances behind load balancer
- **Database Connection Pooling**: Not applicable (REST API based)
- **CDN**: Serve static assets via Azure CDN

---

## Monitoring & Analytics

### Application Insights Integration
```javascript
// Add to server.js
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_CONNECTION_STRING).start();
```

**Track**:
- Query processing time
- AI response latency
- Fabric API errors
- Most common queries
- Chart type preferences

### Health Endpoint
```
GET /api/health
Response: { "status": "healthy", "timestamp": "2025-11-26T10:30:00Z" }
```

---

## Cost Estimation

### Azure OpenAI
- **Model**: GPT-4o-mini
- **Tokens per query**: ~1,500 input + 200 output = 1,700 total
- **Cost**: ~$0.0025 per query
- **1,000 queries/month**: ~$2.50

### Microsoft Fabric
- **Capacity Units**: Depends on query complexity
- **Typical cost**: Included in Fabric capacity pricing
- **API calls**: Free (within Power BI Service limits)

### Azure App Service
- **Basic B1**: ~$13/month (suitable for testing)
- **Standard S1**: ~$70/month (recommended for production)
- **Premium P1v2**: ~$150/month (high availability)

**Total Monthly Cost (Production)**:
- App Service: $70
- OpenAI: $2.50 (1,000 queries)
- Fabric: (included in existing capacity)
- **Estimated**: ~$75/month for 1,000 queries

---

## Future Enhancements

### Planned Features
1. **Multi-Language Support**: Translate UI and accept queries in multiple languages
2. **Query Suggestions**: AI-powered autocomplete based on schema
3. **Saved Reports**: Allow users to save and share favorite queries
4. **Scheduled Exports**: Email reports on schedule
5. **Mobile Optimization**: Responsive design improvements
6. **Voice Input**: Speech-to-text for queries
7. **Natural Language Filters**: "Show me last quarter" → Auto-calculate dates
8. **Collaborative Annotations**: Team comments on visualizations

### API Expansion
- `/api/suggest` - Get query suggestions based on schema
- `/api/export` - Server-side PDF/Excel generation
- `/api/share` - Generate shareable links with embedded queries
- `/api/compare` - Side-by-side comparison of time periods

---

## Support & Resources

### Documentation
- `README.md` - Quick start guide
- `SETUP.md` - Detailed setup instructions
- `ARCHITECTURE.md` - Technical deep dive
- `DAX_MODE.md` - DAX implementation details
- `DEMO_DATA.md` - Sample data model

### External Resources
- [Azure OpenAI Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [Power BI REST API](https://learn.microsoft.com/rest/api/power-bi/)
- [DAX Reference](https://dax.guide)
- [Chart.js Documentation](https://www.chartjs.org/docs/)

### Contact & Support
For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check debug output in UI
4. Contact your IT administrator for credential issues

---

## Conclusion

This solution demonstrates the power of combining Azure OpenAI with Microsoft Fabric to create an intuitive, self-service analytics experience. By abstracting away the complexity of DAX and Power BI, you empower business users to explore data independently while maintaining enterprise-grade security and performance.

The architecture is designed to be:
- **Extensible**: Easy to add new features and data sources
- **Maintainable**: Clear separation of concerns and comprehensive logging
- **Scalable**: Can handle growing user bases and data volumes
- **Secure**: Follows Azure best practices for authentication and authorization

Deploy this solution to unlock the full potential of your Fabric data assets for your entire organization.
