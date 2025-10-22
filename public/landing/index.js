const { createApp, ref, computed } = Vue;

const nickname = ref('');

const joining = ref(0);
const dots = ref('');
const nicknameRegex = /^[a-zA-Z0-9_-]+$/; // allows alphanumeric, underscore, and hyphen characters

async function join() {
    if (profanityCleaner.isProfane(nickname.value)) {
        return alert("Please avoid using profane words in your nickname.");
    }
    if (joining.value !== 0) return;
    if (nickname.value.length < 5 || nickname.value.length > 20) {
        return alert("Nickname must be between 5 and 20 characters.");
    }
    if (!nicknameRegex.test(nickname.value)) {
        return alert("Nickname can only contain alphanumeric characters, underscores, and hyphens.");
    }

    // simulate loading
    joining.value = Date.now();
    setInterval(() => {
        dots.value = '.'.repeat(Math.floor((Date.now() - joining.value) / 750) % 4);
    }, 750);

    // load after between 1-2 seconds
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000));
    location.href = `/chat?nickname=${encodeURIComponent(nickname.value)}`;
}


const validNickname = computed(() => {
    return (nickname.value.length >= 5 && nickname.value.length <= 20) && !profanityCleaner.isProfane(nickname.value);
});



// mount Vue
const app = createApp({
    setup() {
        return {
            nickname,
            join,
            dots,
            joining,
            webCryptoAllowed: (typeof window.crypto.subtle != 'undefined'),
        };
    }
});

app.mount('body');