const { createApp, ref } = Vue;
const socket = io({ query: { nickname } });
const recipient = ref('');

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



// UI

function selectUser(user) {
    recipient.value = user;
}


// mount Vue
const app = createApp({
    setup() {
        return {
            nickname,
            users,
            selectUser,
            recipient,
        };
    }
});

app.mount('body');