const crypto = require("crypto");

function generateSecret() {
  return crypto.randomBytes(10).toString("hex");
}

function generateTOTP(secret) {
  const time = Math.floor(Date.now() / 30000); // 30-second window
  return crypto.createHmac("sha1", secret)
               .update(time.toString())
               .digest("hex")
               .slice(-6);
}

function verifyTOTP(secret, code) {
  return generateTOTP(secret) === code;
}

module.exports = { generateSecret, generateTOTP, verifyTOTP };

