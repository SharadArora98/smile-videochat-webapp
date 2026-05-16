'use strict';

const { Server } = require('socket.io');
const { createServer } = require('./src/server');
const { initSignaling } = require('./src/signaling');

const port = process.env.PORT || 8080;

// Initialize HTTP server and static file server
const app = createServer(port);

// Initialize Socket.io and attach signaling logic
const io = new Server(app);
initSignaling(io);
