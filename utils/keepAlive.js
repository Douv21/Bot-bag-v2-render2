const express = require('express');
const PORT = process.env.PORT || 3000;

module.exports = () => {
    const app = express();

    app.get('/', (_, res) => {
        res.json({
            status: 'online',
            timestamp: new Date().toISOString(),
            environment: 'render'
        });
    });

    app.get('/health', (_, res) => {
        res.json({
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Keep-alive sur le port ${PORT}`);
    });
};
