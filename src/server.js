'use strict';

const http = require('http');
const nodeStatic = require('node-static');
const path = require('path');

function createServer(port) {
  const publicPath = path.join(__dirname, '../dist');
  const fileServer = new nodeStatic.Server(publicPath);
  
  const app = http.createServer(function(req, res) {
    fileServer.serve(req, res);
  });

  app.listen(port, () => {
    console.log('Server is listening on port ' + port);
  });

  return app;
}

module.exports = { createServer };
