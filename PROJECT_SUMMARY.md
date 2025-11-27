# Project Summary: AI-Powered Data Visualization App

## What We Built

An embeddable web application that allows users to query data using natural language, with AI-powered parsing and dynamic visualization generation.

## Architecture Flow

```
User Input (Natural Language)
    ↓
Frontend (HTML/CSS/JS)
    ↓
Express API Server
    ↓
AI Foundry (Parse Query → Generate SQL)
    ↓
Microsoft Fabric (Execute Query → Return Data)
    ↓
AI Foundry (Interpret Results → Suggest Chart)
    ↓
Frontend (Render Visualization with Chart.js)
```

## Project Structure

```
CustomPowerBIEmbed/
│
├── public/                      # Frontend
│   ├── index.html              # Main user interface
│   ├── styles.css              # Professional styling
│   └── app.js                  # Client-side JavaScript
│
├── routes/                     # API Routes
│   └── query.js                # Query processing endpoint
│
├── services/                   # Backend Services
│   ├── aiService.js            # Azure AI Foundry integration
│   └── fabricService.js        # Microsoft Fabric integration
│
├── server.js                   # Express server
├── package.json                # Dependencies
├── .env                        # Configuration (not in git)
├── .env.example                # Configuration template
├── test-api.js                 # API testing script
├── example-embed.html          # Embedding example
├── README.md                   # Basic documentation
└── SETUP.md                    # Detailed setup guide
```

## Key Features

### 1. Natural Language Interface
- Users type queries in plain English
- Suggestion chips for common queries
- Real-time processing feedback

### 2. AI-Powered Processing
- **Query Parsing**: Converts natural language to SQL
- **Result Interpretation**: Analyzes data and suggests best visualization
- **Smart Defaults**: Falls back to mock data when AI not configured

### 3. Dynamic Visualizations
- **5 Chart Types**: Bar, Line, Pie, Doughnut, Radar
- **Interactive**: Hover tooltips, responsive design
- **Switchable**: Change chart type on the fly
- **Data Preview**: Tabular view of raw data

### 4. Export Capabilities
- Download data as CSV
- Formatted with proper escaping
- Timestamp-based filenames

### 5. Embeddable Design
- Clean, professional UI
- Responsive layout
- iframe-ready
- Customizable styling

## Technologies Used

### Frontend
- **HTML5**: Semantic structure
- **CSS3**: Modern styling with variables
- **Vanilla JavaScript**: No framework dependencies
- **Chart.js**: Professional charts

### Backend
- **Node.js**: Runtime environment
- **Express**: Web server framework
- **Axios**: HTTP client for API calls
- **dotenv**: Environment configuration

### Cloud Services
- **Azure AI Foundry**: GPT models for NLP
- **Microsoft Fabric**: Data warehouse queries
- **Azure Identity**: Authentication

## Current Status

### ✅ Completed
- [x] Full-stack application structure
- [x] Frontend UI with all components
- [x] Backend API server
- [x] AI service integration (with mock fallback)
- [x] Fabric service integration (with mock fallback)
- [x] Chart rendering with multiple types
- [x] Data export functionality
- [x] Configuration templates
- [x] Documentation
- [x] Example embedding page

### 🔄 Mock Data Mode
The application is currently running with mock data because:
- No Azure AI Foundry credentials configured
- No Microsoft Fabric credentials configured
- This allows testing and development without cloud resources

### 📝 To Connect to Real Data
1. Set up Azure AI Foundry project
2. Deploy a GPT model
3. Configure Fabric workspace
4. Update `.env` file with credentials
5. Restart the server

## How to Use

### For Development
```bash
# Install dependencies
npm install

# Start the server
npm start

# Access the app
http://localhost:3000
```

### For Embedding
```html
<iframe 
    src="http://your-server:3000" 
    width="100%" 
    height="900px">
</iframe>
```

