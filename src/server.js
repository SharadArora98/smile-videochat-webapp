'use strict';

const express = require('express');
const http = require('http');
const path = require('path');

function createServer(port) {
  const app = express();
  const publicPath = path.join(__dirname, '../dist');

  // Serve static files from the /dist directory
  app.use(express.static(publicPath));

  // Catch-all route for Single Page App (compatible with Express 5)
  // Express 5 requires parentheses for wildcards like (.*)
  app.get('(.*)', (req, res, next) => {
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
