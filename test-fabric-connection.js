/**
 * Fabric Connection Diagnostic Tool
 * 
 * This script tests your Fabric connection through the .NET XMLA middleware.
 * Run: node test-fabric-connection.js
 * 
 * IMPORTANT: Start the .NET middleware first!
 *   cd xmla-proxy-dotnet
 *   dotnet run
 */

require('dotenv').config();
const axios = require('axios');

console.log('=' .repeat(60));
console.log('FABRIC CONNECTION DIAGNOSTIC TOOL');
console.log('=' .repeat(60));
console.log();

// Load configuration
const config = {
    xmlaProxyUrl: process.env.XMLA_PROXY_URL || 'http://localhost:5000'
};

// Check configuration
console.log('Configuration Check:');
console.log('  XMLA Proxy URL:', config.xmlaProxyUrl);
console.log();

async function runDiagnostics() {
    try {
        // Test 1: Check if XMLA proxy is running
        console.log('Step 1: Testing XMLA Proxy Connection...');
        console.log('-'.repeat(60));
        
        try {
            const healthResponse = await axios.get(`${config.xmlaProxyUrl}/health`, {
                timeout: 5000
            });
            
            console.log('✓ XMLA Proxy is running');
            console.log(`  Status: ${healthResponse.data.status}`);
            console.log(`  Message: ${healthResponse.data.message}`);
            console.log();
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.error('✗ XMLA Proxy is not running');
                console.error('  Start it with: cd xmla-proxy-dotnet && dotnet run');
                console.log();
                console.log('=' .repeat(60));
                console.log('DIAGNOSTIC FAILED - PROXY NOT RUNNING');
                console.log('=' .repeat(60));
                process.exit(1);
            } else {
                throw error;
            }
        }
        
        // Test 2: Test basic connection
        console.log('Step 2: Testing XMLA Connection...');
        console.log('-'.repeat(60));
        
        try {
            const testResponse = await axios.get(`${config.xmlaProxyUrl}/test`);
            
            console.log('✓ XMLA connection working');
            console.log(`  Status: ${testResponse.data.status}`);
            console.log(`  Message: ${testResponse.data.message}`);
            if (testResponse.data.testResult) {
                console.log(`  Test Result: ${JSON.stringify(testResponse.data.testResult[0])}`);
            }
            console.log();
        } catch (error) {
            console.error('✗ XMLA connection test failed');
            console.error(`  Error: ${error.response?.data?.error || error.message}`);
            console.log();
            console.log('Check xmla-proxy-dotnet/appsettings.json configuration:');
            console.log('  - TenantId, ClientId, ClientSecret');
            console.log('  - WorkspaceName (not ID!)');
            console.log('  - DatasetName (not ID!)');
            console.log();
        }
        
        // Test 3: Execute simple DAX query
        console.log('Step 3: Testing Simple DAX Query...');
        console.log('-'.repeat(60));
        
        const simpleQuery = 'EVALUATE { 1 }';
        console.log(`  Query: ${simpleQuery}`);
        
        try {
            const queryResponse = await axios.post(
                `${config.xmlaProxyUrl}/query`,
                { query: simpleQuery },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                }
            );

            console.log('✓ Successfully executed simple query');
            console.log(`  Result: ${JSON.stringify(queryResponse.data.data[0])}`);
            console.log();
        } catch (error) {
            console.error('✗ Failed to execute simple query');
            console.error(`  Error: ${error.response?.data?.error || error.message}`);
            console.log();
        }
        
        // Test 4: Execute realistic query
        console.log('Step 4: Testing Realistic DAX Query...');
        console.log('-'.repeat(60));
        
        const realisticQuery = `
EVALUATE
SUMMARIZECOLUMNS(
    products[Category],
    "Total Sales", SUM(sales[TotalAmount]),
    "Order Count", COUNTROWS(sales)
)`.trim();
        
        console.log(`  Query: ${realisticQuery.substring(0, 60)}...`);
        
        try {
            const queryResponse = await axios.post(
                `${config.xmlaProxyUrl}/query`,
                { query: realisticQuery },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000
                }
            );            console.log('✓ Successfully executed realistic query');
            console.log(`  Rows returned: ${queryResponse.data.data.length}`);
            console.log('  Sample data:');
            queryResponse.data.data.slice(0, 3).forEach((row, i) => {
                console.log(`    ${i + 1}. ${JSON.stringify(row)}`);
            });
            console.log();
        } catch (error) {
            console.error('✗ Failed to execute realistic query');
            console.error(`  Error: ${error.response?.data?.error || error.message}`);
            console.log();
            console.log('Possible issues:');
            console.log('  - Tables do not exist in semantic model');
            console.log('  - Run: node discover-schema.js to see actual schema');
            console.log('  - Check table/column names match your dataset');
            console.log();
        }
        
        console.log('=' .repeat(60));
        console.log('DIAGNOSTIC COMPLETE');
        console.log('=' .repeat(60));
        console.log();
        console.log('Next Steps:');
        console.log('1. If proxy not running: Start it with cd xmla-proxy-dotnet && dotnet run');
        console.log('2. If connection fails: Check service principal permissions in workspace');
        console.log('3. If query fails: Verify table/column names with node discover-schema.js');
        console.log('4. If all tests pass: Your configuration is working correctly!');
        console.log();
        
    } catch (error) {
        console.error('❌ Diagnostic failed unexpectedly');
        console.error(error.message);
        if (error.response?.data) {
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

runDiagnostics();
