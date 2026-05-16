'use strict';

import { io } from 'socket.io-client';
import 'webrtc-adapter';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/main.css';

// State Variables
let isInitiator = false;
let isStarted = false;
let isChannelReady = false;
let localStream;
let pc;
let dataChannel;
let room = '';
let remoteMessagesQueue = []; // Queue for messages that arrive before PC is ready

const socket = io();

// UI Elements
const roomEntry = document.querySelector('#room-entry');
const mainApp = document.querySelector('#main-app');
const roomInput = document.querySelector('#roomInput');
const joinBtn = document.querySelector('#joinBtn');
const roomDisplayName = document.querySelector('#roomDisplayName');
const chatMessages = document.querySelector('#chat-messages');
const chatInput = document.querySelector('#chatInput');
const sendBtn = document.querySelector('#sendBtn');
const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');
const hangupBtn = document.querySelector('#hangupBtn');
const muteAudioBtn = document.querySelector('#muteAudioBtn');
const stopVideoBtn = document.querySelector('#stopVideoBtn');

// WebRTC Config
const pcConfig = {
  'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }]
};

/////////////////////////////////////////////
// Room Entry Logic
/////////////////////////////////////////////

joinBtn.onclick = () => {
  room = roomInput.value.trim();
  if (room !== '') {
    socket.emit('create or join', room);
    console.log('Attempted to create or join room', room);
  }
};

roomInput.onkeypress = (e) => {
  if (e.key === 'Enter') joinBtn.click();
};

socket.on('created', (roomName) => {
  console.log('Created room ' + roomName);
  isInitiator = true;
  showMainApp(roomName);
});

socket.on('joined', (roomName) => {
  console.log('Joined room ' + roomName);
  isChannelReady = true;
  showMainApp(roomName);
});

socket.on('join', (roomName) => {
  console.log('Another peer joined room ' + roomName);
  isChannelReady = true;
  maybeStart();
});

socket.on('full', (roomName) => {
  alert('Room ' + roomName + ' is full');
});

function showMainApp(roomName) {
  roomEntry.classList.add('d-none');
  mainApp.classList.remove('d-none');
  roomDisplayName.textContent = `| Room: ${roomName}`;
  startMedia();
}

/////////////////////////////////////////////
// Media Logic
/////////////////////////////////////////////

async function startMedia() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    console.log('Adding local stream.');
    localStream = stream;
    localVideo.srcObject = stream;
    sendMessage('got user media');
    maybeStart(); // Try starting whenever media is ready
  } catch (e) {
    alert('getUserMedia() error: ' + e.name);
  }
}

/////////////////////////////////////////////
// Signaling Logic
/////////////////////////////////////////////

function sendMessage(message) {
  socket.emit('message', message);
}

socket.on('message', (message) => {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type || message === 'bye') {
    if (isStarted && pc) {
      processSignalingMessage(message);
    } else {
      console.log('Queuing signaling message until PC is started');
      remoteMessagesQueue.push(message);
      maybeStart(); // Try starting if we have a message waiting
    }
  }
});

function maybeStart() {
  console.log('maybeStart() check:', { isStarted, hasMedia: !!localStream, isChannelReady });
  if (!isStarted && localStream && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    isStarted = true;
    
    if (isInitiator) {
      setupDataChannel();
      doCall();
    }

    // Process any queued messages
    while (remoteMessagesQueue.length > 0) {
      processSignalingMessage(remoteMessagesQueue.shift());
    }
  }
}

function processSignalingMessage(message) {
  if (message.type === 'offer') {
    pc.setRemoteDescription(new RTCSessionDescription(message))
      .then(() => doAnswer())
      .catch(e => console.error('Error handling offer:', e));
  } else if (message.type === 'answer') {
    pc.setRemoteDescription(new RTCSessionDescription(message))
      .catch(e => console.error('Error handling answer:', e));
  } else if (message.type === 'candidate') {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate)
      .catch(e => console.error('Error adding ice candidate:', e));
  } else if (message === 'bye') {
    handleRemoteHangup();
  }
}

/////////////////////////////////////////////
// Peer Connection & Data Channel
/////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      }
    };
    pc.ontrack = (event) => {
      console.log('Remote stream added.');
      remoteVideo.srcObject = event.streams[0];
    };
    
    pc.ondatachannel = (event) => {
      console.log('Receive Channel Callback');
      dataChannel = event.channel;
      setupDataChannelEvents();
    };

  } catch (e) {
    alert('Cannot create RTCPeerConnection object.');
  }
}

function setupDataChannel() {
  console.log('Creating Data Channel');
  dataChannel = pc.createDataChannel('chat');
  setupDataChannelEvents();
}

function setupDataChannelEvents() {
  dataChannel.onopen = () => {
    console.log('Data Channel is Open');
    appendMessage('Chat connected!', 'system');
  };
  dataChannel.onclose = () => console.log('Data Channel is Closed');
  dataChannel.onmessage = (event) => {
    appendMessage(event.data, 'received');
  };
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer()
    .then(setLocalAndSendMessage)
    .catch(e => console.error('createOffer error:', e));
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer()
    .then(setLocalAndSendMessage)
    .catch(e => console.error('createAnswer error:', e));
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

/////////////////////////////////////////////
// Chat UI Logic
/////////////////////////////////////////////

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (text !== '' && dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(text);
    appendMessage(text, 'sent');
    chatInput.value = '';
  }
}

function appendMessage(text, type) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;
  if (type === 'system') {
    msgDiv.innerHTML = `<span style="font-size: 0.8rem; opacity: 0.6; text-align: center; width: 100%; display: block;">${text}</span>`;
  } else {
    msgDiv.innerHTML = `<span class="sender">${type === 'sent' ? 'You' : 'Peer'}</span>${text}`;
  }
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.onclick = sendChatMessage;
chatInput.onkeypress = (e) => {
  if (e.key === 'Enter') sendChatMessage();
};

/////////////////////////////////////////////
// Media Controls & Hangup
/////////////////////////////////////////////

muteAudioBtn.onclick = () => {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  muteAudioBtn.innerHTML = audioTrack.enabled ? '<i class="bi bi-mic"></i>' : '<i class="bi bi-mic-mute"></i>';
  muteAudioBtn.classList.toggle('btn-outline-danger', !audioTrack.enabled);
};

stopVideoBtn.onclick = () => {
  if (!localStream) return;
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
  stopVideoBtn.innerHTML = videoTrack.enabled ? '<i class="bi bi-camera-video"></i>' : '<i class="bi bi-camera-video-off"></i>';
  stopVideoBtn.classList.toggle('btn-outline-danger', !videoTrack.enabled);
};

hangupBtn.onclick = () => {
  sendMessage('bye');
  location.reload();
};

window.onbeforeunload = () => {
  sendMessage('bye');
};

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
  alert('Peer has left the call.');
  location.reload();
}

function stop() {
  isStarted = false;
  if (pc) pc.close();
  pc = null;
}
