const { AzureOpenAI } = require('openai');
const fabricService = require('./fabricService');

class AIService {
    constructor() {
        this.endpoint = process.env.AI_FOUNDRY_ENDPOINT;
        this.apiKey = process.env.AI_FOUNDRY_API_KEY;
        this.deployment = process.env.AI_FOUNDRY_DEPLOYMENT_NAME;
        this.apiVersion = "2024-04-01-preview";
        this.modelName = process.env.AI_FOUNDRY_DEPLOYMENT_NAME;
        this.cachedSchema = null;
        this.schemaLoadTime = null;
        this.schemaCacheDuration = 3600000; // 1 hour in milliseconds
        
        if (!this.endpoint || !this.apiKey) {
            console.warn('AI Foundry credentials not configured. Using mock responses.');
            this.client = null;
        } else {
            const options = { 
                endpoint: this.endpoint, 
                apiKey: this.apiKey, 
                deployment: this.deployment, 
                apiVersion: this.apiVersion 
            };
            this.client = new AzureOpenAI(options);
        }
    }

    /**
     * Get database schema (cached with dynamic discovery)
     */
    async getDatabaseSchema() {
        // Check if cache is valid
        const now = Date.now();
        if (this.cachedSchema && this.schemaLoadTime && (now - this.schemaLoadTime) < this.schemaCacheDuration) {
            console.log('Using cached schema');
            return this.cachedSchema;
        }

        // Try to discover fresh schema from Fabric
        try {
            console.log('Attempting dynamic schema discovery...');
            const schema = await fabricService.discoverSchema();
            if (schema && schema.tables) {
                const schemaDescription = this.formatDiscoveredSchema(schema);
                this.cachedSchema = schemaDescription;
                this.schemaLoadTime = now;
                console.log('✓ Schema discovered and cached');
                return this.cachedSchema;
            }
        } catch (error) {
            console.error('Failed to discover schema from Fabric:', error.message);
        }

        // Fall back to default schema description
        console.log('Using default schema description');
        return this.getDefaultSchemaDescription();
    }

    /**
     * Format discovered schema into AI-readable description
     */
    formatDiscoveredSchema(schema) {
        let description = `POWER BI FABRIC SEMANTIC MODEL (DISCOVERED SCHEMA):\n\n`;
        
        const tableNames = Object.keys(schema.tables);
        description += `Discovered at: ${schema.discoveredAt}\n`;
        description += `Tables found: ${tableNames.length}\n\n`;

        // Describe each table
        for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
            description += `TABLE: ${tableName}\n`;
            
            if (tableInfo.columns && tableInfo.columns.length > 0) {
                description += `Columns:\n`;
                tableInfo.columns.forEach(col => {
                    description += `- ${tableName}[${col.ColumnName || col.name}] (${col.DataType || col.dataType})\n`;
                });
            } else {
                description += `Columns: (schema discovery in progress)\n`;
            }
            
            description += `\n`;
        }

        description += `IMPORTANT: This dataset has NO PREDEFINED MEASURES. You must create measures inline in your DAX queries.\n\n`;
        
        description += `HOW TO CREATE MEASURES IN DAX:\n`;
        description += `Use the measure syntax within SUMMARIZECOLUMNS:\n`;
        description += `"Measure Name", AGGREGATION(Table[Column])\n\n`;
        
        description += `Common aggregations:\n`;
        description += `- "Total Sales", SUM(sales[TotalAmount])\n`;
        description += `- "Total Quantity", SUM(sales[Quantity])\n`;
        description += `- "Order Count", COUNTROWS(sales)\n`;
        description += `- "Average Sale", AVERAGE(sales[TotalAmount])\n`;
        description += `- "Unique Customers", DISTINCTCOUNT(sales[CustomerID])\n`;
        description += `- "Unique Products", DISTINCTCOUNT(sales[ProductID])\n\n`;
        
        description += `DAX QUERY PATTERNS:\n`;
        description += `- Start with EVALUATE\n`;
        description += `- Use SUMMARIZECOLUMNS for aggregations\n`;
        description += `- Use TOPN for top N results\n`;
        description += `- Reference columns as: TableName[ColumnName]\n`;
        description += `- Create inline measures: "Measure Name", FUNCTION(Table[Column])\n`;

