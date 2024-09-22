import axios from "axios";
import "./App.css";
const KEY = "84bedfa5-e04a-4852-9664-38cc9be14863";

async function hmacSha1Hash(message: string) {
  // Convert the key and message to ArrayBuffers
  const encoder = new TextEncoder();
  const keyData = encoder.encode(KEY);
  const messageData = encoder.encode(message);

  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    "raw", // Format of the key
    keyData, // The key data
    { name: "HMAC", hash: "SHA-256" }, // HMAC algorithm with SHA-1
    false, // Key is not extractable
    ["sign"] // Key can be used for signing
  );

  // Sign the message using the key
  const signature = await crypto.subtle.sign(
    "HMAC", // Algorithm identifier
    cryptoKey, // The imported key
    messageData // Data to sign
  );

  // Convert the signature to a hex string
  return new Uint8Array(signature);
}

async function encryptData(key: Uint8Array, payload: Uint8Array) {
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    key, // The raw key material
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // Extractable
    ["encrypt", "decrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(16));

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      length: 256,
      iv: iv, // Initialization vector
    },
    cryptoKey, // The AES-GCM key
    payload // Data to encrypt (ArrayBuffer or TypedArray)
  );

  const encryptedDataArray = new Uint8Array(encryptedData);
  const result = [...iv, ...encryptedDataArray];
  return btoa(result.map((b) => String.fromCharCode(b)).join(""));
}

function App() {
  const computeSignature = async (body: unknown) => {
    const hash = await hmacSha1Hash(JSON.stringify(body));
    console.log(hash);
    return encryptData(hash, hash);
  };
  const onClick = async () => {
    const body = {
      data: "Hello World",
    };
    const signature = await computeSignature(body);
    const result = await axios.post("http://localhost:5001/", body, {
      headers: {
        "x-signature": signature,
      },
    });

    console.log(result.data);
  };

  return (
    <>
      <button onClick={onClick}>Click Me</button>
    </>
  );
}

export default App;
