const { createApp, ref } = Vue;
const socket = io({ query: { nickname } });
const recipient = ref('');
const newMessage = ref('');
const messages = ref([]);
const handshaked = ref([]);
let handshaking = [];
const ecc = new ECC(curveParams, privateKey);

// socket.io
socket.on('connect_error', (err) => {
    if (err.message === "Nickname already taken") {
        location.href = '/?error=Nickname%20already%20taken';
    }
});

const users = ref([]);
socket.on('users', (data) => {
    users.value = data.filter(user => user !== nickname); // exclude self
});

// Listen for incoming messages
msg = {}; // testing
socket.on('request', async (data) => {
    console.log('Received request:', data);
    msg = data;
    if (typeof data != 'object' || !data.type) return;
    if (data.sender && data.text){
        // TODO: validate/decrypt
        messages.value.push({ sender: data.sender, text: data.text });
    }

    if (data.type == 'RequestHandshake') {
        if (!data.to || !data.from || !data.publicKey) return; // inseficient handshake data
        if (data.to != nickname || !users.value.includes(data.from)) return; // invalid handshake data/not for me
        
        // TODO(in the future): add allow handshake request modal before accepting handshake

        if (!ecc.deriveSharedSecret(data.publicKey, data.to)) return; // could not derive shared key
        socket.emit('request', { type: 'HandshakeAccepted', publicKey: ecc.getPublicKey(), to: data.from, from: nickname });
        handshaking.push(data.from);
    }

    if (data.type == 'HandshakeAccepted') {
        if (!data.to || !data.from || !data.publicKey) return; // inseficient handshake data
        if (data.to != nickname || !users.value.includes(data.from) || !handshaking.includes(data.from)) return; // invalid handshake data/not for me

        if (!ecc.deriveSharedSecret(data.publicKey, data.to)) return;
        handshaked.value.push(data.from);
        handshaking = handshaking.filter(user => user != data.from); // remove from handshaking list
        console.log('Handshake established with:', data.from);
        socket.emit('request', { type: 'HandshakeComplete', to: data.from, from: nickname });
    }

    if (data.type == 'HandshakeComplete') {
        if (!data.to || !data.from) return; // inseficient handshake data
        if (data.to != nickname || !handshaking.includes(data.from)) return; // invalid handshake data/not for me

        handshaked.value.push(data.from);
        handshaking = handshaking.filter(user => user != data.from); // remove from handshaking list
        console.log('Handshake completed with:', data.from);
    }
});


// Handshake
function initializeHandshake() {
    console.log('Initializing handshake with:', recipient.value);
    socket.emit('request', { type: "RequestHandshake", to: recipient.value, from: nickname, publicKey: ecc.getPublicKey()});
    if (!handshaking.includes(recipient.value)) handshaking.push(recipient.value);
}


// UI

function sendMessage() {
    if (newMessage.value.trim() === '' || !recipient.value) return;
    socket.emit('message', { to: recipient.value, msg: newMessage.value.trim() });
    newMessage.value = '';
    messages.value.push({ sender: nickname, text: newMessage.value.trim() });
}

// mount Vue
const app = createApp({
    setup() {
        return {
            nickname,
            users,
            recipient,
            newMessage,
            sendMessage,
            messages,
            handshaked,
            initializeHandshake,
        };
    }
});

app.mount('body');