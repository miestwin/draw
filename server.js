require('dotenv').config();

const PORT = process.env.PORT || 8000;

const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

pool.on('error', (err, client) => {
    console.log('Unexpected error on idle client', err);
});

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

