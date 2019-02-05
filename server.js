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

// pool.query('INSERT INTO boards (name, owner, changed_date) VALUES ($1, $2, $3)', ['test12345678', 'admin', '2019-01-19'], (err, res) => {
//     if(err) {
//         throw err;
//     }

//     console.log(res.rows);
// });

io.on('connection', function(socket) {
    console.log(`user ${socket.id} connected`);
    console.log('room', socket.handshake.query.room);

    // pool.connect((err, client, done) => {
    //     if (err) {
    //         throw err;
    //     }

    //     client.query('SELECT * FROM boards', (err, res) => {
    //         done();

    //         if (err) {
    //             console.log(err.stack);
    //         } else {
    //             console.log(res.rows);
    //         }
    //     });
    // });

    socket.on('start-draw', function(path, callback) {
        path = JSON.parse(path);

        pool.connect((err, client, done) => {
            // error during connection
            if (err) {
                throw err;
            }

            // if error occurred during transaction, abort
            const shouldAbort = (err) => {
                if (err) {
                    console.error('Error in transaction', err.stack);
                    client.query('ROLLBACK', (err) => {
                        if (err) {
                            console.error('Error rolling back client', err.stack);
                        }
                        done();
                    });
                }
                return !!err;
            }

            client.query('BEGIN', (err) => {
                if (shouldAbort(err)) {
                    return;
                }

                client.query('SELECT MAX(idx) AS idx FROM paths where board = $1', ['board'], function(err, res) {
                    if (shouldAbort(err)) {
                        return;
                    }


                });
            });
        });
    });

    socket.on('draw', function(index, point) {
        console.log('DRAW', index, point);
    });

    socket.on('disconnect', function() {
        console.log(`user ${socket.id} disconnected`);
    });
});

http.listen(PORT, function() {
    console.log('Listening on *:' + PORT);
});

