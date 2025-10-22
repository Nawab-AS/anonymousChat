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
socket.on('request', async (data) => {
    //console.log('Received request:', data);
    if (typeof data != 'object' || !data.type) return;

    // handle incoming messages
    if (data.type === 'message'){
        if (!data.from || !data.to || !data.text) return; // invalid message
        if (data.to !== nickname || !handshaked.value.includes(data.from)) return; // not for me/handshake not established

        const message = await ecc.decryptMessage(data.text, data.from);
        if (message.status != "OK") return; // decryption error
        messages.value.push({ from: data.from, to: data.to, text: message.decryptedText });
    }


    // register handshake requests
    if (data.type == 'RequestHandshake') {
        if (!data.to || !data.from || !data.publicKey) return; // inseficient handshake data
        if (data.to != nickname || !users.value.includes(data.from)) return; // invalid handshake data/not for me
        
        // TODO(in the future): add allow handshake request modal before accepting handshake

        if (!ecc.deriveSharedSecret(data.publicKey, data.from)) return; // could not derive shared key
        socket.emit('request', { type: 'HandshakeAccepted', publicKey: ecc.getPublicKey(), to: data.from, from: nickname });
        handshaking.push(data.from);
    }

    if (data.type == 'HandshakeAccepted') {
        if (!data.to || !data.from || !data.publicKey) return; // inseficient handshake data
        if (data.to != nickname || !users.value.includes(data.from) || !handshaking.includes(data.from)) return; // invalid handshake data/not for me

        if (!ecc.deriveSharedSecret(data.publicKey, data.from)) return;
        setTimeout(() => { // intentional delay for more appealing UI
            handshaked.value.push(data.from);
            handshaking = handshaking.filter(user => user != data.from); // remove from handshaking list
            console.log('Handshake established with:', data.from);
        }, 750);
        socket.emit('request', { type: 'HandshakeComplete', to: data.from, from: nickname });
    }

    if (data.type == 'HandshakeComplete') {
        if (!data.to || !data.from) return; // inseficient handshake data
        if (data.to != nickname || !handshaking.includes(data.from)) return; // invalid handshake data/not for me

        setTimeout(() => { // intentional delay for more appealing UI
            handshaked.value.push(data.from);
            handshaking = handshaking.filter(user => user != data.from); // remove from handshaking list
            console.log('Handshake completed with:', data.from);
        }, 750);
    }
});


// Handshake
function initializeHandshake() {
    console.log('Initializing handshake with:', recipient.value);
    socket.emit('request', { type: "RequestHandshake", to: recipient.value, from: nickname, publicKey: ecc.getPublicKey()});
    if (!handshaking.includes(recipient.value)) handshaking.push(recipient.value);
}


// Send Message
async function sendMessage() {
    if (newMessage.value.trim() == '' || !recipient.value || !handshaked.value.includes(recipient.value)) return;
    const message = { type: 'message', to: recipient.value, from: nickname, text: newMessage.value.trim() };
    socket.emit('request', { type: 'message', to: message.to, from: message.from, text: await ecc.encryptMessage(message.text, recipient.value) });
    newMessage.value = '';
    messages.value.push(message);
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