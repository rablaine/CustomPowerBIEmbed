# DAX Query Mode - Updated!

The application has been updated to use **DAX queries** instead of SQL queries for querying Microsoft Fabric Power BI semantic models via the XMLA endpoint.

## What Changed

### 1. AI Prompts
- **Before**: Generated SQL queries
- **After**: Generates DAX queries using EVALUATE and SUMMARIZECOLUMNS

### 2. Query Format
- Uses DAX syntax: `EVALUATE SUMMARIZECOLUMNS(...)`
- References measures: `[Total Sales]`
- References columns: `'Table'[Column]`

### 3. Schema Discovery
- Attempts to use DMV (Dynamic Management Views) for model metadata
- Falls back to INFORMATION_SCHEMA if DMV not available
- Formats schema description for DAX usage

## Benefits of DAX

✅ **Works with semantic models** - Uses your Power BI model directly
✅ **Pre-built measures** - Can reference existing measures and calculations
✅ **Time intelligence** - Built-in DAX time functions
✅ **Relationships** - Automatically follows model relationships
✅ **Row-level security** - Respects RLS defined in the model
✅ **Better aggregations** - DAX is optimized for analytics

## Example Queries

### Sales by Region
**User asks**: "Show me sales by region"

**DAX Generated**:
```dax
EVALUATE
SUMMARIZECOLUMNS(
    'Geography'[Region],
    "Total Sales", [Total Sales]
)
```

### Top 10 Products
**User asks**: "Top 10 products by revenue"

**DAX Generated**:
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

### Monthly Trend
**User asks**: "Monthly sales trend for 2024"

**DAX Generated**:
```dax
EVALUATE
SUMMARIZECOLUMNS(
    'Date'[Month Name],
    "Sales", [Total Sales],
    "Target", [Sales Target]
)
```

## XMLA Endpoint

The application queries your Fabric dataset using the Power BI REST API which supports DAX queries:

```
POST https://api.powerbi.com/v1.0/myorg/datasets/{datasetId}/executeQueries
{
  "queries": [{
    "query": "EVALUATE SUMMARIZECOLUMNS(...)"
  }]
}
```

## Configuration

Your `.env` file settings remain the same:
- `FABRIC_WORKSPACE_ID` - Your Fabric/Power BI workspace
- `FABRIC_DATASET_ID` - Your semantic model (dataset) ID
- Authentication credentials

## Testing

1. **Restart the server**: `npm start`
2. **Try a query**: "Show me total sales by region"
3. **Check Query Details**: You'll see the generated DAX in the UI
4. **Mock data**: Will return sample data if Fabric not configured

## Customizing for Your Model

To make the AI generate better DAX for YOUR specific model:

1. **Update the default schema** in `aiService.js`:
   - Add your actual table names
   - List your measures: `[Your Measure Name]`
   - List your columns: `'YourTable'[Column Name]`

2. **Add example DAX queries** that work with your model

3. **Test and iterate** - Check the generated DAX in the UI

## Schema Discovery

The app now tries to discover your model structure automatically using:

```dax
EVALUATE
SELECTCOLUMNS(
    FILTER(INFO.TABLES(), [TABLE_TYPE] <> "SYSTEM"),
    "Table", [TABLE_NAME],
    "Type", [TABLE_TYPE]
)
```

If that fails, it falls back to SQL INFORMATION_SCHEMA.

## Mock Data Mode

When Fabric credentials aren't configured, the app generates realistic DAX queries and returns mock data. This lets you:
- Test the UI
- See example DAX syntax
- Understand the flow
- Demo the application

## Need to Switch Back to SQL?

If you need SQL queries instead (for data warehouses, lakehouses, or SQL endpoints), the changes can be easily reverted. Let me know!
