'use strict';

const os = require('os');

function initSignaling(io) {
  io.sockets.on('connection', function(socket) {
    let currentRoom = '';

    function log() {
      const array = ['Message from server:'];
      array.push.apply(array, arguments);
      socket.emit('log', array);
      // Also log to server console for production debugging
      console.log.apply(console, array);
    }

    socket.on('message', function(message) {
      if (!currentRoom) {
        console.warn('Received message from socket ' + socket.id + ' but they are not in a room.');
        return;
      }
      log('Client ' + socket.id + ' said: ', message);
      // Send to everyone in the room except the sender
      socket.to(currentRoom).emit('message', message);
    });

    socket.on('create or join', function(room) {
      if (!room || typeof room !== 'string') {
        socket.emit('error', 'Invalid room name');
        return;
      }

      log('Received request to create or join room ' + room);
      currentRoom = room;

      try {
        const clientsInRoom = io.sockets.adapter.rooms.get(room);
        const numClients = clientsInRoom ? clientsInRoom.size : 0;
        log('Room ' + room + ' now has ' + numClients + ' client(s)');

        if (numClients === 0) {
          socket.join(room);
          log('Client ID ' + socket.id + ' created room ' + room);
          socket.emit('created', room, socket.id);
        } else if (numClients === 1) {
          log('Client ID ' + socket.id + ' joined room ' + room);
          io.sockets.in(room).emit('join', room);
          socket.join(room);
          socket.emit('joined', room, socket.id);
          io.sockets.in(room).emit('ready');
        } else {
          // Room is full (max 2 for this simple p2p example)
          log('Room ' + room + ' is full. Rejecting client ' + socket.id);
          socket.emit('full', room);
        }
      } catch (e) {
        console.error('Error in create or join:', e);
        socket.emit('error', 'Internal server error during room join');
      }
    });

    socket.on('ipaddr', function() {
      // NOTE: In Docker/Cloud environments (like Render), this will return the 
      // container's internal IP, which may not be useful for the client.
      const ifaces = os.networkInterfaces();
      for (const dev in ifaces) {
        ifaces[dev].forEach(function(details) {
          if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
            socket.emit('ipaddr', details.address);
          }
        });
      }
    });

    socket.on('bye', function(){
      log('Client ' + socket.id + ' sent bye');
    });
    
    socket.on('disconnect', (reason) => {
       console.log('Socket ' + socket.id + ' disconnected. Reason: ' + reason);
    });

    // Handle unexpected socket errors
    socket.on('error', (err) => {
      console.error('Socket error for ' + socket.id + ':', err);
    });
  });
}

module.exports = { initSignaling };
