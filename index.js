import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import { join as joinPath } from 'path';

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
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// routing
const nicknameRegex = /^[a-zA-Z0-9_-]+$/; // allows alphanumeric, underscore, and hyphen characters

app.get('/', (req, res) => {
    res.render('landing');
});

app.get('/chat', (req, res) => {
    const { nickname } = req.query;
    console.log('Received nickname:', nickname);
    if (!nickname || nickname.length < 5 || nickname.length > 20 || !nicknameRegex.test(nickname)) {
        return res.redirect('/');
    }
    console.log('Chat requested for nickname:', nickname);
    res.render('chat', { nickname });
});

app.use(function (req, res) {
    console.log("Serving file:", req.url);
    res.status(404).render('404');
});

server.listen(PORT, () => {
    console.log(`Server and socket.io listening on port ${PORT}`);
});
