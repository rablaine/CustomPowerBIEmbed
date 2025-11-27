# Quick Start Guide

## ⚡ Start the Application

```bash
npm install
npm start
```

Then open: **http://localhost:3000**

---

## 🎯 Try These Queries

- "Show me sales by region"
- "Top 10 products by revenue"  
- "Monthly sales trend for 2024"
- "Customer distribution by segment"

---

## 📦 What's Working Now

✅ Full web interface with professional UI
✅ Natural language query input
✅ AI-powered query parsing (with mock fallback)
✅ Data retrieval from Fabric (with mock data)
✅ 5 chart types: Bar, Line, Pie, Doughnut, Radar
✅ Interactive visualizations
✅ CSV export
✅ Embeddable in iframe
✅ Responsive design

---

## 🔧 Configure for Real Data

1. **Get Azure AI Foundry credentials:**
   - Create project at https://ai.azure.com
   - Deploy GPT-4 model
   - Copy endpoint and API key

2. **Get Microsoft Fabric access:**
   - Open https://app.fabric.microsoft.com
   - Get Workspace ID and Dataset ID
   - Create Azure AD app registration
   - Grant permissions

3. **Update `.env` file:**
   ```env
   AI_FOUNDRY_ENDPOINT=https://your-project.openai.azure.com
   AI_FOUNDRY_API_KEY=your-key
   AI_FOUNDRY_DEPLOYMENT_NAME=gpt-4
   
   FABRIC_WORKSPACE_ID=your-workspace-id
   FABRIC_DATASET_ID=your-dataset-id
   FABRIC_TENANT_ID=your-tenant-id
   FABRIC_CLIENT_ID=your-client-id
   FABRIC_CLIENT_SECRET=your-client-secret
   ```

4. **Restart the server**

---

## 🌐 Embed in Your Intranet

```html
<iframe 
    src="http://your-server:3000" 
    width="100%" 
    height="900px"
    frameborder="0">
</iframe>
```

See `example-embed.html` for a complete example.

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server.js` | Main server |
| `public/index.html` | UI |
| `public/app.js` | Frontend logic |
| `services/aiService.js` | AI integration |
| `services/fabricService.js` | Data queries |
| `.env` | Configuration |

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start server (production)
npm start

# Start with auto-reload (dev)
npm run dev

# Test API
node test-api.js
```

---

## 📊 Chart Types Available

1. **Bar** - Compare categories
2. **Line** - Show trends over time
3. **Pie** - Show proportions
4. **Doughnut** - Modern proportions
5. **Radar** - Multi-dimensional comparison

Switch types using the dropdown in results.

---

## 🎨 Customization

### Change Colors
Edit `public/styles.css` → `:root` variables

### Modify UI
Edit `public/index.html` and `public/styles.css`

### Add Data Patterns
Edit `services/fabricService.js` → `mockExecuteQuery()`

### Customize AI Prompts
Edit `services/aiService.js` → prompt builders

---

## ❓ Troubleshooting

**Server won't start:**
- Check port 3000 is free
- Run `npm install` first

**No visualizations:**
- Server must be running
- Check browser console for errors

**Need real data:**
- Configure `.env` with Azure credentials
- See SETUP.md for detailed steps

---

## 📚 Documentation

- `README.md` - Basic overview
- `SETUP.md` - Detailed setup guide
- `PROJECT_SUMMARY.md` - Complete project info
- `example-embed.html` - Live embedding example

---

## 🚀 Current Status

**Mode:** Demo with Mock Data
**Server:** Running at http://localhost:3000
**Features:** 100% functional
**Next Step:** Add Azure credentials for real data

---

## 💡 Tips

1. Try all the suggestion chips
2. Switch between chart types
3. Download data as CSV
4. View the data table preview
5. Check `example-embed.html` for embedding demo

---

**Happy Analyzing! 📈**
