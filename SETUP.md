# Custom Power BI Embed - Setup Guide

## Overview
This application provides an AI-powered interface for natural language data queries. It integrates:
- **Frontend**: HTML/CSS/JavaScript with Chart.js for visualizations
- **Backend**: Node.js/Express server
- **AI**: Azure AI Foundry for query parsing
- **Data**: Microsoft Fabric for data retrieval

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit the `.env` file with your credentials:

#### Azure AI Foundry Setup:
1. Go to [Azure AI Foundry](https://ai.azure.com/)
2. Create or select a project
3. Deploy a GPT-4 or GPT-3.5-turbo model
4. Copy the endpoint URL and API key
5. Add to `.env`:
   ```
   AI_FOUNDRY_ENDPOINT=https://your-project.openai.azure.com
   AI_FOUNDRY_API_KEY=your-api-key
   AI_FOUNDRY_DEPLOYMENT_NAME=gpt-4
   ```

#### Microsoft Fabric Setup:
1. Go to [Microsoft Fabric](https://app.fabric.microsoft.com/)
2. Create or select a workspace
3. Note your Workspace ID and Dataset ID
4. Create an Azure AD app registration for authentication
5. Grant the app access to your Fabric workspace
6. Add to `.env`:
   ```
   FABRIC_WORKSPACE_ID=your-workspace-id
   FABRIC_DATASET_ID=your-dataset-id
   FABRIC_TENANT_ID=your-tenant-id
   FABRIC_CLIENT_ID=your-client-id
   FABRIC_CLIENT_SECRET=your-client-secret
   ```

### 3. Start the Server
```bash
npm start
```

### 4. Access the Application
Open your browser to: `http://localhost:3000`

## Features

### Natural Language Queries
Users can type queries like:
- "Show me sales by region for the last quarter"
- "Top 10 products by revenue"
- "Monthly sales trend for 2024"
- "Customer distribution by region"

### AI-Powered Processing
1. User enters a natural language query
2. AI Foundry parses the query and generates SQL
3. SQL is executed against Microsoft Fabric
4. Results are returned and visualized

### Dynamic Visualizations
- Multiple chart types: Bar, Line, Pie, Doughnut, Radar
- Interactive charts with tooltips
- Data preview table
- CSV export functionality

### Mock Data Mode
The application includes mock data for testing without configuring AI Foundry or Fabric:
- Simply run the app without setting environment variables
- Mock responses will be used for demonstration

## Embedding in Intranet

To embed this application in an intranet page:

```html
<iframe 
    src="http://your-server:3000" 
    width="100%" 
    height="800px" 
    frameborder="0"
    style="border: 1px solid #ccc; border-radius: 8px;">
</iframe>
```

### Customization for Embedding
Edit `public/styles.css` to match your intranet theme:
- Change color scheme in `:root` variables
- Adjust spacing for tighter integration
- Modify header visibility if needed

## Project Structure

```
CustomPowerBIEmbed/
├── public/              # Frontend files
│   ├── index.html      # Main UI
│   ├── styles.css      # Styling
│   └── app.js          # Client-side logic
├── routes/             # API routes
│   └── query.js        # Query processing endpoint
├── services/           # Backend services
│   ├── aiService.js    # AI Foundry integration
│   └── fabricService.js # Microsoft Fabric integration
├── server.js           # Express server
├── package.json        # Dependencies
├── .env               # Environment variables
└── README.md          # This file
```

## API Endpoints

### POST `/api/query`
Process a natural language query

**Request:**
```json
{
  "query": "Show me sales by region"
}
```

**Response:**
```json
{
  "originalQuery": "Show me sales by region",
  "sqlQuery": "SELECT region, SUM(revenue) as total_revenue FROM sales GROUP BY region",
  "interpretation": "Sales performance across different regions",
  "suggestedChartType": "bar",
  "title": "Sales by Region",
  "data": [
    {"region": "North America", "total_revenue": 1250000},
    {"region": "Europe", "total_revenue": 980000}
  ]
}
```

### GET `/api/health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-25T20:30:00.000Z"
}
```

## Development

### Run in Development Mode
```bash
npm run dev
```
Uses `nodemon` for auto-reload on file changes.

### Extending the Application

#### Add New Data Sources
Edit `services/fabricService.js` to add more mock data patterns or connect to additional databases.

#### Customize AI Prompts
Edit `services/aiService.js` to modify how queries are parsed and interpreted.

#### Add New Chart Types
Edit `public/app.js` to add more Chart.js visualization options.

#### Modify UI/UX
Edit `public/index.html` and `public/styles.css` to customize the interface.

## Troubleshooting

### AI Foundry Connection Issues
- Verify endpoint URL format: `https://your-project.openai.azure.com`
- Check API key is valid and not expired
- Ensure deployment name matches your model deployment

### Fabric Connection Issues
- Verify workspace and dataset IDs are correct
- Check Azure AD app has proper permissions
- Ensure client secret is valid

### Application Not Loading
- Check that port 3000 is not in use
- Verify all dependencies are installed: `npm install`
- Check console for error messages

### No Data Returned
- Application will use mock data if credentials aren't configured
- Check `.env` file is properly formatted
- Verify Fabric dataset has accessible data

## Security Notes

- Never commit `.env` file to version control
- Use environment-specific configurations for production
- Implement authentication for production deployments
- Consider rate limiting for API endpoints
- Use HTTPS in production environments

## Future Enhancements

- User authentication and authorization
- Query history and favorites
- More visualization types (maps, gauges, etc.)
- Real-time data updates
- Export to PDF/PowerPoint
- Advanced filtering and drill-down
- Multi-language support
- Mobile-responsive improvements

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Azure AI Foundry documentation
3. Review Microsoft Fabric documentation
4. Check application logs in the terminal
