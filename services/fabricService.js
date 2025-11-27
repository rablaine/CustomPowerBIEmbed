const axios = require('axios');
const { ClientSecretCredential } = require('@azure/identity');

class FabricService {
    constructor() {
        this.workspaceId = process.env.FABRIC_WORKSPACE_ID;
        this.datasetId = process.env.FABRIC_DATASET_ID;
        this.tenantId = process.env.FABRIC_TENANT_ID;
        this.clientId = process.env.FABRIC_CLIENT_ID;
        this.clientSecret = process.env.FABRIC_CLIENT_SECRET;
        
        this.credential = null;
        
        if (this.tenantId && this.clientId && this.clientSecret) {
            this.credential = new ClientSecretCredential(
                this.tenantId,
                this.clientId,
                this.clientSecret
            );
        } else {
            console.warn('Fabric credentials not configured. Using mock data.');
        }
    }

    /**
     * Execute DAX query against Microsoft Fabric via XMLA Proxy
     * The XMLA proxy uses ADOMD.NET with service principal authentication
     */
    async executeQuery(sqlQuery) {
        // Check if XMLA proxy is configured
        const xmlaProxyUrl = process.env.XMLA_PROXY_URL || 'http://localhost:5000';
        
        try {
            console.log('Executing DAX query via XMLA proxy...');

            // Call .NET XMLA proxy service
            // The proxy handles service principal authentication via XMLA endpoint
            const response = await axios.post(
                `${xmlaProxyUrl}/query`,
                {
                    query: sqlQuery
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            // Parse response from XMLA proxy
            const data = response.data.data;
            
            console.log(`✓ Query executed successfully via XMLA. Returned ${data.length} rows.`);
            return { data, isMockData: false };

        } catch (error) {
            console.error('XMLA proxy query error:', error.response?.data || error.message);
            
            // Check if XMLA proxy is running
            if (error.code === 'ECONNREFUSED') {
                console.warn('⚠ XMLA proxy service not running. Start it with: cd xmla-proxy-dotnet && dotnet run');
            }
            
            // Fallback to mock data on error
            console.log('Falling back to mock data');
            const mockData = this.mockExecuteQuery(sqlQuery);
            return { data: mockData, isMockData: true };
        }
    }

    /**
     * Discover schema by querying DMV views via XMLA proxy
     * Returns actual table and column structure from Fabric dataset
     */
    async discoverSchema() {
        const xmlaProxyUrl = process.env.XMLA_PROXY_URL || 'http://localhost:5000';
        
        try {
            console.log('Discovering schema from Fabric dataset...');

            // Query 1: Get all tables using DMV
            const tablesQuery = `
                SELECT 
                    [TABLE_NAME] as TableName
                FROM $SYSTEM.DBSCHEMA_TABLES
                WHERE [TABLE_TYPE] = 'TABLE'
            `;

            const tablesResponse = await axios.post(
                `${xmlaProxyUrl}/query`,
                { query: tablesQuery },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000
                }
            );

            const tables = tablesResponse.data.data || [];
            console.log(`✓ Found ${tables.length} tables`);

            // Build schema structure
            const schema = {
                tables: {},
                discoveredAt: new Date().toISOString()
            };

            // Query 2: Get columns for each table
            for (const table of tables) {
                const tableName = table.TableName;
                
                // Skip system tables
                if (tableName.startsWith('$')) {
                    continue;
                }

                try {
                    const columnsQuery = `
                        SELECT 
                            [COLUMN_NAME] as ColumnName,
                            [DATA_TYPE] as DataType
                        FROM $SYSTEM.DBSCHEMA_COLUMNS
                        WHERE [TABLE_NAME] = '${tableName}'
                        ORDER BY [ORDINAL_POSITION]
                    `;

                    const columnsResponse = await axios.post(
                        `${xmlaProxyUrl}/query`,
                        { query: columnsQuery },
                        {
                            headers: { 'Content-Type': 'application/json' },
                            timeout: 10000
                        }
                    );

                    schema.tables[tableName] = {
                        caption: tableName,
                        type: 'table',
                        columns: columnsResponse.data.data || []
                    };

                    console.log(`  ✓ ${tableName}: ${schema.tables[tableName].columns.length} columns`);
                } catch (error) {
                    console.log(`  ✗ ${tableName}: Failed to get columns - ${error.message}`);
                    schema.tables[tableName] = {
                        caption: tableName,
                        type: 'table',
                        columns: []
                    };
                }
            }

            console.log(`✓ Schema discovery complete`);
            console.log('Tables discovered:', Object.keys(schema.tables).join(', '));

            return schema;

        } catch (error) {
            console.error('Schema discovery failed:', error.response?.data?.detail || error.response?.data || error.message);
            
            if (error.code === 'ECONNREFUSED') {
                console.warn('⚠ XMLA proxy service not running. Start it with: cd xmla-proxy-dotnet && dotnet run');
            }
            
            return null;
        }
    }

    /**
     * Parse Fabric query result into array of objects
     */
    parseQueryResult(result) {
        if (!result || !result.tables || result.tables.length === 0) {
            return [];
        }

        const table = result.tables[0];
        const columns = table.rows[0] ? Object.keys(table.rows[0]) : [];
        
        return table.rows.map(row => {
            const obj = {};
            columns.forEach(col => {
                obj[col] = row[col];
            });
            return obj;
        });
    }

    /**
     * Mock query execution for testing - Contoso Retail Demo Data
     */
    mockExecuteQuery(sqlQuery) {
        console.log('Using mock data for query:', sqlQuery);
        
        const lowerQuery = sqlQuery.toLowerCase();
        
        // Sales by region
        if (lowerQuery.includes('region') && (lowerQuery.includes('sales') || lowerQuery.includes('revenue'))) {
            return [
                { 'Geography[Region]': 'West', '[Total Sales]': 2450000, '[Total Orders]': 1823 },
                { 'Geography[Region]': 'East', '[Total Sales]': 2180000, '[Total Orders]': 1654 },
                { 'Geography[Region]': 'South', '[Total Sales]': 1920000, '[Total Orders]': 1432 },
                { 'Geography[Region]': 'Central', '[Total Sales]': 1650000, '[Total Orders]': 1287 }
            ];
        }
        
        // Category performance
        if (lowerQuery.includes('category')) {
            return [
                { 'Products[Category]': 'Electronics', '[Total Sales]': 3250000, '[Total Quantity]': 8420 },
                { 'Products[Category]': 'Clothing', '[Total Sales]': 2180000, '[Total Quantity]': 15230 },
                { 'Products[Category]': 'Home & Garden', '[Total Sales]': 1920000, '[Total Quantity]': 6840 },
                { 'Products[Category]': 'Sports', '[Total Sales]': 1450000, '[Total Quantity]': 5120 },
                { 'Products[Category]': 'Books', '[Total Sales]': 420000, '[Total Quantity]': 12340 }
            ];
        }
        
        // Top products
        if (lowerQuery.includes('product') && (lowerQuery.includes('top') || lowerQuery.includes('best'))) {
            return [
                { 'Products[ProductName]': 'Smart TV 55"', '[Total Sales]': 485000, '[Total Quantity]': 421 },
                { 'Products[ProductName]': 'Laptop Pro 15"', '[Total Sales]': 425000, '[Total Quantity]': 312 },
                { 'Products[ProductName]': 'Wireless Headphones', '[Total Sales]': 320000, '[Total Quantity]': 1842 },
                { 'Products[ProductName]': 'Running Shoes Elite', '[Total Sales]': 285000, '[Total Quantity]': 1520 },
                { 'Products[ProductName]': 'Coffee Maker Deluxe', '[Total Sales]': 245000, '[Total Quantity]': 2340 },
                { 'Products[ProductName]': 'Designer Jeans', '[Total Sales]': 220000, '[Total Quantity]': 1850 },
                { 'Products[ProductName]': 'Smart Watch', '[Total Sales]': 195000, '[Total Quantity]': 842 },
                { 'Products[ProductName]': 'Garden Tool Set', '[Total Sales]': 178000, '[Total Quantity]': 920 },
                { 'Products[ProductName]': 'Yoga Mat Premium', '[Total Sales]': 156000, '[Total Quantity]': 3240 },
                { 'Products[ProductName]': 'Desk Lamp LED', '[Total Sales]': 142000, '[Total Quantity]': 2890 }
            ];
        }
        
        // Monthly/time trends
        if (lowerQuery.includes('month') || lowerQuery.includes('trend') || lowerQuery.includes('time')) {
            return [
                { 'Date[MonthName]': 'January', '[Total Sales]': 725000, '[Sales Growth]': 5.2 },
                { 'Date[MonthName]': 'February', '[Total Sales]': 780000, '[Sales Growth]': 7.6 },
                { 'Date[MonthName]': 'March', '[Total Sales]': 845000, '[Sales Growth]': 8.3 },
                { 'Date[MonthName]': 'April', '[Total Sales]': 820000, '[Sales Growth]': -3.0 },
                { 'Date[MonthName]': 'May', '[Total Sales]': 890000, '[Sales Growth]': 8.5 },
                { 'Date[MonthName]': 'June', '[Total Sales]': 925000, '[Sales Growth]': 3.9 },
                { 'Date[MonthName]': 'July', '[Total Sales]': 880000, '[Sales Growth]': -4.9 },
                { 'Date[MonthName]': 'August', '[Total Sales]': 910000, '[Sales Growth]': 3.4 },
                { 'Date[MonthName]': 'September', '[Total Sales]': 865000, '[Sales Growth]': -4.9 },
                { 'Date[MonthName]': 'October', '[Total Sales]': 945000, '[Sales Growth]': 9.2 },
                { 'Date[MonthName]': 'November', '[Total Sales]': 1020000, '[Sales Growth]': 7.9 },
                { 'Date[MonthName]': 'December', '[Total Sales]': 1180000, '[Sales Growth]': 15.7 }
            ];
        }
        
        // Customer segments
        if (lowerQuery.includes('customer') && lowerQuery.includes('segment')) {
            return [
                { 'Customers[Segment]': 'Consumer', '[Total Sales]': 5240000, '[Unique Customers]': 8420 },
                { 'Customers[Segment]': 'Corporate', '[Total Sales]': 2850000, '[Unique Customers]': 342 },
                { 'Customers[Segment]': 'Home Office', '[Total Sales]': 1110000, '[Unique Customers]': 1234 }
            ];
        }
        
        // Year comparison
        if (lowerQuery.includes('year')) {
            return [
                { 'Date[Year]': '2023', '[Total Sales]': 8450000, '[Total Orders]': 12340 },
                { 'Date[Year]': '2024', '[Total Sales]': 9785000, '[Total Orders]': 14250 },
                { 'Date[Year]': '2025', '[Total Sales]': 2450000, '[Total Orders]': 3420 }
            ];
        }
        
        // Default - sales summary
        return [
            { 'Metric': 'Total Sales', 'Value': 9785000 },
            { 'Metric': 'Total Orders', 'Value': 14250 },
            { 'Metric': 'Avg Order Value', 'Value': 687 },
            { 'Metric': 'Unique Customers', 'Value': 9996 },
            { 'Metric': 'Products Sold', 'Value': 35420 }
        ];
    }

    /**
     * Get semantic model schema from Fabric (DAX-style)
     */
    async getSchema() {
        // Query to get model metadata using DMV (Dynamic Management Views)
        const schemaQuery = `EVALUATE
SELECTCOLUMNS(
    FILTER(
        INFO.TABLES(),
        [TABLE_TYPE] <> "SYSTEM"
    ),
    "Table", [TABLE_NAME],
    "Type", [TABLE_TYPE]
)`;

        try {
            const results = await this.executeQuery(schemaQuery);
            
            if (results && results.length > 0) {
                return this.formatDaxSchemaDescription(results);
            }
            
            // Fallback: Try INFORMATION_SCHEMA if DMV doesn't work
            return await this.getSqlSchema();
        } catch (error) {
            console.error('Failed to retrieve DAX schema, trying SQL schema:', error.message);
            return await this.getSqlSchema();
        }
    }

    /**
     * Fallback SQL schema query
     */
    async getSqlSchema() {
        const schemaQuery = `
            SELECT 
                t.TABLE_SCHEMA,
                t.TABLE_NAME,
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.ORDINAL_POSITION
            FROM INFORMATION_SCHEMA.TABLES t
            JOIN INFORMATION_SCHEMA.COLUMNS c 
                ON t.TABLE_NAME = c.TABLE_NAME 
                AND t.TABLE_SCHEMA = c.TABLE_SCHEMA
            WHERE t.TABLE_TYPE = 'BASE TABLE'
            ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
        `;

        try {
            const results = await this.executeQuery(schemaQuery);
            return this.formatSchemaDescription(results);
        } catch (error) {
            console.error('Failed to retrieve schema:', error.message);
            return null;
        }
    }

    /**
     * Format DAX schema from DMV results
     */
    formatDaxSchemaDescription(schemaResults) {
        if (!schemaResults || schemaResults.length === 0) {
            return null;
        }

        const tables = {};
        
        schemaResults.forEach(row => {
            const tableName = row.Table || row['[Table]'];
            const tableType = row.Type || row['[Type]'];
            if (tableName && !tables[tableName]) {
                tables[tableName] = {
                    type: tableType,
                    columns: []
                };
            }
        });

        // Build formatted schema text for DAX
        let schemaText = 'SEMANTIC MODEL SCHEMA (for DAX queries):\n\n';
        
        for (const [tableName, tableInfo] of Object.entries(tables)) {
            schemaText += `TABLE: '${tableName}'\n`;
            schemaText += `Type: ${tableInfo.type}\n`;
            schemaText += 'Reference columns as: \'${tableName}\'[Column Name]\n\n';
        }
        
        schemaText += 'COMMON MEASURES (reference with [Measure Name]):\n';
        schemaText += '- [Total Sales], [Total Quantity], [Total Revenue]\n';
        schemaText += '- [Average Price], [Distinct Customers], [Distinct Products]\n\n';
        
        schemaText += 'DAX QUERY FORMAT:\n';
        schemaText += 'Always start with EVALUATE\n';
        schemaText += 'Use SUMMARIZECOLUMNS for aggregations\n';
        schemaText += 'Use TOPN for top N results\n';

        return {
            text: schemaText,
            tables: tables
        };
    }

    /**
     * Format SQL schema query results into readable description
     */
    formatSchemaDescription(schemaResults) {
        if (!schemaResults || schemaResults.length === 0) {
            return null;
        }

        const tables = {};
        
        schemaResults.forEach(row => {
            const tableName = row.TABLE_NAME;
            if (!tables[tableName]) {
                tables[tableName] = {
                    schema: row.TABLE_SCHEMA,
                    columns: []
                };
            }
            tables[tableName].columns.push({
                name: row.COLUMN_NAME,
                type: row.DATA_TYPE,
                position: row.ORDINAL_POSITION
            });
        });

        // Build formatted schema text for DAX (convert SQL schema to DAX format)
        let schemaText = 'SEMANTIC MODEL SCHEMA (for DAX queries):\n\n';
        
        for (const [tableName, tableInfo] of Object.entries(tables)) {
            schemaText += `TABLE: '${tableName}'\n`;
            schemaText += 'Columns:\n';
            tableInfo.columns.forEach(col => {
                schemaText += `- '${tableName}'[${col.name}] (${col.type})\n`;
            });
            schemaText += '\n';
        }

        return {
            text: schemaText,
            tables: tables
        };
    }

    /**
     * Test connection to Fabric
     */
    async testConnection() {
        try {
            if (!this.credential) {
                return { 
                    success: false, 
                    message: 'Credentials not configured',
                    usingMockData: true 
                };
            }

            const tokenResponse = await this.credential.getToken('https://analysis.windows.net/powerbi/api/.default');
            
            return { 
                success: true, 
                message: 'Connected to Microsoft Fabric',
                usingMockData: false 
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message,
                usingMockData: true 
            };
        }
    }
}

module.exports = new FabricService();
