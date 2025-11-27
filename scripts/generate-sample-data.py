"""
Contoso Retail Sample Data Generator for Microsoft Fabric

This script generates realistic sample data for a retail analytics semantic model.
Run this in a Microsoft Fabric notebook to create tables in your Lakehouse.

Tables Created:
- Products: Product catalog with categories and pricing
- Customers: Customer information with segments and geography
- Sales: Transaction records linking products and customers
- Date: Date dimension table for time intelligence

Author: Custom Power BI Embed Solution
Date: November 2025
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

print("=" * 60)
print("Contoso Retail Sample Data Generator")
print("=" * 60)

# =============================================================================
# CONFIGURATION
# =============================================================================

# Number of records to generate
NUM_PRODUCTS = 1000
NUM_CUSTOMERS = 500
NUM_SALES = 50000

# Date range for sales data
START_DATE = datetime(2022, 1, 1)
END_DATE = datetime(2025, 11, 26)

print(f"\nConfiguration:")
print(f"  Products: {NUM_PRODUCTS:,}")
print(f"  Customers: {NUM_CUSTOMERS:,}")
print(f"  Sales Transactions: {NUM_SALES:,}")
print(f"  Date Range: {START_DATE.strftime('%Y-%m-%d')} to {END_DATE.strftime('%Y-%m-%d')}")
print()

# =============================================================================
# GENERATE PRODUCTS TABLE
# =============================================================================

print("Generating Products table...")

# Define product categories and subcategories
categories_map = {
    'Electronics': ['TVs', 'Computers', 'Audio', 'Cameras', 'Phones', 'Tablets'],
    'Clothing': ['Mens', 'Womens', 'Kids', 'Shoes', 'Accessories'],
    'Home & Garden': ['Furniture', 'Kitchen', 'Bedding', 'Decor', 'Tools'],
    'Sports': ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports', 'Winter Sports'],
    'Books': ['Fiction', 'Non-Fiction', 'Educational', 'Children', 'Reference']
}

# Define product name templates
product_templates = {
    'Electronics': [
        'Smart TV {size}"', 'Laptop {brand} {size}"', 'Wireless Headphones {brand}',
        'Digital Camera {brand}', 'Smartphone {brand}', 'Tablet {brand} {size}"',
        'Gaming Console {brand}', 'Wireless Speaker {brand}', '4K Monitor {size}"',
        'Smart Watch {brand}', 'Bluetooth Earbuds {brand}', 'Drone {brand}'
    ],
    'Clothing': [
        '{style} Shirt', '{style} Pants', '{style} Dress', '{style} Jacket',
        '{style} Sweater', '{style} Shorts', '{style} Skirt', 'Running Shoes {brand}',
        'Casual Shoes {brand}', 'Sneakers {brand}', '{style} Hat', '{style} Scarf'
    ],
    'Home & Garden': [
        '{style} Sofa', '{style} Dining Table', '{style} Bed Frame', 'Coffee Maker {brand}',
        'Blender {brand}', 'Cookware Set', 'Bedding Set {style}', 'Area Rug {size}',
        'Wall Art {style}', 'Garden Tool Set', 'Power Drill {brand}', 'Lamp {style}'
    ],
    'Sports': [
        'Yoga Mat {brand}', 'Dumbbells {weight}lb Set', 'Treadmill {brand}',
        'Camping Tent {size}-Person', 'Hiking Backpack', 'Basketball {brand}',
        'Soccer Ball {brand}', 'Kayak {brand}', 'Ski Set {brand}', 'Bicycle {brand}',
        'Tennis Racket {brand}', 'Golf Club Set {brand}'
    ],
    'Books': [
        'Novel: {title}', 'Biography: {title}', 'Cookbook: {title}',
        'Business Book: {title}', 'Children\'s Book: {title}', 'History: {title}',
        'Science Fiction: {title}', 'Mystery: {title}', 'Self-Help: {title}'
    ]
}

# Generate brands, styles, and other attributes
brands = ['Premium', 'Elite', 'Pro', 'Ultra', 'Max', 'Plus', 'Classic', 'Modern', 'Deluxe', 'Standard']
styles = ['Classic', 'Modern', 'Vintage', 'Contemporary', 'Traditional', 'Minimalist', 'Elegant', 'Sporty']
book_titles = ['Success Stories', 'The Journey', 'New Horizons', 'Best Practices', 'The Guide', 
               'Mastery', 'Excellence', 'Innovation', 'The Complete Reference', 'Fundamentals']

products_data = []
product_id = 1

for category, subcategories in categories_map.items():
    # Determine how many products per category (proportional)
    if category == 'Electronics':
        num_in_category = int(NUM_PRODUCTS * 0.30)
    elif category == 'Clothing':
        num_in_category = int(NUM_PRODUCTS * 0.25)
    elif category == 'Home & Garden':
        num_in_category = int(NUM_PRODUCTS * 0.20)
    elif category == 'Sports':
        num_in_category = int(NUM_PRODUCTS * 0.15)
    else:  # Books
        num_in_category = int(NUM_PRODUCTS * 0.10)
    
    for _ in range(num_in_category):
        subcategory = random.choice(subcategories)
        template = random.choice(product_templates[category])
        
        # Fill in template variables
        product_name = template.format(
            size=random.choice(['42', '50', '55', '65', '75', '13', '15', '17', '21', '24', '27']),
            brand=random.choice(brands),
            style=random.choice(styles),
            weight=random.choice(['10', '15', '20', '25', '30']),
            title=random.choice(book_titles)
        )
        
        # Generate pricing based on category
        if category == 'Electronics':
            unit_cost = round(np.random.uniform(50, 800), 2)
            unit_price = round(unit_cost * np.random.uniform(1.3, 2.0), 2)
        elif category == 'Clothing':
            unit_cost = round(np.random.uniform(10, 100), 2)
            unit_price = round(unit_cost * np.random.uniform(1.5, 2.5), 2)
        elif category == 'Home & Garden':
            unit_cost = round(np.random.uniform(20, 500), 2)
            unit_price = round(unit_cost * np.random.uniform(1.4, 2.2), 2)
        elif category == 'Sports':
            unit_cost = round(np.random.uniform(15, 400), 2)
            unit_price = round(unit_cost * np.random.uniform(1.5, 2.3), 2)
        else:  # Books
            unit_cost = round(np.random.uniform(5, 40), 2)
            unit_price = round(unit_cost * np.random.uniform(1.6, 2.5), 2)
        
        products_data.append({
            'ProductID': product_id,
            'ProductName': product_name,
            'Category': category,
            'Subcategory': subcategory,
            'UnitCost': unit_cost,
            'UnitPrice': unit_price,
            'Brand': random.choice(brands)
        })
        
        product_id += 1

# Fill remaining to reach exact NUM_PRODUCTS
while len(products_data) < NUM_PRODUCTS:
    category = random.choice(list(categories_map.keys()))
    subcategory = random.choice(categories_map[category])
    template = random.choice(product_templates[category])
    
    product_name = template.format(
        size=random.choice(['42', '50', '55', '65']),
        brand=random.choice(brands),
        style=random.choice(styles),
        weight=random.choice(['10', '15', '20']),
        title=random.choice(book_titles)
    )
    
    unit_cost = round(np.random.uniform(10, 500), 2)
    unit_price = round(unit_cost * np.random.uniform(1.3, 2.5), 2)
    
    products_data.append({
        'ProductID': product_id,
        'ProductName': product_name,
        'Category': category,
        'Subcategory': subcategory,
        'UnitCost': unit_cost,
        'UnitPrice': unit_price,
        'Brand': random.choice(brands)
    })
    
    product_id += 1

products_df = pd.DataFrame(products_data)
print(f"  ✓ Generated {len(products_df):,} products across {len(categories_map)} categories")

# =============================================================================
# GENERATE CUSTOMERS TABLE
# =============================================================================

print("Generating Customers table...")

regions = ['West', 'East', 'Central', 'South', 'Northeast']
segments = ['Consumer', 'Small Business', 'Enterprise']
states = ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania', 
          'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'Washington', 'Arizona',
          'Massachusetts', 'Tennessee', 'Indiana', 'Missouri', 'Maryland', 'Wisconsin',
          'Colorado', 'Minnesota']
cities = ['Los Angeles', 'Houston', 'Miami', 'New York', 'Chicago', 'Philadelphia',
          'Columbus', 'Atlanta', 'Charlotte', 'Detroit', 'Seattle', 'Phoenix',
          'Boston', 'Nashville', 'Indianapolis', 'Kansas City', 'Baltimore', 'Milwaukee',
          'Denver', 'Minneapolis']

first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
               'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
               'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa']
last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
              'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
              'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris']

customers_data = []
for i in range(1, NUM_CUSTOMERS + 1):
    region = random.choice(regions)
    state = random.choice(states)
    city = random.choice(cities)
    segment = random.choice(segments)
    
    # Bias segment distribution
    if random.random() < 0.6:
        segment = 'Consumer'
    elif random.random() < 0.8:
        segment = 'Small Business'
    
    first_name = random.choice(first_names)
    last_name = random.choice(last_names)
    
    customers_data.append({
        'CustomerID': i,
        'CustomerName': f'{first_name} {last_name}',
        'Segment': segment,
        'Region': region,
        'State': state,
        'City': city
    })

customers_df = pd.DataFrame(customers_data)
print(f"  ✓ Generated {len(customers_df):,} customers across {len(regions)} regions")

# =============================================================================
# GENERATE SALES TABLE
# =============================================================================

print("Generating Sales table...")

sales_data = []
total_days = (END_DATE - START_DATE).days

# Add seasonality and trends
def get_sales_multiplier(date):
    """Apply seasonal patterns to sales"""
    month = date.month
    # Holiday season boost (Nov-Dec)
    if month in [11, 12]:
        return np.random.uniform(1.3, 1.8)
    # Back to school (Aug-Sep)
    elif month in [8, 9]:
        return np.random.uniform(1.2, 1.5)
    # Summer (Jun-Jul)
    elif month in [6, 7]:
        return np.random.uniform(1.1, 1.4)
    # Spring (Mar-May)
    elif month in [3, 4, 5]:
        return np.random.uniform(1.0, 1.2)
    # Winter (Jan-Feb)
    else:
        return np.random.uniform(0.8, 1.0)

for i in range(1, NUM_SALES + 1):
    # Generate random date
    random_days = random.randint(0, total_days)
    order_date = START_DATE + timedelta(days=random_days)
    
    # Select random product and customer
    product_id = random.randint(1, NUM_PRODUCTS)
    customer_id = random.randint(1, NUM_CUSTOMERS)
    
    # Get product details
    product = products_df[products_df['ProductID'] == product_id].iloc[0]
    
    # Generate quantity (with realistic distribution)
    if product['Category'] == 'Electronics':
        quantity = random.choices([1, 2, 3], weights=[80, 15, 5])[0]
    elif product['Category'] == 'Clothing':
        quantity = random.choices([1, 2, 3, 4, 5], weights=[40, 30, 15, 10, 5])[0]
    elif product['Category'] == 'Books':
        quantity = random.choices([1, 2, 3, 4, 5, 6], weights=[50, 20, 15, 10, 3, 2])[0]
    else:
        quantity = random.choices([1, 2, 3, 4], weights=[60, 25, 10, 5])[0]
    
    # Apply seasonal multiplier to price
    seasonal_multiplier = get_sales_multiplier(order_date)
    unit_price = round(product['UnitPrice'] * seasonal_multiplier, 2)
    
    # Add some discount scenarios
    if random.random() < 0.15:  # 15% chance of discount
        discount = np.random.uniform(0.05, 0.25)
        unit_price = round(unit_price * (1 - discount), 2)
    
    sales_amount = round(quantity * unit_price, 2)
    
    sales_data.append({
        'OrderID': i,
        'OrderDate': order_date,
        'ProductID': product_id,
        'CustomerID': customer_id,
        'Quantity': quantity,
        'UnitPrice': unit_price,
        'SalesAmount': sales_amount
    })
    
    if i % 10000 == 0:
        print(f"    Progress: {i:,} / {NUM_SALES:,} transactions...")

sales_df = pd.DataFrame(sales_data)
print(f"  ✓ Generated {len(sales_df):,} sales transactions")

# Calculate summary statistics
total_revenue = sales_df['SalesAmount'].sum()
avg_order_value = sales_df['SalesAmount'].mean()
print(f"    Total Revenue: ${total_revenue:,.2f}")
print(f"    Average Order Value: ${avg_order_value:.2f}")

# =============================================================================
# GENERATE DATE TABLE
# =============================================================================

print("Generating Date table...")

date_data = []
current_date = START_DATE
while current_date <= END_DATE:
    date_data.append({
        'Date': current_date,
        'Year': current_date.year,
        'Quarter': (current_date.month - 1) // 3 + 1,
        'Month': current_date.month,
        'MonthName': current_date.strftime('%B'),
        'MonthShort': current_date.strftime('%b'),
        'DayOfWeek': current_date.strftime('%A'),
        'DayOfWeekShort': current_date.strftime('%a'),
        'DayOfMonth': current_date.day,
        'DayOfYear': current_date.timetuple().tm_yday,
        'WeekOfYear': current_date.isocalendar()[1],
        'IsWeekend': current_date.weekday() >= 5
    })
    current_date += timedelta(days=1)

date_df = pd.DataFrame(date_data)
print(f"  ✓ Generated {len(date_df):,} date records")

# =============================================================================
# SAVE TO FABRIC LAKEHOUSE
# =============================================================================

print("\n" + "=" * 60)
print("Saving tables to Fabric Lakehouse...")
print("=" * 60)

try:
    # Convert pandas DataFrames to Spark DataFrames and save as Delta tables
    print("\nProducts table...")
    spark.createDataFrame(products_df).write.format("delta").mode("overwrite").saveAsTable("Products")
    print("  ✓ Products table saved")
    
    print("\nCustomers table...")
    spark.createDataFrame(customers_df).write.format("delta").mode("overwrite").saveAsTable("Customers")
    print("  ✓ Customers table saved")
    
    print("\nSales table...")
    spark.createDataFrame(sales_df).write.format("delta").mode("overwrite").saveAsTable("Sales")
    print("  ✓ Sales table saved")
    
    print("\nDate table...")
    spark.createDataFrame(date_df).write.format("delta").mode("overwrite").saveAsTable("Date")
    print("  ✓ Date table saved")
    
    print("\n" + "=" * 60)
    print("SUCCESS! All tables created successfully")
    print("=" * 60)
    
    print("\nSummary:")
    print(f"  ✓ Products: {len(products_df):,} records")
    print(f"  ✓ Customers: {len(customers_df):,} records")
    print(f"  ✓ Sales: {len(sales_df):,} records")
    print(f"  ✓ Date: {len(date_df):,} records")
    
    print("\nNext Steps:")
    print("1. Create a semantic model from these Lakehouse tables")
    print("2. Add relationships:")
    print("   - Sales[ProductID] → Products[ProductID]")
    print("   - Sales[CustomerID] → Customers[CustomerID]")
    print("   - Sales[OrderDate] → Date[Date]")
    print("3. Create measures:")
    print("   - Total Sales = SUM(Sales[SalesAmount])")
    print("   - Total Quantity = SUM(Sales[Quantity])")
    print("   - Total Orders = COUNTROWS(Sales)")
    print("   - Average Order Value = DIVIDE([Total Sales], [Total Orders])")
    print("4. Get your Workspace ID and Dataset ID")
    print("5. Update the .env file in your application")
    
except Exception as e:
    print(f"\n❌ ERROR: Failed to save tables")
    print(f"Error details: {str(e)}")
    print("\nTroubleshooting:")
    print("- Make sure you're running this in a Fabric notebook")
    print("- Verify the notebook is attached to a Lakehouse")
    print("- Check that you have write permissions")

print("\n" + "=" * 60)
print("Script completed")
print("=" * 60)
