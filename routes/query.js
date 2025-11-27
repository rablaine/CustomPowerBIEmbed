const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const fabricService = require('../services/fabricService');

// POST /api/query - Process natural language query
router.post('/', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ 
                message: 'Query is required and must be a string' 
            });
        }

        console.log('Received query:', query);

        // Step 1: Parse query using AI Foundry (generates DAX)
        const parsedQuery = await aiService.parseQuery(query);
        console.log('Generated DAX:', parsedQuery.sqlQuery);

        // Step 2: Execute DAX query against Fabric
        const fabricResult = await fabricService.executeQuery(parsedQuery.sqlQuery);
        console.log('Retrieved data rows:', fabricResult.data.length);
        console.log('Data source:', fabricResult.isMockData ? 'MOCK DATA' : 'LIVE FABRIC');

        // Step 3: Get AI interpretation and visualization suggestion
        const interpretation = await aiService.interpretResults(query, fabricResult.data);

        // Step 4: Return complete result
        const result = {
            originalQuery: query,
            daxQuery: parsedQuery.sqlQuery,
            sqlQuery: parsedQuery.sqlQuery, // Keep for backward compatibility
            interpretation: interpretation.summary,
            suggestedChartType: interpretation.chartType,
            title: interpretation.title,
            data: fabricResult.data,
            isMockData: fabricResult.isMockData,
            dataSource: fabricResult.isMockData ? 'Mock Data' : 'Live Microsoft Fabric',
            debug: {
                parseQuery: parsedQuery.debug || null,
                interpretation: interpretation.debug || null
            }
        };

        res.json(result);

    } catch (error) {
        console.error('Query processing error:', error);
        res.status(500).json({ 
            message: error.message || 'Failed to process query',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
