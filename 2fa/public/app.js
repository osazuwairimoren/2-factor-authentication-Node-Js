// Helper functions for error messages
function showError(message) {
  const errorContainer = document.getElementById("message");
  const errorText = document.getElementById("errorText");
  if (errorContainer && errorText) {
    errorText.innerText = message;
    errorContainer.style.display = "flex";
  }
}

function closeError() {
  const errorContainer = document.getElementById("message");
  if (errorContainer) {
    errorContainer.style.display = "none";
  }
}

// Registration function
async function register() {
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  
  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  document.getElementById("message").style.display = "flex";
  document.getElementById("errorText").innerText = data.message;
  
  if (data.secretKey) {
    document.getElementById("secretKeyText").innerText = data.secretKey;
    document.getElementById("secretDisplay").style.display = "block";
  }
  
  if (data.redirect) {
    setTimeout(() => window.location.href = data.redirect, 3000);
  }
}

// Confirm registration: user has stored secret key, then redirect to login
function confirmSecret() {
  window.location.href = "/login.html";
}

// Login function (username and password only)
async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  if (data.message) {
    showError(data.message);
  } else {
    closeError();
  }
  
  if (data.requiresMFA) {
    localStorage.setItem("username", username);
    window.location.href = "/getotp.html";
  }
}

// OTP verification function
async function verifyOTP() {
  const username = localStorage.getItem("username");
  const secretKey = localStorage.getItem("secretKey");
  const code = document.getElementById("otp-code").value.trim();
  
  const response = await fetch("/api/verify-totp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, code, secretKey })
  });
  
  const data = await response.json();
  if (data.message) {
    showError(data.message);
  } else {
    closeError();
  }
  
  if (data.redirect) {
    setTimeout(() => window.location.href = data.redirect, 1500);
  }
}