### Example Queries (Mock Data)
- "Show me sales by region"
- "Top 10 products by revenue"
- "Monthly sales trend for 2024"
- "Customer distribution by segment"

## Mock Data Scenarios

The application includes intelligent mock data for testing:

1. **Sales by Region**: Returns 5 regions with revenue data
2. **Product Performance**: Returns 8 products with quantities
3. **Monthly Trends**: Returns 10 months with revenue vs. target
4. **Customer Distribution**: Returns 4 segments with counts and revenue
5. **Generic Data**: Default categorical data for other queries

## Code Highlights

### Smart AI Fallback
```javascript
// aiService.js automatically uses mock responses when credentials missing
if (!this.endpoint || !this.apiKey) {
    return this.mockParseQuery(userQuery);
}
```

### Flexible Fabric Queries
```javascript
// fabricService.js provides rich mock data patterns
mockExecuteQuery(sqlQuery) {
    const lowerQuery = sqlQuery.toLowerCase();
    if (lowerQuery.includes('region') && lowerQuery.includes('revenue')) {
        return [...]; // Sales by region
    }
    // ... more patterns
}
```

### Dynamic Chart Rendering
```javascript
// app.js supports 5 chart types with automatic data formatting
renderChart(data, type) {
    const chartData = prepareChartData(data.data, type);
    new Chart(ctx, { type, data: chartData, options: {...} });
}
```

## Next Steps / Enhancements

### Priority
1. Configure Azure AI Foundry credentials
2. Set up Microsoft Fabric workspace
3. Test with real data
4. Deploy to production server

### Future Features
- User authentication
- Query history
- Saved favorites
- More chart types (maps, gauges)
- Real-time updates
- PDF/PowerPoint export
- Mobile app
- Multi-language support

## Configuration Required

### Azure AI Foundry
- Endpoint URL
- API Key
- Deployment Name (model)

### Microsoft Fabric
- Workspace ID
- Dataset ID
- Azure AD App:
  - Tenant ID
  - Client ID
  - Client Secret

### Server
- Port (default: 3000)
- Environment (dev/prod)

## Security Considerations

- ✅ `.env` excluded from git
- ✅ CORS enabled for development
- ⚠️ Add authentication for production
- ⚠️ Implement rate limiting
- ⚠️ Use HTTPS in production
- ⚠️ Validate/sanitize all inputs

## Files Overview

| File | Purpose |
|------|---------|
| `server.js` | Express server setup, middleware |
| `routes/query.js` | API endpoint for query processing |
| `services/aiService.js` | AI Foundry integration + mock data |
| `services/fabricService.js` | Fabric integration + mock data |
| `public/index.html` | Main UI structure |
| `public/styles.css` | Professional styling |
| `public/app.js` | Frontend logic + Chart.js |
| `.env` | Configuration (secrets) |
| `test-api.js` | API testing script |
| `example-embed.html` | Embedding demonstration |
| `SETUP.md` | Detailed setup instructions |

## Testing

The application is fully testable in mock mode:
1. Start server: `npm start`
2. Open browser: `http://localhost:3000`
3. Try sample queries
4. See mock data visualized
5. Test different chart types
6. Download CSV exports

## Support & Documentation

- **README.md**: Quick start guide
- **SETUP.md**: Detailed setup with Azure config
- **example-embed.html**: Live embedding example
- **Comments**: Extensive inline documentation

## Success Metrics

✅ Server starts without errors
✅ UI loads correctly
✅ Mock queries return data
✅ Charts render properly
✅ CSV export works
✅ Responsive on different screens
✅ Embeddable in iframe
✅ Professional appearance

## Deployment Ready

The application is production-ready once you:
1. Add real credentials
2. Set NODE_ENV=production
3. Deploy to cloud (Azure, AWS, etc.)
4. Configure domain/SSL
5. Add authentication
6. Set up monitoring

---

**Status**: ✅ Fully Functional (Mock Mode)
**Next**: Configure Azure credentials for production data
**Deployment**: Ready for cloud deployment
