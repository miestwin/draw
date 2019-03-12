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

io.on('connection', (socket) => {
    console.log(`DEBUG: user ${socket.id} connected ${socket.handshake.query.room}`);

    // get board name
    const regex = /\/[a-zA-Z0-9]+/;
    const result = socket.handshake.query.room.match(regex);
    if (result == null) {
        return;
    }
    const board = result[0];

    socket.join(board, () => {
        console.log('DEBUG: JOIN TO ROOM', board);

        pool.connect((err, client, done) => {
            if (err) {
                throw err;
            }

            // get board from database
            // if not exist insert board
            // else emit paths to user

            client.query('SELECT * FROM boards LEFT JOIN paths on boards.name = paths.board WHERE boards.name = $1',[board], (err, result) => {
                if (err) {
                    done();
                    throw err;
                }

                if (result.rows.length === 0) {
                    // insert board
                    client.query('INSERT INTO boards (name, owner, changed_date) VALUES ($1, $2, $3)', [board, socket.id, new Date()], (err, result) => {
                        if (err) {
                            done();
                            throw err;
                        }
                        done();
                    });
                } else {
                    // emit data to client
                    socket.emit('init-board', result.rows);
                    done();
                }
            });
        });
    });

    socket.on('start-draw', (path, callback) => {
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

                client.query('SELECT MAX(idx) AS idx FROM paths where board = $1', ['board'], (err, res) => {
                    if (shouldAbort(err)) {
                        return;
                    }

                    let index = -1;
                    if (res.rows.length > 0 && res.rows[0].idx != null) {
                        index = res.rows[0].idx;
                    }

                    client.query('INSERT INTO paths (board, idx, json_string) VALUES ($1, $2, $3)', [board, index + 1, JSON.stringify(path)], (err, res) => {
                        if (shouldAbort(err)) {
                            return;
                        }

                        client.query('COMMIT', (err) => {
                            if (err) {
                                console.log('Error commiting transaction', err.stack);
                            }

                            callback(index + 1);
                            socket.to(board).emit('start-draw', (index + 1), path);
                            done();
                        });
                    })
                });
            });
        });
    });

    socket.on('update-draw', (index, point)  => {
        console.log(`UPDATE PATH WITH INDEX ${index}, POINT ${point}`);
        socket.to(board).emit('draw', index, point);
    });

    socket.on('end-draw', (index, path) => {
        // error during connection
        if (err) {
            throw err;
        }

        pool.connect((err, client, done) => {
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

                client.query('UPDATE paths SET json_string = $1 WHERE board = $2 and idx = $3', [JSON.stringify(path), board, index], (err, res) => {
                    if (shouldAbort(err)) {
                        return;
                    }

                    client.query('COMMIT', (err) => {
                        if (err) {
                            console.log('Error commiting transaction', err.stack);
                        }

                        socket.to(board).emit('end-draw', index);
                        done();
                    });
                });
            });
        });
    });

    socket.on('undo', (index) => {
        // undo
    });

    socket.on('redo', (index) => {
        socket.to(board).emit('redo', index);
    });

    socket.on('disconnect', () => {
        console.log(`user ${socket.id} disconnected`);
    });
});

http.listen(PORT, () => {
    console.log('Listening on *:' + PORT);
});

