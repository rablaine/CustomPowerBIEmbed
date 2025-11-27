# Contoso Retail - Demo Data Model

This application uses the **Contoso Retail** demo semantic model when running in mock data mode.

## Business Context

Contoso is a fictional retail company selling consumer products across multiple categories through online and physical stores.

## Semantic Model Structure

### 📊 Fact Table: Sales

The main transactional table containing all sales orders.

**Columns:**
- `OrderID` - Unique order identifier
- `OrderDate` - Date of the order
- `CustomerID` - Foreign key to Customers
- `ProductID` - Foreign key to Products
- `Quantity` - Number of units sold
- `UnitPrice` - Price per unit
- `SalesAmount` - Total sale amount (Quantity × UnitPrice)
- `Region` - Sales region (West, East, South, Central)

### 🛍️ Dimension Table: Products

Product catalog information.

**Columns:**
- `ProductID` - Unique identifier
- `ProductName` - Product name (e.g., "Smart TV 55\"", "Laptop Pro 15\"")
- `Category` - Product category:
  - Electronics
  - Clothing
  - Home & Garden
  - Sports
  - Books
- `Brand` - Product brand
- `Cost` - Product cost to company
- `Price` - Retail price

**Sample Products:**
- Smart TV 55"
- Laptop Pro 15"
- Wireless Headphones
- Running Shoes Elite
- Coffee Maker Deluxe
- Designer Jeans
- Smart Watch
- Garden Tool Set
- Yoga Mat Premium
- Desk Lamp LED

### 👥 Dimension Table: Customers

Customer information and segmentation.

**Columns:**
- `CustomerID` - Unique identifier
- `CustomerName` - Customer name
- `Segment` - Customer type:
  - Consumer (individual buyers)
  - Corporate (business accounts)
  - Home Office (small business/freelancers)
- `Country` - Customer country
- `State` - Customer state
- `City` - Customer city

### 📅 Dimension Table: Date

Calendar dimension for time-based analysis.

**Columns:**
- `Date` - Calendar date
- `Year` - Year (2023, 2024, 2025)
- `Quarter` - Quarter (Q1, Q2, Q3, Q4)
- `Month` - Month number (1-12)
- `MonthName` - Month name (January, February, etc.)
- `WeekOfYear` - Week number (1-52)

## 📈 Measures

Pre-built calculations available in the model:

| Measure | Formula | Description |
|---------|---------|-------------|
| `[Total Sales]` | `SUM('Sales'[SalesAmount])` | Total sales revenue |
| `[Total Quantity]` | `SUM('Sales'[Quantity])` | Total units sold |
| `[Total Orders]` | `COUNTROWS('Sales')` | Number of orders |
| `[Average Order Value]` | `AVERAGE('Sales'[SalesAmount])` | Average sale amount |
| `[Unique Customers]` | `DISTINCTCOUNT('Sales'[CustomerID])` | Number of unique customers |
| `[Sales Growth]` | Year-over-year % | Sales growth percentage |

## 💡 Example Queries

### Sales Performance
- "Show me sales by region"
- "What are total sales for each region?"
- "Compare sales across regions"

### Product Analysis
- "Top 10 products by revenue"
- "Best selling products"
- "Sales by product category"
- "Which categories perform best?"

### Time Analysis
- "Monthly sales trend for 2024"
- "Show me sales by month"
- "Year over year comparison"
- "Sales growth by quarter"

### Customer Insights
- "Customer segment performance"
- "Sales by customer segment"
- "How many customers in each segment?"

### Combined Analysis
- "Electronics sales by region"
- "Top products in the West region"
- "Consumer segment sales trend"

## 📊 Sample Data Ranges

**Sales Data:**
- Total Annual Sales: ~$9.8M (2024)
- Average Order Value: ~$687
- Total Customers: ~10,000
- Total Products: ~500
- Date Range: 2023 - 2025 (partial)

**Regional Distribution:**
- West: $2.45M (highest)
- East: $2.18M
- South: $1.92M
- Central: $1.65M

**Category Performance:**
- Electronics: $3.25M (top category)
- Clothing: $2.18M
- Home & Garden: $1.92M
- Sports: $1.45M
- Books: $420K

**Customer Segments:**
- Consumer: $5.24M (52% of sales, 8,420 customers)
- Corporate: $2.85M (29% of sales, 342 customers)
- Home Office: $1.11M (11% of sales, 1,234 customers)

## 🎯 Using This Model

When you ask questions without configuring real Fabric credentials, the app will:

1. **Generate appropriate DAX** based on the Contoso schema
2. **Return mock data** that makes sense for the query
3. **Create visualizations** with realistic business data

This allows you to:
- ✅ Demo the application without real data
- ✅ Test different query types
- ✅ Show stakeholders what's possible
- ✅ Learn DAX patterns
- ✅ Verify visualization logic

## 🔄 Switching to Your Data

Once you configure your Fabric credentials in `.env`, the app will:
1. Query your actual semantic model schema
2. Use your real tables, columns, and measures
3. Execute queries against your data
4. Return actual results

The Contoso demo data is only used when credentials are not configured or connection fails.

## 📝 Customizing Mock Data

To modify the demo data, edit `mockExecuteQuery()` in `services/fabricService.js`.

You can:
- Add new product names
- Change sales figures
- Add more regions
- Modify categories
- Adjust time periods
- Add new customer segments
