# Database Schema Configuration

This file contains your actual database schema that the AI uses to generate SQL queries.

## How to Configure Your Schema

Edit `services/aiService.js` and update the `buildQueryParsePrompt()` method with your actual:
- Table names
- Column names and types
- Relationships
- Common queries

## Example Schema Format

```javascript
buildQueryParsePrompt(userQuery) {
    return `Convert this natural language query into a SQL query for Microsoft Fabric:

User Query: "${userQuery}"

Database Schema Context:

TABLE: Sales
- SaleID (int, primary key)
- Date (datetime)
- ProductID (int, foreign key)
- CustomerID (int, foreign key)
- Quantity (int)
- Revenue (decimal)
- Region (varchar)

TABLE: Products
- ProductID (int, primary key)
- ProductName (varchar)
- Category (varchar)
- Price (decimal)
- StockQuantity (int)

TABLE: Customers
- CustomerID (int, primary key)
- CustomerName (varchar)
- Segment (varchar: Enterprise, Mid-Market, Small Business)
- Region (varchar)
- JoinDate (datetime)

TABLE: Dates
- Date (datetime, primary key)
- Year (int)
- Quarter (int)
- Month (int)
- MonthName (varchar)

Common Queries:
- Revenue by region: SELECT Region, SUM(Revenue) FROM Sales GROUP BY Region
- Top products: SELECT p.ProductName, SUM(s.Revenue) FROM Sales s JOIN Products p ON s.ProductID = p.ProductID GROUP BY p.ProductName
- Monthly trends: SELECT d.MonthName, SUM(s.Revenue) FROM Sales s JOIN Dates d ON s.Date = d.Date GROUP BY d.MonthName

Important Notes:
- Always use proper JOINs when accessing multiple tables
- Use aggregate functions (SUM, COUNT, AVG) appropriately
- Include ORDER BY and LIMIT for top/bottom queries
- Date columns should use DATE functions for filtering

Return only the SQL query without markdown formatting or explanations.`;
}
```

## Current Generic Schema (Default)

The current schema is generic and assumes:
```
Tables: sales, products, customers, regions, dates
Columns: date, region, product_name, category, revenue, quantity, customer_id
```

## Steps to Update

1. **Identify your tables and columns** in Microsoft Fabric
2. **Document the schema** (table names, column names, data types)
3. **Update `buildQueryParsePrompt()`** in `services/aiService.js`
4. **Add example queries** that work with your data
5. **Test with real queries**

## Advanced: Dynamic Schema Loading

For production, you could:

1. **Query the database metadata** to get schema automatically
2. **Store schema in a config file** that's loaded at startup
3. **Use environment variables** for table/column names
4. **Create a schema builder** that generates the prompt dynamically

### Example: Schema from Config File

Create `config/schema.json`:
```json
{
  "tables": {
    "Sales": {
      "columns": ["SaleID", "Date", "ProductID", "Revenue", "Quantity"],
      "relationships": {
        "Products": "ProductID",
        "Customers": "CustomerID"
      }
    },
    "Products": {
      "columns": ["ProductID", "ProductName", "Category", "Price"]
    }
  }
}
```

Then load it in your AI service:
```javascript
const schema = require('../config/schema.json');

buildQueryParsePrompt(userQuery) {
    const schemaDescription = this.formatSchemaForPrompt(schema);
    return `Convert this query into SQL: "${userQuery}"\n\n${schemaDescription}`;
}
```

## How the Visualization Works

### Step 1: Data Structure
Any query that returns this format will work:
```javascript
[
  { labelColumn: "Value1", dataColumn1: 100, dataColumn2: 200 },
  { labelColumn: "Value2", dataColumn1: 150, dataColumn2: 180 }
]
```

### Step 2: Chart Logic
- **First column** → X-axis labels or pie slice labels
- **Other columns** → Data series (Y-axis values)

### Step 3: Chart Type Selection
The AI suggests based on data:
- **Time series?** → Line chart
- **Categories (< 7)?** → Pie chart
- **Comparisons?** → Bar chart
- **Multiple metrics?** → Radar or multi-series bar

### Example Data Transformations

**Sales by Region:**
```sql
SELECT Region, SUM(Revenue) as Total_Revenue FROM Sales GROUP BY Region
```
Returns:
```javascript
[{Region: "North", Total_Revenue: 1000}, {Region: "South", Total_Revenue: 800}]
```
Chart: X-axis = Region, Y-axis = Total_Revenue

**Monthly Trend (2 metrics):**
```sql
SELECT Month, SUM(Revenue) as Revenue, SUM(Quantity) as Units FROM Sales GROUP BY Month
```
Returns:
```javascript
[{Month: "Jan", Revenue: 1000, Units: 50}, {Month: "Feb", Revenue: 1200, Units: 60}]
```
Chart: X-axis = Month, Two Y-series = Revenue & Units

## Testing Your Schema

1. Update the schema prompt
2. Restart the server
3. Try queries specific to your data
4. Check the "Query Details" section to see the generated SQL
5. Verify the data structure matches what your database returns

## Troubleshooting

**Problem:** AI generates invalid SQL
- **Fix:** Add more specific column types and examples to the schema prompt

**Problem:** Chart looks wrong
- **Fix:** Check data structure - first column should be labels, rest should be numbers

**Problem:** No data returned
- **Fix:** Test the generated SQL directly in Fabric to verify it works

**Problem:** AI doesn't understand your domain
- **Fix:** Add domain-specific examples and terminology to the prompt
