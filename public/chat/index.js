const { createApp, ref } = Vue;
const socket = io({ query: { nickname } });

socket.on('connect_error', (err) => {
    if (err.message === "Nickname already taken") {
        location.href = '/?error=Nickname%20already%20taken';
    }
});


const users = ref([]);
socket.on('users', (data) => {
    users.value = data;
});





// mount Vue
const app = createApp({
    setup() {
        return {
            nickname,
            users,
        };
    }
});

app.mount('body');