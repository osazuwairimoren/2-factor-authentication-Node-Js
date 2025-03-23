// server/server.js
const http = require("http");
const fs = require("fs");
const url = require("url");
const path = require("path");
const { generateSecret, generateTOTP, verifyTOTP } = require("./totp");

const databaseFile = "./server/database.json";

// Helper function to read the JSON "database"
function readDatabase() {
  if (!fs.existsSync(databaseFile)) return [];
  const data = fs.readFileSync(databaseFile, "utf8");
  return JSON.parse(data || "[]");
}

// Helper function to write to the "database"
function writeDatabase(users) {
  fs.writeFileSync(databaseFile, JSON.stringify(users, null, 2));
}

// Function to serve static files from the public folder
function serveStaticFile(filePath, res, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server error");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
}

function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;

  // For API endpoints, set JSON header
  if (req.url.startsWith("/api/")) {
    res.setHeader("Content-Type", "application/json");
  }

  // Registration endpoint: generate secret key and show it to the user
  if (req.url === "/api/register" && method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const { username, password } = JSON.parse(body);
      const users = readDatabase();

      if (users.some(user => user.username === username)) {
        res.end(JSON.stringify({ message: "User already exists." }));
        return;
      }

      const secret = generateSecret();
      users.push({ username, password, secret });
      writeDatabase(users);
      // Return secret key in the response for the user to store securely
      res.end(JSON.stringify({ 
        message: "Registration successful. Please store your secret key securely.", 
        secretKey: secret,
        redirect: "/success.html"
      }));
    });

  // Login endpoint: now requires secretKey along with username and password
} else if (req.url === "/api/login" && method === "POST") {
  let body = "";
  req.on("data", chunk => body += chunk);
  req.on("end", () => {
      const { username, password } = JSON.parse(body);
      const users = readDatabase();
      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
          // Login successful; require MFA (secret key is not checked here)
          res.end(JSON.stringify({ requiresMFA: true }));
      } else {
          res.end(JSON.stringify({ message: "Invalid login credentials." }));
      }
  });


  // Endpoint to get OTP using the secret key provided at login
} else if (req.url === "/api/get-otp" && method === "POST") {
  let body = "";
  req.on("data", chunk => body += chunk);
  req.on("end", () => {
    const { username, secretKey } = JSON.parse(body);
    const users = readDatabase();
    const user = users.find(u => u.username === username);
    // Convert both keys to lowercase and trim whitespace before comparison
    if (user && user.secret && user.secret.trim().toLowerCase() === secretKey.trim().toLowerCase()) {
      const otp = generateTOTP(secretKey);
      res.end(JSON.stringify({ otp }));
    } else {
      res.end(JSON.stringify({ message: "User not found or secret key mismatch." }));
    }
  });


  } else if (req.url === "/api/verify-totp" && method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const { username, code, secretKey } = JSON.parse(body);
      const users = readDatabase();
      const user = users.find(u => u.username === username);
      if (user && user.secret === secretKey && verifyTOTP(secretKey, code)) {
        res.end(JSON.stringify({ message: "Login successful.", redirect: "/success.html" }));
      } else {
        res.end(JSON.stringify({ message: "Invalid code or secret key." }));
      }
    });

  // Serve static files
  } else if (method === "GET") {
    let filePath = "./public" + parsedUrl.pathname;
    if (parsedUrl.pathname === "/") {
      filePath = "./public/index.html";
    }
    const extname = path.extname(filePath);
    let contentType = "text/html";
    if (extname === ".css") contentType = "text/css";
    if (extname === ".js") contentType = "text/javascript";
    serveStaticFile(filePath, res, contentType);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
}

const server = http.createServer(handleRequest);
server.listen(5000, () => {
  console.log("Server running on port 5000");
});
