const { createApp, ref } = Vue;
const socket = io({ query: { nickname } });
const recipient = ref('');
const newMessage = ref('');
const messages = ref([{sender: 'github', text: 'Hello!'}, {sender: 'hello', text: 'Hi there!'}]);

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
socket.on('message', (data) => {
    messages.value.push({ sender: data.sender, text: data.text });
    console.log('Received message:', data);
});

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
        };
    }
});

app.mount('body');