// ECC (Elliptic Curve Cryptography) implementation
// partially made with the help of AI


class ECC {
    #privateKey;
    #keyRing = {};

    constructor(curveParams, privateKey) {
        /* curve params:
        p: modulus prime number
        a, b: curve coefficients (y^2 = x^3 + ax + b)
        G: base/generator point
        n: order of the base point
        */

        this.POINT_AT_INFINITY = { x: Infinity, y: Infinity };
        this.curveParams = curveParams;
        this.#privateKey = BigInt(privateKey);
    }



    #modInverse(a, m) {
        // a is the number to find the inverse of
        // m is the prime modulus

        // uses the extended euclidean algorithm (I have no idea how this works)

        let [x, y, remainder, prev_remainder] = [0n, 1n, m, a];
        let [prev_x, prev_y] = [1n, 0n];

        while (remainder != 0n) {
            const quotient = prev_remainder / remainder;
            [remainder, prev_remainder] = [prev_remainder % remainder, remainder]; // update the remainder and prev_remainder
            [prev_x, x] = [x, prev_x - quotient * x]; // update the coefficients for a
            [prev_y, y] = [y, prev_y - quotient * y]; // update the coefficients for m
        }

        return (prev_x + m) % m; // positive result
    }


    #addPoints(P1, P2) {
        if (P1.x == Infinity) return P2;
        if (P2.x == Infinity) return P1;

        let slope;
        let numerator;
        let denominator;

        if (P1.x === P2.x && P1.y === P2.y) { // Point doubling (P1 + P1)
            if (P1.y === 0n) return this.POINT_AT_INFINITY; // tangent is vertical, hence slope is infinite

            // slope of tangent = (3x^2 + a) / (2y) mod p
            numerator = (3n * P1.x ** 2n + this.curveParams.a);
            denominator = (2n * P1.y);


        } else { // Point addition (P1 + P2)
            if (P1.x == P2.x) return this.POINT_AT_INFINITY; // change in x = 0, hence slope is infinite

            // slope of a simple line: (P2.y - P1.y) / (P2.x - P1.x) mod p
            numerator = P2.y - P1.y;
            denominator = P2.x - P1.x;
        }

        slope = numerator * this.#modInverse(denominator, this.curveParams.p);
        slope = (slope + this.curveParams.p) % this.curveParams.p; // ensure slope is positive


        // calculate resultant point R (P1 + P2)
        let R = {};
        R.x = (slope ** 2n - P1.x - P2.x) % this.curveParams.p; // (s^2 - P1.x - P2.x) mod p
        R.y = (slope * (P1.x - R.x) - P1.y) % this.curveParams.p; // (s(P1.x - R.x) - P1.y) mod p

        // wrap R across the finite field of [0, p-1]
        R.x = (R.x + this.curveParams.p) % this.curveParams.p;
        R.y = (R.y + this.curveParams.p) % this.curveParams.p;

        return R;
    }

    #scalarMultiply(scalar, point) {
        let result = this.POINT_AT_INFINITY;
        let addend = point;

        while (scalar > 0n) {
            if (scalar & 1n) { // '&' is the bitwise AND
                result = this.#addPoints(result, addend);
            }
            addend = this.#addPoints(addend, addend); // double the point
            scalar >>= 1n; // '>>=' is the right shift assignment operator (divides by 2)
        }

        return result;
    }


    async #saveAESKey(name, sharedKey) {
        const sharedKeyHex = sharedKey.x.toString(16).padStart(16, '0'); // Convert to hexadecimal
        const sharedBytes = new Uint8Array(16);

        // convert to Uint8Array
        for (let i = 0; i < 16; i++) {
            sharedBytes[i] = parseInt(sharedKeyHex.slice(i * 2, i * 2 + 2), 16);
        }

        // create AES-128 hash
        const hashBuffer = (await window.crypto.subtle.digest('SHA-256', sharedBytes)).slice(0, 16);

        const AES_Key = await window.crypto.subtle.importKey(
            'raw', 
            hashBuffer,
            { name: "AES-GCM", length: 128 },
            false,
            ["encrypt", "decrypt"]
        );

        this.#keyRing[name] = AES_Key;
    }


    getPublicKey() {
        const publicKey = this.#scalarMultiply(this.#privateKey, this.curveParams.G);
        return { x: publicKey.x.toString(), y: publicKey.y.toString() }
    }

    deriveSharedSecret(otherPublicKey, name) {
        otherPublicKey = { x: BigInt(otherPublicKey.x), y: BigInt(otherPublicKey.y) };
        let sharedKey;
        try {
            sharedKey = this.#scalarMultiply(this.#privateKey, otherPublicKey);
        } catch (error) {
            return false
        }
        this.#saveAESKey(name, sharedKey);
        return true;
    }

    async encryptMessage(plaintext, name) {
        const sharedKey = this.#keyRing[name];
        if (!sharedKey) throw new Error("Shared key not found");

        const iv = crypto.getRandomValues(new Uint8Array(16));
        const encodedText = new TextEncoder().encode(plaintext);

        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            sharedKey,
            encodedText
        );

        console.log("encrypted message:", encryptedBuffer, "\n\niv:", iv);
        return { buffer: encryptedBuffer, iv };
    }


    async decryptMessage(encryptedMessage, name) {
        const sharedKey = this.#keyRing[name];
        if (!sharedKey) throw new Error("Shared key not found");

        if (!encryptedMessage) return;

        try {
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: encryptedMessage.iv },
                sharedKey,
                encryptedMessage.buffer
            );
            return { status: "OK", decryptedText: (new TextDecoder().decode(decryptedBuffer))};
        } catch (error) {
            return { status: "ERROR", error };
        }
    }
}