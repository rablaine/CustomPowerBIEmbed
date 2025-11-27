/**
 * Discover actual schema from Power BI dataset via XMLA proxy
 * This will get the real tables, columns, and measures
 */

const axios = require('axios');

const XMLA_PROXY_URL = 'http://localhost:5000';

async function discoverSchema() {
    console.log('='.repeat(60));
    console.log('FABRIC DATASET SCHEMA DISCOVERY');
    console.log('='.repeat(60));
    console.log();

    try {
        // Query to get all tables using DMV
        console.log('Step 1: Getting tables...');
        const tablesQuery = `
            SELECT 
                [TABLE_NAME] as TableName
            FROM $SYSTEM.DBSCHEMA_TABLES
            WHERE [TABLE_TYPE] = 'TABLE'
        `;

        const tablesResponse = await axios.post(`${XMLA_PROXY_URL}/query`, {
            query: tablesQuery
        });

        const tables = tablesResponse.data.data;
        console.log(`✓ Found ${tables.length} tables`);
        tables.forEach(t => console.log(`  - ${t.TableName}`));
        console.log();

        // For each table, get columns
        console.log('Step 2: Getting columns for each table...');
        const schema = {};

        for (const table of tables) {
            const tableName = table.TableName;
            
            try {
                const columnsQuery = `
                    SELECT 
                        [COLUMN_NAME] as ColumnName,
                        [DATA_TYPE] as DataType
                    FROM $SYSTEM.DBSCHEMA_COLUMNS
                    WHERE [TABLE_NAME] = '${tableName}'
                    ORDER BY [ORDINAL_POSITION]
                `;

                const columnsResponse = await axios.post(`${XMLA_PROXY_URL}/query`, {
                    query: columnsQuery
                });

                schema[tableName] = {
                    columns: columnsResponse.data.data
                };

                console.log(`  ✓ ${tableName}: ${columnsResponse.data.data.length} columns`);
            } catch (error) {
                console.log(`  ✗ ${tableName}: Failed to get columns - ${error.message}`);
            }
        }

        console.log();
        console.log('Step 3: Getting measures...');

        const measuresQuery = `
            SELECT 
                [MEASURE_NAME] as MeasureName,
                [MEASUREGROUP_NAME] as TableName
            FROM $SYSTEM.MDSCHEMA_MEASURES
        `;

        try {
            const measuresResponse = await axios.post(`${XMLA_PROXY_URL}/query`, {
                query: measuresQuery
            });

            const measures = measuresResponse.data.data;
            console.log(`✓ Found ${measures.length} measures`);

            // Group measures by table
            measures.forEach(measure => {
                const tableName = measure.TableName;
                if (schema[tableName]) {
                    if (!schema[tableName].measures) {
                        schema[tableName].measures = [];
                    }
                    schema[tableName].measures.push(measure.MeasureName);
                }
            });

        } catch (error) {
            console.log(`✗ Failed to get measures: ${error.message}`);
        }

        console.log();
        console.log('='.repeat(60));
        console.log('SCHEMA SUMMARY');
        console.log('='.repeat(60));
        console.log();

        Object.keys(schema).forEach(tableName => {
            console.log(`TABLE: '${tableName}'`);
            
            console.log(`  Columns (${schema[tableName].columns.length}):`);
            schema[tableName].columns.forEach(col => {
                console.log(`    - '${tableName}'[${col.ColumnName}] (${col.DataType})`);
            });

            if (schema[tableName].measures && schema[tableName].measures.length > 0) {
                console.log(`  Measures (${schema[tableName].measures.length}):`);
                schema[tableName].measures.forEach(measure => {
                    console.log(`    - [${measure}]`);
                });
            }

            console.log();
        });

        console.log('='.repeat(60));
        console.log('Saving schema to schema.json...');
        const fs = require('fs');
        fs.writeFileSync('schema.json', JSON.stringify(schema, null, 2));
        console.log('✓ Schema saved!');
        console.log();
        console.log('Next step: Update aiService.js to use this real schema');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Schema discovery failed');
        console.error(error.message);
        if (error.response?.data) {
            console.error('Details:', error.response.data);
        }
        process.exit(1);
    }
}

discoverSchema();
