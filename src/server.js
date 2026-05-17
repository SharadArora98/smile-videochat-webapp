'use strict';

const http = require('http');
const nodeStatic = require('node-static');
const path = require('path');

function createServer(port) {
  const publicPath = path.join(__dirname, '../dist');
  const fileServer = new nodeStatic.Server(publicPath);
  
  const app = http.createServer(function(req, res) {
    fileServer.serve(req, res, function (err, result) {
      if (err) {
        console.error('Error serving ' + req.url + ' - ' + err.message);
        if (!res.headersSent) {
          res.writeHead(err.status, err.headers);
          res.end();
        }
      }
    });
  });

  app.listen(port, () => {
    console.log('Server is listening on port ' + port);
  });

  return app;
}

module.exports = { createServer };