        return description;
    }

    /**
     * Default schema description when unable to query Fabric
     */
    getDefaultSchemaDescription() {
        return `POWER BI FABRIC SEMANTIC MODEL:

TABLE: sales
Columns:
- sales[OrderID] - Unique order identifier
- sales[OrderDate] - Date of the order  
- sales[ProductID] - Foreign key to products
- sales[CustomerID] - Foreign key to customers
- sales[Quantity] - Number of units sold
- sales[UnitPrice] - Price per unit
- sales[TotalAmount] - Total sale amount (calculated field)

TABLE: products
Columns:
- products[ProductID] - Unique product identifier
- products[ProductName] - Product name
- products[Category] - Product category
- products[Subcategory] - Product subcategory
- products[UnitCost] - Product cost per unit

TABLE: customers
Columns:
- customers[CustomerID] - Unique customer identifier
- customers[CustomerName] - Customer name
- customers[Segment] - Customer segment
- customers[Region] - Customer region
- customers[City] - Customer city
- customers[State] - Customer state

TABLE: date
Columns:
- date[Date] - Calendar date
- date[Year] - Year
- date[Quarter] - Quarter (Q1, Q2, Q3, Q4)
- date[Month] - Month number (1-12)
- date[MonthName] - Month name
- date[DayOfWeek] - Day of week

IMPORTANT: This dataset has NO PREDEFINED MEASURES. You must create measures inline in your DAX queries.

HOW TO CREATE MEASURES IN DAX:
Use the measure syntax within SUMMARIZECOLUMNS:
"Measure Name", AGGREGATION(Table[Column])

Common aggregations:
- "Total Sales", SUM(sales[TotalAmount])
- "Total Quantity", SUM(sales[Quantity])
- "Order Count", COUNTROWS(sales)
- "Average Sale", AVERAGE(sales[TotalAmount])
- "Unique Customers", DISTINCTCOUNT(sales[CustomerID])
- "Unique Products", DISTINCTCOUNT(sales[ProductID])

COMMON QUERIES:
- Sales by region, category, or time period
- Top products or customers by revenue
- Sales trends over time
- Customer segmentation analysis
- Product performance by category`;
    }

    /**
     * Parse natural language query and generate SQL
     */
    async parseQuery(userQuery) {
        if (!this.client) {
            return this.mockParseQuery(userQuery);
        }

        try {
            const prompt = await this.buildQueryParsePrompt(userQuery);
            
            console.log('\\n========== OPENAI QUERY PARSE REQUEST ==========');
            console.log('System Message:', 'You are a DAX expert for Microsoft Power BI and Fabric semantic models. Convert natural language queries into valid DAX queries that use EVALUATE, SUMMARIZECOLUMNS, and other DAX functions. Return only executable DAX code without explanations or markdown formatting.');
            console.log('\\nUser Prompt:');
            console.log(prompt);
            console.log('\nModel:', this.modelName);
            console.log('Temperature:', 0.3);
            console.log('Max Tokens:', 500);
            console.log('================================================\n');
            
            const response = await this.client.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a DAX expert for Microsoft Power BI and Fabric semantic models. Convert natural language queries into valid DAX queries that use EVALUATE, SUMMARIZECOLUMNS, and other DAX functions. Return only executable DAX code without explanations or markdown formatting.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.modelName,
                temperature: 0.3,
                max_tokens: 500
            });

            console.log('\n========== OPENAI QUERY PARSE RESPONSE ==========');
            console.log('Full Response Object:');
            console.log(JSON.stringify(response, null, 2));
            console.log('==================================================\n');

            if (response?.error !== undefined) {
                throw response.error;
            }

            const sqlQuery = response.choices[0].message.content.trim();
            
            return {
                sqlQuery: this.cleanSqlQuery(sqlQuery),
                confidence: 0.9,
                debug: {
                    systemMessage: 'You are a DAX expert for Microsoft Power BI and Fabric semantic models. Convert natural language queries into valid DAX queries that use EVALUATE, SUMMARIZECOLUMNS, and other DAX functions. Return only executable DAX code without explanations or markdown formatting.',
                    userPrompt: prompt,
                    fullResponse: response
                }
            };

        } catch (error) {
            console.error('AI Foundry API error:', error.message || error);
            console.log('Falling back to mock query parsing');
            return this.mockParseQuery(userQuery);
        }
    }

    /**
     * Interpret results and suggest visualization
     */
    async interpretResults(originalQuery, data) {
        if (!this.client) {
            return this.mockInterpretResults(originalQuery, data);
        }

        try {
            const prompt = this.buildInterpretationPrompt(originalQuery, data);
            
            console.log('\n========== OPENAI INTERPRET REQUEST ==========');
            console.log('System Message:', 'You are a data visualization expert. Analyze query results and suggest the best chart type. Respond in JSON format with keys: title, summary, chartType (bar/line/pie/doughnut/radar).');
            console.log('\nUser Prompt:');
            console.log(prompt);
            console.log('\nModel:', this.modelName);
            console.log('Temperature:', 0.5);
            console.log('Max Tokens:', 300);
            console.log('Response Format:', 'json_object');
            console.log('==============================================\n');
            
            const response = await this.client.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a data visualization expert. Analyze query results and suggest the best chart type. Respond in JSON format with keys: title, summary, chartType (bar/line/pie/doughnut/radar).'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.modelName,
                temperature: 0.5,
                max_tokens: 300,
                response_format: { type: 'json_object' }
            });

            console.log('\n========== OPENAI INTERPRET RESPONSE ==========');
            console.log('Full Response Object:');
            console.log(JSON.stringify(response, null, 2));
            console.log('================================================\n');

            if (response?.error !== undefined) {
                throw response.error;
            }

            const interpretation = JSON.parse(response.choices[0].message.content);
            
            return {
                title: interpretation.title || 'Data Visualization',
                summary: interpretation.summary || 'Data retrieved successfully',
                chartType: interpretation.chartType || 'bar',
                debug: {
                    systemMessage: 'You are a data visualization expert. Analyze query results and suggest the best chart type. Respond in JSON format with keys: title, summary, chartType (bar/line/pie/doughnut/radar).',
                    userPrompt: prompt,
                    fullResponse: response
                }
            };

        } catch (error) {
            console.error('AI interpretation error:', error.message || error);
            return this.mockInterpretResults(originalQuery, data);
        }
    }

    /**
     * Build prompt for query parsing
     */
    async buildQueryParsePrompt(userQuery) {
        const schemaDescription = await this.getDatabaseSchema();
        
        return `Convert this natural language query into a DAX query for Microsoft Fabric Power BI semantic model:

User Query: "${userQuery}"

${schemaDescription}

IMPORTANT DAX RULES:
- Always start with EVALUATE
- Use SUMMARIZECOLUMNS for aggregations by dimensions
- Reference measures with [Measure Name] syntax
- Reference columns with 'Table'[Column] syntax
- Use TOPN(N, table, orderBy) for top/bottom queries
- Use FILTER for filtering data
- Use CALCULATETABLE for complex filtering
- Common functions: SUM, COUNT, AVERAGE, DISTINCTCOUNT
- For time intelligence, use Date table and functions like SAMEPERIODLASTYEAR

EXAMPLE QUERIES WITH INLINE MEASURES:

1. Sales by Customer Segment:
EVALUATE
SUMMARIZECOLUMNS(
    customers[Segment],
    "Total Sales", SUM(sales[TotalAmount]),
    "Order Count", COUNTROWS(sales),
    "Unique Customers", DISTINCTCOUNT(sales[CustomerID])
)

2. Top 10 Products by Revenue:
EVALUATE
TOPN(
    10,
    SUMMARIZECOLUMNS(
        products[ProductName],
        "Revenue", SUM(sales[TotalAmount]),
        "Units Sold", SUM(sales[Quantity])
    ),
    [Revenue], DESC
)

3. Sales by Category:
EVALUATE
SUMMARIZECOLUMNS(
    products[Category],
    "Total Sales", SUM(sales[TotalAmount]),
    "Average Sale", AVERAGE(sales[TotalAmount])
)

4. Monthly Sales Trend:
EVALUATE
SUMMARIZECOLUMNS(
    date[Year],
    date[MonthName],
    "Sales", SUM(sales[TotalAmount])
)

5. Regional Performance:
EVALUATE
SUMMARIZECOLUMNS(
    customers[Region],
    "Total Revenue", SUM(sales[TotalAmount]),
    "Customer Count", DISTINCTCOUNT(sales[CustomerID]),
    "Avg Sale per Customer", DIVIDE(SUM(sales[TotalAmount]), DISTINCTCOUNT(sales[CustomerID]))
)

Return only valid DAX that can be executed directly. No markdown, no explanations.`;
    }

    /**
     * Build prompt for interpretation
     */
    buildInterpretationPrompt(originalQuery, data) {
        const dataSample = data.slice(0, 5).map(row => JSON.stringify(row)).join('\n');
        const columns = data.length > 0 ? Object.keys(data[0]).join(', ') : 'none';
        
        return `Analyze this query result and suggest visualization:

Original Query: "${originalQuery}"
Columns: ${columns}
Row Count: ${data.length}
Sample Data:
${dataSample}

Respond with JSON containing:
- title: A clear, descriptive title for the visualization
- summary: A one-sentence interpretation of what the data shows
- chartType: Choose from: bar, line, pie, doughnut, radar`;
    }

    /**
     * Clean DAX query from AI response
     */
    cleanSqlQuery(daxQuery) {
        // Remove markdown code blocks
        let cleaned = daxQuery.replace(/```dax\n?/gi, '').replace(/```sql\n?/gi, '').replace(/```\n?/g, '');
        // Remove leading/trailing whitespace
        cleaned = cleaned.trim();
        // Remove trailing semicolon if present (DAX doesn't use them)
        cleaned = cleaned.replace(/;$/, '');
        return cleaned;
    }

    /**
     * Mock response when AI not configured
     */
    mockParseQuery(userQuery) {
        console.log('Using mock AI response for query parsing');
        
        const lowerQuery = userQuery.toLowerCase();
        
        if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
            return {
                sqlQuery: `EVALUATE
SUMMARIZECOLUMNS(
    'Geography'[Region],
    "Total Revenue", [Total Sales]
)
ORDER BY [Total Revenue] DESC`,
                confidence: 0.8
            };
        } else if (lowerQuery.includes('product')) {
            return {
                sqlQuery: `EVALUATE
TOPN(
    10,
    SUMMARIZECOLUMNS(
        'Products'[Product Name],
        "Total Quantity", [Total Quantity]
    ),
    [Total Quantity], DESC
)`,
                confidence: 0.8
            };
        } else if (lowerQuery.includes('trend') || lowerQuery.includes('month')) {
            return {
                sqlQuery: `EVALUATE
SUMMARIZECOLUMNS(
    'Date'[Month Name],
    "Sales", [Total Sales],
    "Target", [Sales Target]
)`,
                confidence: 0.8
            };
        } else {
            return {
                sqlQuery: `EVALUATE
SUMMARIZECOLUMNS(
    'Products'[Category],
    "Count", COUNTROWS('Sales')
)
ORDER BY [Count] DESC`,
                confidence: 0.7
            };
        }
    }

    /**
     * Mock interpretation when AI not configured
     */
    mockInterpretResults(originalQuery, data) {
        console.log('Using mock AI response for interpretation');
        
        const hasMultipleRows = data.length > 5;
        const hasTimeData = data.length > 0 && Object.keys(data[0]).some(k => 
            k.toLowerCase().includes('date') || k.toLowerCase().includes('month') || k.toLowerCase().includes('year')
        );
        
        let chartType = 'bar';
        if (hasTimeData) {
            chartType = 'line';
        } else if (!hasMultipleRows && data.length <= 7) {
            chartType = 'pie';
        }
        
        return {
            title: 'Query Results',
            summary: `Retrieved ${data.length} records based on your query`,
            chartType: chartType
        };
    }
}

module.exports = new AIService();
