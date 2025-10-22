# Anonymous Chat

An omegle style anonymous chat app that uses a PoC ECC key transfer.
All messages are end-to-end encrypted using my own implementation of ECDH (Elliptic Curve Diffie-Hellman) for key transfer and AES-128 (Advanced Encrypted Standard with 128-bit keys).

**Acknowledgement**: /public/chat/ecc.js was partially created with the help of AI.
All other files are handmade (~90%)


## Live Demo

Live demo coming soon...


## Installation 

1. Install this repository through git by
```
git clone https://github.com/Nawab-AS/anonymousChat.git
cd ./anonymousChat
```

2. install node modules by
```
npm i
```


## Usage

Run the server with ```npm run start```, this will create a http running on port 3000

Optionally, you can specify the port number and/or ECC curve values in the `.env` file:
```.env
PORT=8080
curveParams=<curve params>
```
Before changeing the curve params, please read how to change the ECC curve [here](#Changing-the-ECC-curve)


## Screenshots

### Initialize handshake

![initialize_handshake.png](https://github.com/user-attachments/assets/fe653c11-d3ab-4c2c-bfd9-e9c29f04022d)

### Users chatting
![users_chating.png](https://github.com/user-attachments/assets/5d4a5d11-a4c3-4ae4-aa98-b2de1c246b31)

## Changing the ECC curve

A valid ECC curve must contain the folowing:
- p: modulus prime number (bigInt)
- a: curve coefficient #1 (bigInt)
- b: curve coefficient #2 (bigInt)
- G: base/generator point (Object)
    - x: x position of generator point (bigInt)
    - y: y position of generator point (bigInt)
- n: order of the base point (bigInt)

> [!CAUTION]
> Use a proper, well researched curve as they are tested to be more efficient and stronger against attacks
> (obviously not much of a concern for a small web app but still...)

The values of the curve must be formatted into a single line JSON object and be put in the `.env` file
as shown [here](#Usage).


## Tech Stack

Backend: express.js + socket.io

render engine: EJS + client-side Vue.js


## Contributing
Contributions and bug reports are welcome. Open a PR or issue in the repository. Keep changes small and documented.
