const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabricService');

// GET /api/schema - Retrieve database schema
router.get('/', async (req, res) => {
    try {
        console.log('Fetching database schema from Fabric...');
        
        const schema = await fabricService.getSchema();
        
        if (!schema) {
            return res.status(404).json({
                message: 'Unable to retrieve schema. Check Fabric connection.',
                usingMockData: true
            });
        }

        res.json({
            schema: schema.text,
            tables: Object.keys(schema.tables),
            tableDetails: schema.tables,
            cached: false,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Schema retrieval error:', error);
        res.status(500).json({
            message: error.message || 'Failed to retrieve schema',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET /api/schema/refresh - Force refresh schema cache
router.post('/refresh', async (req, res) => {
    try {
        const aiService = require('../services/aiService');
        
        // Clear cache
        aiService.cachedSchema = null;
        aiService.schemaLoadTime = null;
        
        // Load fresh schema
        const schema = await fabricService.getSchema();
        
        if (!schema) {
            return res.status(404).json({
                message: 'Unable to refresh schema. Check Fabric connection.'
            });
        }

        // Update cache
        aiService.cachedSchema = schema.text;
        aiService.schemaLoadTime = Date.now();

        res.json({
            message: 'Schema cache refreshed successfully',
            schema: schema.text,
            tables: Object.keys(schema.tables),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Schema refresh error:', error);
        res.status(500).json({
            message: error.message || 'Failed to refresh schema'
        });
    }
});

module.exports = router;
