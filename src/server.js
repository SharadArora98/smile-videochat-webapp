'use strict';

const express = require('express');
const http = require('http');
const path = require('path');

function createServer(port) {
  const app = express();
  const publicPath = path.join(__dirname, '../dist');

  // Serve static files from the /dist directory
  app.use(express.static(publicPath));

  // Catch-all route for Single Page App (optional, but good practice)
  app.get('*', (req, res, next) => {
    // If it's not a static file, we can either 404 or serve index.html
    // For this app, let Express handle it.
    next();
  });

  const server = http.createServer(app);

  server.listen(port, () => {
    console.log('Server is listening on port ' + port);
    console.log('Serving static files from: ' + publicPath);
  });

  return server;
}

module.exports = { createServer };
