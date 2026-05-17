'use strict';

const express = require('express');
const http = require('http');
const path = require('path');

/**
 * Creates and configures the Express server.
 * Uses Express 4.x for maximum stability and industry compatibility.
 */
function createServer(port) {
  const app = express();
  const publicPath = path.join(__dirname, '../dist');

  // 1. Security & Optimization: Middleware to handle common tasks
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // 2. Static Files: Serve the frontend build
  app.use(express.static(publicPath));

  // 3. SPA Routing: Fallback to index.html for any unknown routes
  // This ensures that refreshing the page on a sub-route doesn't 404.
  app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        // If index.html is missing, send a basic error
        res.status(404).send('Application build not found. Please run npm run build.');
      }
    });
  });

  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`[OK] Server running on port ${port}`);
    console.log(`[OK] Serving assets from: ${publicPath}`);
  });

  return server;
}

module.exports = { createServer };
