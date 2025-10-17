const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server and socket.io listening on port ${PORT}`);
});