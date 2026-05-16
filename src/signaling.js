'use strict';

const os = require('os');

function initSignaling(io) {
  io.sockets.on('connection', function(socket) {
    function log() {
      const array = ['Message from server:'];
      array.push.apply(array, arguments);
      socket.emit('log', array);
    }

    socket.on('message', function(message) {
      log('Client said: ', message);
      socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function(room) {
      log('Received request to create or join room ' + room);
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
        socket.emit('full', room);
      }
    });

    socket.on('ipaddr', function() {
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
      console.log('received bye');
    });
  });
}

module.exports = { initSignaling };
