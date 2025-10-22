import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import { join as joinPath } from 'path';
import { randomBytes } from 'crypto';
import { config } from 'dotenv';
config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const curveParams = (()=>{
    let params = process.env.curveParams || '{}';
    if (params == '{}') {
        console.warn("No curve parameters found in environment variables, defaulting to X25519");
        return `{"p": "57896044618658097711785492504343953926634992332820282019728792003956564819949n","a": "486662n","b": "1n","G": { "x": "9n", "y": "14781619447589544791020593568409986887264606134616475288964881837755586237401n" },"n": "7237005577332262213973186563042994240857116359379907606001950938285454250989n"}`
    }
    return params;
})();

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

    socket.on('request', (msg) => {
        socket.broadcast.emit('request', msg);
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
    res.render('chat', { nickname, privateKey, curveParams: encodeURIComponent(curveParams) });
});

app.use(function (req, res) {
    res.status(404).render('404');
});

server.listen(PORT, () => {
    console.log(`Server and socket.io listening on port ${PORT}`);
});
