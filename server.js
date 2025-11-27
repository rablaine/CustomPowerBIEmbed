require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const queryRoutes = require('./routes/query');
const schemaRoutes = require('./routes/schema');
const fabricService = require('./services/fabricService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/query', queryRoutes);
app.use('/api/schema', schemaRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Discover schema on startup (async, non-blocking)
async function initializeSchema() {
    console.log('\n========================================');
    console.log('Initializing schema discovery...');
    console.log('========================================');
    
    try {
        const schema = await fabricService.discoverSchema();
        if (schema && schema.tables) {
            const tableNames = Object.keys(schema.tables);
            console.log(`✓ Schema discovered successfully`);
            console.log(`  Tables: ${tableNames.join(', ')}`);
            console.log(`  Discovered at: ${schema.discoveredAt}`);
        } else {
            console.log('⚠ Schema discovery returned no results - will use default schema');
        }
    } catch (error) {
        console.error('⚠ Schema discovery failed on startup:', error.message);
        console.log('  App will use default schema and retry on first query');
    }
    
    console.log('========================================\n');
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Discover schema after server starts (non-blocking)
    initializeSchema().catch(err => {
        console.error('Schema initialization error:', err);
    });
});

module.exports = app;
