# Sample Data Generation Scripts

This folder contains scripts to help you create sample data for the AI-Powered Data Visualization solution.

## Files

### `generate-sample-data.py`
Python script that generates realistic retail sample data for Microsoft Fabric.

**What it creates:**
- **Products table**: 1,000 products across 5 categories (Electronics, Clothing, Home & Garden, Sports, Books)
- **Customers table**: 500 customers distributed across 5 regions
- **Sales table**: 50,000 transaction records spanning 2022-2025
- **Date table**: Complete date dimension with attributes for time intelligence

**Features:**
- Realistic product names, brands, and pricing
- Seasonal sales patterns (holiday boost, back-to-school, etc.)
- Varied customer segments (Consumer, Small Business, Enterprise)
- Geographic distribution across US regions
- Configurable record counts

## Usage Instructions

### Step 1: Create a Fabric Lakehouse

1. Navigate to your Microsoft Fabric workspace
2. Click **+ New** → **Lakehouse**
3. Name it `ContosoRetail` (or your preferred name)
4. Click **Create**

### Step 2: Create a Notebook

1. In the Lakehouse, click **Open notebook** → **New notebook**
2. The notebook will automatically be attached to your Lakehouse

### Step 3: Run the Script

**Option A: Copy and paste the entire script**
1. Open `generate-sample-data.py` from this repository
2. Copy all contents
3. Paste into a code cell in your Fabric notebook
4. Click **Run cell** or press **Shift+Enter**

**Option B: Upload and import**
1. In Fabric notebook, click **Add** → **Code cell**
2. Paste this code:
```python
# Upload the script file to notebook, then import it
%run /path/to/generate-sample-data.py
```

### Step 4: Monitor Progress

The script will display progress messages:
```
==========================================
Contoso Retail Sample Data Generator
==========================================

Configuration:
  Products: 1,000
  Customers: 500
  Sales Transactions: 50,000
  Date Range: 2022-01-01 to 2025-11-26

Generating Products table...
  ✓ Generated 1,000 products across 5 categories
Generating Customers table...
  ✓ Generated 500 customers across 5 regions
Generating Sales table...
    Progress: 10,000 / 50,000 transactions...
    Progress: 20,000 / 50,000 transactions...
    Progress: 30,000 / 50,000 transactions...
    Progress: 40,000 / 50,000 transactions...
    Progress: 50,000 / 50,000 transactions...
  ✓ Generated 50,000 sales transactions
    Total Revenue: $15,234,567.89
    Average Order Value: $304.69
Generating Date table...
  ✓ Generated 1,461 date records

==========================================
Saving tables to Fabric Lakehouse...
==========================================

Products table...
  ✓ Products table saved
Customers table...
  ✓ Customers table saved
Sales table...
  ✓ Sales table saved
Date table...
  ✓ Date table saved

SUCCESS! All tables created successfully
```

Execution time: Approximately 2-3 minutes depending on Fabric capacity.

### Step 5: Verify Tables

1. In the Lakehouse explorer (left sidebar), expand **Tables**
2. You should see four new tables:
   - `Products`
   - `Customers`
   - `Sales`
   - `Date`
3. Click on any table to preview the data

### Step 6: Create Semantic Model

1. In your Lakehouse, click the **...** menu → **New semantic model**
2. Select all four tables:
   - ☑ Products
   - ☑ Customers
   - ☑ Sales
   - ☑ Date
3. Name it `ContosoRetailModel`
4. Click **Confirm**

### Step 7: Define Relationships

1. Open the semantic model in Model view
2. Create these relationships (drag from one table to another):

   **Sales → Products**
   - From: `Sales[ProductID]`
   - To: `Products[ProductID]`
   - Cardinality: Many to One (*)
   - Cross filter direction: Single

   **Sales → Customers**
   - From: `Sales[CustomerID]`
   - To: `Customers[CustomerID]`
   - Cardinality: Many to One (*)
   - Cross filter direction: Single

   **Sales → Date**
   - From: `Sales[OrderDate]`
   - To: `Date[Date]`
   - Cardinality: Many to One (*)
   - Cross filter direction: Single
   - Mark as date table: Yes (on Date table)

3. Click **Save**

### Step 8: Create Measures

1. In the semantic model, select the **Sales** table
2. Click **New measure** and add these DAX measures:

```dax
Total Sales = SUM(Sales[SalesAmount])
```

```dax
Total Quantity = SUM(Sales[Quantity])
```

```dax
Total Orders = COUNTROWS(Sales)
```

```dax
Average Order Value = DIVIDE([Total Sales], [Total Orders], 0)
```

```dax
Unique Customers = DISTINCTCOUNT(Sales[CustomerID])
```

```dax
Sales Growth YoY = 
VAR CurrentYearSales = [Total Sales]
VAR LastYearSales = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))
RETURN
    DIVIDE(CurrentYearSales - LastYearSales, LastYearSales, 0)
```

3. Click **Save**

### Step 9: Get Credentials for Application

1. **Get Workspace ID**:
   - In Fabric, look at the URL: `https://app.fabric.microsoft.com/groups/{WORKSPACE_ID}/...`
   - Copy the GUID between `groups/` and the next `/`

2. **Get Dataset ID**:
   - Open your semantic model
   - Look at URL: `https://app.fabric.microsoft.com/groups/{WORKSPACE_ID}/datasets/{DATASET_ID}/...`
   - Copy the GUID after `datasets/`

3. **Create Azure AD App Registration**:
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Click **New registration**
   - Name: `PowerBIEmbedApp` (or your choice)
   - Click **Register**
   - Copy **Application (client) ID**
   - Copy **Directory (tenant) ID**
   - Go to **Certificates & secrets** → **New client secret**
   - Copy the secret **value** (not ID)

