const express = require('express');
const socketIO = require('socket.io');

// Création de l'application Express
const app = express();
const port = 3000;

// Configuration du dossier public
app.use(express.static('public'));

// Routage pour l'index
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Démarrage du serveur HTTP
const server = app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

// Création de l'instance Socket.io
const io = socketIO(server);

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté');

  // Gestion de la déconnexion
  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté');
  });

  // Gestion de la connexion
  socket.on('login', (credentials) => {
    const { username, password } = credentials;

    // Vérification des identifiants 
    if (username === 'Tiavina' && password === '0000' ) {
      socket.emit('loginResponse', { success: true, username});
    } else {
      socket.emit('loginResponse', { success: false});
    }  
  });

  // Gestion de l'envoi de messages
  socket.on('sendMessage', (data) => {
    const { message } = data;
  
    io.emit('newMessage', message);
  });
  
  socket.on('privateMessage', (data) => {
    const { recipient, message } = data;
    const recipientSocket = findRecipientSocket(recipient);// Récupérez la socket du destinataire (par exemple, en utilisant une carte utilisateur/socket)
  
    if (recipientSocket) {
      recipientSocket.emit('newPrivateMessage', { sender: socket.id, message });
      socket.emit('newPrivateMessage', { recipient, message });
    }
  });
  
  // Écouter l'événement 'sendMessage' pour recevoir les messages
  socket.on('sendMessage', (data) => {
    const { recipient, message } = data;
    const recipientSocket = findRecipientSocket(recipient); // Récupérez la socket du destinataire (par exemple, en utilisant une carte utilisateur/socket)

    if (recipientSocket) {
      recipientSocket.emit('newMessage', message);

      // Envoyer une notification au destinataire
      recipientSocket.emit('newNotification', { message: 'Vous avez reçu un nouveau message.' });
    }
  });

  const roomParticipantsMap = new Map();

// Gestion de la demande de rejoindre une room
  socket.on('joinRoom', () => {
    socket.join('room1');
    const room = 'room1';

    // Ajouter l'utilisateur à la liste des participants de la room
    let participants = roomParticipantsMap.get(room) || [];
    participants.push(socket.id);
    roomParticipantsMap.set(room, participants);

    // Envoyer la liste des participants à tous les membres de la room
    io.to(room).emit('roomParticipants', participants);
  });

  // Gestion de la demande de quitter une room
  socket.on('leaveRoom', () => {
    socket.leave('room1');
    const room = 'room1';

    // Retirer l'utilisateur de la liste des participants de la room
    let participants = roomParticipantsMap.get(room) || [];
    participants = participants.filter((participant) => participant !== socket.id);
    roomParticipantsMap.set(room, participants);

    // Envoyer la liste des participants à tous les membres de la room
    io.to(room).emit('roomParticipants', participants);
  });
});


