# Application Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Web Browser                                │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  index.html (UI Structure)                               │  │ │
│  │  │  - Text input for queries                                │  │ │
│  │  │  - Suggestion chips                                      │  │ │
│  │  │  - Chart display area                                    │  │ │
│  │  │  - Data table preview                                    │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  styles.css (Visual Design)                              │  │ │
│  │  │  - Professional theme                                    │  │ │
│  │  │  - Responsive layout                                     │  │ │
│  │  │  - Microsoft-inspired colors                             │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  app.js (Client Logic)                                   │  │ │
│  │  │  - API communication                                     │  │ │
│  │  │  - Chart.js rendering                                    │  │ │
│  │  │  - Event handling                                        │  │ │
│  │  │  - CSV export                                            │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND API SERVER                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  server.js (Express Server)                                    │ │
│  │  - Static file serving                                         │ │
│  │  - API routing                                                 │ │
│  │  - CORS handling                                               │ │
│  │  - Error handling                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  routes/query.js (Request Handler)                             │ │
│  │  - POST /api/query endpoint                                    │ │
│  │  - Request validation                                          │ │
│  │  - Service orchestration                                       │ │
│  │  - Response formatting                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                  │
│  ┌──────────────────────────────────┬───────────────────────────┐  │
│  │  services/aiService.js           │  services/fabricService.js│  │
│  │  ┌────────────────────────────┐  │  ┌────────────────────┐   │  │
│  │  │ parseQuery()               │  │  │ executeQuery()     │   │  │
│  │  │ - Convert NL to SQL        │  │  │ - Run SQL query    │   │  │
│  │  │ - Build prompts            │  │  │ - Parse results    │   │  │
│  │  │ - Mock fallback            │  │  │ - Mock data        │   │  │
│  │  └────────────────────────────┘  │  └────────────────────┘   │  │
│  │  ┌────────────────────────────┐  │  ┌────────────────────┐   │  │
│  │  │ interpretResults()         │  │  │ testConnection()   │   │  │
│  │  │ - Suggest chart type       │  │  │ - Auth check       │   │  │
│  │  │ - Generate summary         │  │  │ - Token mgmt       │   │  │
│  │  │ - Mock fallback            │  │  │                    │   │  │
│  │  └────────────────────────────┘  │  └────────────────────┘   │  │
│  └──────────────────────────────────┴───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                ↕                                  ↕
┌──────────────────────────────┐  ┌──────────────────────────────────┐
│   AZURE AI FOUNDRY           │  │   MICROSOFT FABRIC               │
│  ┌────────────────────────┐  │  │  ┌────────────────────────────┐ │
│  │ GPT-4 Model            │  │  │  │ Data Warehouse             │ │
│  │ - Natural Language     │  │  │  │ - Sales data               │ │
│  │ - SQL Generation       │  │  │  │ - Product data             │ │
│  │ - Query interpretation │  │  │  │ - Customer data            │ │
│  └────────────────────────┘  │  │  └────────────────────────────┘ │
└──────────────────────────────┘  └──────────────────────────────────┘
```

## Data Flow Sequence

```
1. USER INPUT
   └─> User types: "Show me sales by region"
       │
2. FRONTEND (app.js)
   └─> POST /api/query { query: "Show me sales by region" }
       │
3. BACKEND (routes/query.js)
   └─> Receives request
       └─> Validates input
           │
4. AI SERVICE (aiService.js)
   └─> parseQuery(query)
       └─> Builds prompt: "Convert to SQL: Show me sales by region"
           └─> Calls Azure AI Foundry API
               └─> Returns: "SELECT region, SUM(revenue) FROM sales GROUP BY region"
           │
5. FABRIC SERVICE (fabricService.js)
   └─> executeQuery(sqlQuery)
       └─> Authenticates with Azure AD
           └─> Calls Fabric REST API
               └─> Returns: [
                     {region: "North America", revenue: 1250000},
                     {region: "Europe", revenue: 980000}, ...
                   ]
           │
6. AI SERVICE (aiService.js)
   └─> interpretResults(query, data)
       └─> Analyzes data structure
           └─> Returns: {
                 title: "Sales by Region",
                 summary: "Revenue performance across regions",
                 chartType: "bar"
               }
           │
7. BACKEND (routes/query.js)
   └─> Combines all data
       └─> Returns JSON: {
             originalQuery, sqlQuery, interpretation,
             suggestedChartType, title, data
           }
           │
8. FRONTEND (app.js)
   └─> Receives response
       └─> Displays status message
           └─> Renders chart with Chart.js
               └─> Shows data table
                   └─> Enables CSV export
           │