4. **Grant API Permissions**:
   - In app registration, go to **API permissions**
   - Click **Add a permission** → **Power BI Service**
   - Select **Delegated permissions** → **Dataset.Read.All**
   - Click **Add permissions**
   - Click **Grant admin consent**

5. **Grant Workspace Access**:
   - In Fabric workspace, click **Manage access**
   - Click **Add people or groups**
   - Search for your app registration name
   - Assign role: **Contributor** or **Admin**
   - Click **Add**

### Step 10: Update Application Configuration

Edit `.env` file in your application:

```bash
# Azure OpenAI (AI Foundry)
AI_FOUNDRY_ENDPOINT=https://your-resource.openai.azure.com/
AI_FOUNDRY_API_KEY=your-api-key-here
AI_FOUNDRY_DEPLOYMENT_NAME=gpt-4o-mini

# Microsoft Fabric (from steps above)
FABRIC_WORKSPACE_ID=your-workspace-guid-here
FABRIC_DATASET_ID=your-dataset-guid-here
FABRIC_TENANT_ID=your-tenant-guid-here
FABRIC_CLIENT_ID=your-app-client-id-here
FABRIC_CLIENT_SECRET=your-app-secret-here

# Server
PORT=3000
```

### Step 11: Test the Application

1. Start the server: `npm start`
2. Open browser: `http://localhost:3000`
3. Try sample queries:
   - "Show me sales by region"
   - "Top 10 products by revenue"
   - "Monthly sales trend for 2024"
   - "What are the best selling categories?"

## Customization

### Adjust Record Counts

Edit these variables at the top of the script:

```python
NUM_PRODUCTS = 1000      # Change to generate more/fewer products
NUM_CUSTOMERS = 500      # Change to generate more/fewer customers
NUM_SALES = 50000        # Change to generate more/fewer transactions
```

### Change Date Range

```python
START_DATE = datetime(2022, 1, 1)  # Change start date
END_DATE = datetime(2025, 11, 26)  # Change end date
```

### Add New Product Categories

```python
categories_map = {
    'Electronics': ['TVs', 'Computers', 'Audio'],
    'Your Category': ['Subcategory 1', 'Subcategory 2'],  # Add here
    # ... rest of categories
}

product_templates = {
    'Your Category': [
        'Product Name Template {variable}',
        'Another Template {variable}'
    ],
    # ... rest of templates
}
```

### Modify Seasonal Patterns

Edit the `get_sales_multiplier()` function:

```python
def get_sales_multiplier(date):
    month = date.month
    if month in [11, 12]:  # Holiday season
        return np.random.uniform(1.3, 1.8)  # Adjust multiplier
    # ... add more patterns
```

## Troubleshooting

### Error: "NameError: name 'spark' is not defined"
**Solution**: You're not running in a Fabric notebook. Make sure:
- You created a notebook in Microsoft Fabric (not Jupyter or local)
- The notebook is attached to a Lakehouse
- You're running the code in a notebook cell

### Error: "AnalysisException: Table already exists"
**Solution**: Tables were already created. Options:
1. Delete existing tables in Lakehouse and re-run
2. Change script mode from `overwrite` to `append`:
   ```python
   .write.format("delta").mode("append").saveAsTable("Products")
   ```

### Error: "Permission denied"
**Solution**: Ensure you have write access to the Lakehouse:
- Check workspace role (Contributor or higher)
- Verify Lakehouse permissions

### Script runs but no tables appear
**Solution**: 
1. Refresh the Lakehouse explorer (click refresh icon)
2. Check if notebook is attached to correct Lakehouse
3. Look for error messages in cell output

### Memory errors with large datasets
**Solution**: Reduce record counts:
```python
NUM_PRODUCTS = 500
NUM_CUSTOMERS = 250
NUM_SALES = 25000
```

## Data Schema Reference

### Products Table
| Column | Type | Description |
|--------|------|-------------|
| ProductID | int | Unique identifier |
| ProductName | string | Product display name |
| Category | string | Primary category |
| Subcategory | string | Secondary category |
| UnitCost | decimal | Cost to acquire |
| UnitPrice | decimal | Selling price |
| Brand | string | Product brand |

### Customers Table
| Column | Type | Description |
|--------|------|-------------|
| CustomerID | int | Unique identifier |
| CustomerName | string | Full name |
| Segment | string | Consumer/Small Business/Enterprise |
| Region | string | Geographic region |
| State | string | US State |
| City | string | City name |

### Sales Table
| Column | Type | Description |
|--------|------|-------------|
| OrderID | int | Unique transaction ID |
| OrderDate | datetime | Transaction date |
| ProductID | int | Foreign key to Products |
| CustomerID | int | Foreign key to Customers |
| Quantity | int | Units sold |
| UnitPrice | decimal | Price per unit |
| SalesAmount | decimal | Total transaction value |

### Date Table
| Column | Type | Description |
|--------|------|-------------|
| Date | datetime | Calendar date |
| Year | int | Year (2022-2025) |
| Quarter | int | Quarter (1-4) |
| Month | int | Month number (1-12) |
| MonthName | string | Full month name |
| MonthShort | string | Abbreviated month |
| DayOfWeek | string | Full day name |
| DayOfWeekShort | string | Abbreviated day |
| DayOfMonth | int | Day of month (1-31) |
| DayOfYear | int | Day of year (1-366) |
| WeekOfYear | int | ISO week number |
| IsWeekend | boolean | Saturday/Sunday flag |

## Support

For issues or questions:
1. Check this README
2. Review Fabric notebook output for error messages
3. Verify all prerequisites are met
4. Check `SOLUTION_OVERVIEW.md` for detailed documentation

---

**Last Updated**: November 2025  
**Compatible with**: Microsoft Fabric, Synapse Analytics, Azure Databricks
