import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import { join as joinPath } from 'path';
import { randomBytes } from 'crypto';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', joinPath(process.cwd(), 'views'));

// middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// socket.io
let connectedUsers = [];

io.use((socket, next) => { // middleware to get nickname from query
    const { nickname } = socket.handshake.query;
    if (!nickname) return next(new Error("No nickname found"));
    if (connectedUsers.includes(nickname)) return next(new Error("Nickname already taken"));
    socket.nickname = nickname;
    next();
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.nickname}`);
    connectedUsers.push(socket.nickname);
    io.emit('users', connectedUsers);

    socket.on('message', (msg) => {
        socket.broadcast.emit('message', { nickname: socket.nickname, msg });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.nickname}`); 
        connectedUsers = connectedUsers.filter(nickname => nickname !== socket.nickname);
        io.emit('users', connectedUsers);
    });
});

// routing
const nicknameRegex = /^[a-zA-Z0-9_-]+$/; // allows alphanumeric, underscore, and hyphen characters

app.get('/', (req, res) => {
    res.render('landing', { error: '' || req.query.error });
});


const userPrivateKeys = new Map(); // stores private keys for nicknames (saved on the server for consistancy during the session)
app.get('/chat', (req, res) => {
    const { nickname } = req.query;
    if (!nickname || nickname.length < 5 || nickname.length > 20 || !nicknameRegex.test(nickname)) {
        return res.redirect('/');
    }

    if (!userPrivateKeys.has(nickname)) {
        userPrivateKeys.set(nickname, BigInt('0x' + randomBytes(16).toString('hex')).toString());
    }

    const privateKey = userPrivateKeys.get(nickname);
    res.render('chat', { nickname, privateKey });
});

app.use(function (req, res) {
    res.status(404).render('404');
});

server.listen(PORT, () => {
    console.log(`Server and socket.io listening on port ${PORT}`);
});