9. USER SEES
   └─> Interactive bar chart
       └─> Data table below
           └─> Can switch chart types
               └─> Can download CSV
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                        Request Lifecycle                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Action          →  Frontend Event                         │
│  ↓                       ↓                                       │
│  Submit Query         →  handleSubmit()                         │
│  ↓                       ↓                                       │
│  Show Loading         →  setLoading(true)                       │
│  ↓                       ↓                                       │
│  API Call             →  fetch('/api/query', {...})            │
│  ↓                       ↓                                       │
│  Backend Receives     →  POST /api/query                        │
│  ↓                       ↓                                       │
│  Parse with AI        →  aiService.parseQuery()                │
│  ↓                       ↓                                       │
│  Execute Query        →  fabricService.executeQuery()          │
│  ↓                       ↓                                       │
│  Interpret Results    →  aiService.interpretResults()          │
│  ↓                       ↓                                       │
│  Send Response        →  res.json(result)                       │
│  ↓                       ↓                                       │
│  Frontend Receives    →  response.json()                        │
│  ↓                       ↓                                       │
│  Render Chart         →  renderChart(data, type)               │
│  ↓                       ↓                                       │
│  Show Table           →  renderDataTable(data)                 │
│  ↓                       ↓                                       │
│  Hide Loading         →  setLoading(false)                      │
│  ↓                       ↓                                       │
│  User Sees Result     →  Interactive Visualization             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Mock Data Flow (Current State)

```
┌─────────────────────────────────────────────────────────────────┐
│              Running WITHOUT Azure Credentials                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Query                                                      │
│      ↓                                                           │
│  Frontend                                                        │
│      ↓                                                           │
│  Backend API                                                     │
│      ↓                                                           │
│  aiService.parseQuery()                                         │
│      ↓                                                           │
│  [No AI credentials detected]                                   │
│      ↓                                                           │
│  mockParseQuery() ← Intelligent pattern matching               │
│      ↓                                                           │
│  Returns mock SQL based on keywords                             │
│      ↓                                                           │
│  fabricService.executeQuery()                                   │
│      ↓                                                           │
│  [No Fabric credentials detected]                               │
│      ↓                                                           │
│  mockExecuteQuery() ← Returns realistic test data              │
│      ↓                                                           │
│  aiService.interpretResults()                                   │
│      ↓                                                           │
│  [No AI credentials detected]                                   │
│      ↓                                                           │
│  mockInterpretResults() ← Smart chart type selection           │
│      ↓                                                           │
│  Returns complete mock result                                   │
│      ↓                                                           │
│  Frontend renders visualization                                 │
│      ↓                                                           │
│  User sees realistic demo data                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## File Dependencies

```
server.js
  ├── express
  ├── cors
  ├── dotenv
  └── routes/query.js
        ├── services/aiService.js
        │     ├── axios (for AI Foundry API)
        │     └── Mock data generators
        └── services/fabricService.js
              ├── axios (for Fabric API)
              ├── @azure/identity (for auth)
              └── Mock data generators

public/index.html
  ├── public/styles.css
  ├── public/app.js
  └── Chart.js (CDN)
```

## Configuration Flow

```
.env file
  ↓
dotenv loads at startup
  ↓
process.env variables
  ↓
Service constructors
  ↓
Check if credentials exist
  ↓
┌──────────────┬──────────────┐
│ YES          │ NO           │
├──────────────┼──────────────┤
│ Use real API │ Use mock data│
│ Azure auth   │ Pattern match│
│ Real queries │ Test data    │
└──────────────┴──────────────┘
```

## Chart Rendering Pipeline

```
Data from API
  ↓
prepareChartData(rawData, chartType)
  ↓
Extract columns
  ├── First column → Labels (X-axis)
  └── Other columns → Data series (Y-axis)
  ↓
Generate color palette
  ↓
Format for Chart.js
  ├── Pie/Doughnut → Single dataset with colors per slice
  └── Other types → Multiple datasets with one color each
  ↓
Create Chart.js instance
  ↓
Apply chart type
  ├── bar → Vertical bars
  ├── line → Line with points
  ├── pie → Circular sectors
  ├── doughnut → Ring chart
  └── radar → Multi-axis polygon
  ↓
Render to canvas
  ↓
Add interactivity
  ├── Hover tooltips
  ├── Legend clicks
  └── Responsive resize
  ↓
Display to user
```

## Error Handling Flow

```
Any Error Occurs
  ↓
Is it AI Service?
  ├── YES → Log error → Use mock data
  │         └→ Continue processing
  └── NO ↓
Is it Fabric Service?
  ├── YES → Log error → Use mock data
  │         └→ Continue processing
  └── NO ↓
Is it API Route?
  ├── YES → Return 500 error
  │         └→ Show error message to user
  └── NO ↓
Is it Frontend?
  └── YES → Show error status
            └→ Enable retry
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Environment Variables (.env)                                │
│     - Not in version control                                    │
│     - Loaded at server startup                                  │
│     - Never exposed to frontend                                 │
│                                                                  │
│  2. CORS Configuration                                          │
│     - Controls allowed origins                                  │
│     - Prevents unauthorized access                              │
│                                                                  │
│  3. Azure AD Authentication                                     │
│     - Client credentials flow                                   │
│     - Token-based access                                        │
│     - Automatic token refresh                                   │
│                                                                  │
│  4. Input Validation                                            │
│     - Query parameter checking                                  │
│     - SQL injection prevention (via AI)                         │
│     - Type validation                                           │
│                                                                  │
│  5. Error Handling                                              │
│     - Never expose stack traces in production                   │
│     - Generic error messages to users                           │
│     - Detailed logs for debugging                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

This architecture provides:
- ✅ Separation of concerns
- ✅ Scalability
- ✅ Maintainability  
- ✅ Security
- ✅ Graceful fallbacks
- ✅ User-friendly experience
