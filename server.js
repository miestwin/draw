require('dotenv').config();

const PORT = process.env.PORT || 8000;

const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));

// const { CLient } = require('pg');
// const client = new CLient();

// await client.conect();

app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

io.on('connection', function(socket) {
    console.log(`user ${socket.id} connected`);

    

    socket.on('disconnect', function() {
        console.log(`user ${socket.id} disconnected`);
    })
});

http.listen(PORT, function() {
    console.log('Listening on *:' + PORT);
});

