#!/usr/bin/env node
const app = require('./index.js')
const { serveHTTP, publishToCentral } = require("stremio-addon-sdk");
const config = require('./config.js');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// create local server
const port = process.env.PORT || config.port;
const local = process.env.LOCAL_URL || config.local;

app.listen((port), function () {
    console.log(`Addon active on port ${port}`);
    console.log(`HTTP addon accessible at: ${local}/configure`);
});

if(process.env.NODE_ENV){
    publishToCentral(`${local}/manifest.json`).catch(err => {
        console.error('Failed to publish to central:', err);
    });
}
