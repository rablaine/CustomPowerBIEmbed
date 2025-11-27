/**
 * EXAMPLE: How to update the AI service with your actual database schema
 * 
 * Replace the buildQueryParsePrompt method in services/aiService.js with this structure
 */

// BEFORE (Generic - Current)
buildQueryParsePrompt(userQuery) {
    return `Convert this natural language query into a SQL query for Microsoft Fabric:

User Query: "${userQuery}"

Database Schema Context:
- Assume tables exist for sales, products, customers, regions, and dates
- Common columns: date, region, product_name, category, revenue, quantity, customer_id
- Use appropriate aggregations and filters

Return only the SQL query without markdown formatting or explanations.`;
}

// AFTER (Your Specific Schema - Example)
buildQueryParsePrompt(userQuery) {
    return `Convert this natural language query into a SQL query for Microsoft Fabric:

User Query: "${userQuery}"

ACTUAL DATABASE SCHEMA:

TABLE: SalesTransactions
Columns:
- TransactionID (int) - Primary Key
- TransactionDate (datetime)
- CustomerID (int) - Foreign Key to Customers
- ProductID (int) - Foreign Key to Products  
- Quantity (int)
- UnitPrice (decimal)
- TotalAmount (decimal)
- Region (varchar) - Values: North, South, East, West
- SalesRepID (int) - Foreign Key to Employees

TABLE: Products
Columns:
- ProductID (int) - Primary Key
- ProductName (varchar)
- Category (varchar) - Values: Electronics, Clothing, Home, Sports
- Brand (varchar)
- UnitCost (decimal)
- CurrentStock (int)

TABLE: Customers
Columns:
- CustomerID (int) - Primary Key
- CustomerName (varchar)
- Email (varchar)
- Segment (varchar) - Values: Enterprise, SMB, Individual
- Region (varchar)
- RegistrationDate (datetime)
- LTV (decimal) - Lifetime Value

TABLE: Employees
Columns:
- EmployeeID (int) - Primary Key
- EmployeeName (varchar)
- Department (varchar)
- Region (varchar)
- HireDate (datetime)

TABLE: DateDimension
Columns:
- Date (datetime) - Primary Key
- Year (int)
- Quarter (int)
- Month (int)
- MonthName (varchar)
- Week (int)
- DayOfWeek (varchar)

EXAMPLE QUERIES FOR REFERENCE:

1. Total sales by region:
   SELECT Region, SUM(TotalAmount) as Total_Revenue 
   FROM SalesTransactions 
   GROUP BY Region 
   ORDER BY Total_Revenue DESC

2. Top 10 products by revenue:
   SELECT p.ProductName, SUM(s.TotalAmount) as Revenue
   FROM SalesTransactions s
   JOIN Products p ON s.ProductID = p.ProductID
   GROUP BY p.ProductName
   ORDER BY Revenue DESC
   LIMIT 10

3. Monthly sales trend for current year:
   SELECT d.MonthName, SUM(s.TotalAmount) as Revenue
   FROM SalesTransactions s
   JOIN DateDimension d ON CAST(s.TransactionDate as DATE) = d.Date
   WHERE d.Year = YEAR(GETDATE())
   GROUP BY d.MonthName, d.Month
   ORDER BY d.Month

4. Customer segment distribution:
   SELECT Segment, COUNT(*) as Count, SUM(LTV) as Total_Value
   FROM Customers
   GROUP BY Segment
   ORDER BY Total_Value DESC

IMPORTANT QUERY RULES:
- Always join SalesTransactions with DateDimension for date-based queries
- Use SUM(TotalAmount) for revenue calculations, not UnitPrice
- When comparing time periods, use DateDimension.Year, Quarter, or Month
- For "top N" queries, use ORDER BY ... DESC LIMIT N
- For percentages or ratios, calculate in the query
- Region values are case-sensitive: North, South, East, West

Return only the SQL query without markdown formatting, explanations, or comments.`;
}

/**
 * HOW TO GET YOUR SCHEMA:
 * 
 * Option 1: Query Fabric Metadata
 * Run this in your Fabric SQL endpoint:
 * 
 * SELECT 
 *   TABLE_NAME, 
 *   COLUMN_NAME, 
 *   DATA_TYPE 
 * FROM INFORMATION_SCHEMA.COLUMNS 
 * WHERE TABLE_SCHEMA = 'dbo'
 * ORDER BY TABLE_NAME, ORDINAL_POSITION;
 * 
 * Option 2: Power BI Desktop
 * - Open your dataset in Power BI Desktop
 * - Go to Model view
 * - Document the tables and columns you see
 * 
 * Option 3: Fabric Portal
 * - Open your Lakehouse/Warehouse
 * - View the schema in the Explorer panel
 * - Copy table and column names
 */

/**
 * TESTING YOUR SCHEMA:
 * 
 * 1. Update buildQueryParsePrompt with your schema
 * 2. Restart server: npm start
 * 3. Try a query: "Show me total sales by region"
 * 4. Check the "Query Details" section to see generated SQL
 * 5. If SQL is wrong, add more details to schema or examples
 */

/**
 * ADVANCED: Load Schema from Database
 */
async function loadSchemaFromFabric() {
    const schemaQuery = `
        SELECT 
            t.TABLE_NAME,
            c.COLUMN_NAME,
            c.DATA_TYPE
        FROM INFORMATION_SCHEMA.TABLES t
        JOIN INFORMATION_SCHEMA.COLUMNS c 
            ON t.TABLE_NAME = c.TABLE_NAME
        WHERE t.TABLE_SCHEMA = 'dbo'
        ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    `;
    
    // Execute query and format as schema description
    const results = await fabricService.executeQuery(schemaQuery);
    return formatSchemaFromResults(results);
}

function formatSchemaFromResults(results) {
    const tables = {};
    
    results.forEach(row => {
        if (!tables[row.TABLE_NAME]) {
            tables[row.TABLE_NAME] = [];
        }
        tables[row.TABLE_NAME].push(`- ${row.COLUMN_NAME} (${row.DATA_TYPE})`);
    });
    
    let schemaText = '';
    for (const [tableName, columns] of Object.entries(tables)) {
        schemaText += `\nTABLE: ${tableName}\nColumns:\n${columns.join('\n')}\n`;
    }
    
    return schemaText;
}
