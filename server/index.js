const express = require("express");
const crypto = require("crypto");
const app = express();
const cors = require("cors");

const KEY = "84bedfa5-e04a-4852-9664-38cc9be14863";

function hmacSha256Hash(message) {
  return crypto.createHmac("sha256", KEY).update(message).digest();
}

function decryptData(cipherContent, key) {
  try {
    const arr = atob(cipherContent)
      .split("")
      .map((char) => char.charCodeAt(0));
    const [iv, encrypted, authTag] = [
      new Uint8Array(arr.slice(0, 16)),
      new Uint8Array(arr.slice(16, arr.length - 16)),
      new Uint8Array(arr.slice(arr.length - 16)),
    ];

    const decryptor = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decryptor.setAuthTag(authTag);
    const decryptedData = decryptor.update(encrypted);
    return Buffer.concat([decryptedData, decryptor.final()]);
  } catch (error) {
    console.error(error);
    return null;
  }
}

const verifySignature = (body, signature) => {
  const bodySha256Hash = hmacSha256Hash(JSON.stringify(body));
  const decryptedData = decryptData(signature, bodySha256Hash);

  if (!decryptedData) {
    return false;
  }
  return bodySha256Hash.equals(decryptedData);
};

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  const body = req.body;
  const signature = req.headers["x-signature"];
  if (!verifySignature(body, signature)) {
    return res.status(401).send("Invalid signature");
  }

  next();
});

app.post("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
