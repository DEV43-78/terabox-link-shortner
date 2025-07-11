import { firebaseConfig } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  child
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ✅ Modal Toggle Functions
window.openLogin = () => {
  document.getElementById("loginModal").classList.remove("hidden");
  document.getElementById("signupModal").classList.add("hidden");
};

window.openSignup = () => {
  document.getElementById("signupModal").classList.remove("hidden");
  document.getElementById("loginModal").classList.add("hidden");
};

window.switchToSignup = () => window.openSignup();
window.switchToLogin = () => window.openLogin();

// ✅ Helper to create 10-day zero stats
function generateZeroStats(days = 10) {
  const stats = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const isoDate = date.toISOString().split("T")[0];
    stats[isoDate] = { impressions: 0, earnings: 0, cpm: 0 };
  }
  return stats;
}

// ✅ Signup
window.handleSignup = async () => {
  const nameInput = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!nameInput || !email || !password) {
    alert("Please fill all signup fields.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    const now = new Date().toISOString();
    const shortName = nameInput.split(" ")[0];

    const defaultUserData = {
      name: shortName,
      email,
      createdAt: now,
      dashboard: {
        totalEarnings: 0,
        todayEarnings: 0,
        totalImpressions: 0,
        todayImpressions: 0,
        currentCPM: 0,
        dailyStats: generateZeroStats()
      },
      withdrawals: {
        totalWithdrawn: 0,
        history: [
          { date: "2025-06-16", method: "UPI", amount: 0, status: "Pending" },
          { date: "2025-06-17", method: "Bank Transfer", amount: 0, status: "Pending" },
          { date: "2025-06-18", method: "Crypto", amount: 0, status: "Pending" }
        ]
      },
      links: {
        abc123: { originalUrl: "https://example1.com", views: 0, createdAt: now },
        xyz456: { originalUrl: "https://example2.com", views: 0, createdAt: now },
        pqr789: { originalUrl: "https://example3.com", views: 0, createdAt: now }
      }
    };

    await set(ref(db, `users/${userId}`), defaultUserData);
    alert("Signup successful!");
    window.location.href = "/dashboard.html";
  } catch (error) {
    alert("Signup failed: " + error.message);
  }
};

// ✅ Login
window.handleLogin = async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    const snapshot = await get(child(ref(db), `users/${userId}`));

    if (snapshot.exists()) {
      localStorage.setItem("userData", JSON.stringify(snapshot.val()));
      alert("Login successful!");
      window.location.href = "/dashboard.html";
    } else {
      alert("User data not found in database.");
    }
  } catch (error) {
    alert("Login failed: " + error.message);
  }
};

// ✅ Dummy Link Shortener
window.shortenLink = () => {
  const linkInput = document.getElementById("linkInput");
  const longURL = linkInput.value.trim();

  if (!longURL || !longURL.startsWith("http")) {
    alert("Please enter a valid URL starting with http or https.");
    return;
  }

  const shortCode = Math.random().toString(36).substring(2, 8);
  const shortURL = window.location.origin + "/" + shortCode;

  linkInput.value = shortURL;
  alert("Shortened: " + shortURL);
};

// ✅ Register Events
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn")?.addEventListener("click", openLogin);
  document.getElementById("signupBtn")?.addEventListener("click", openSignup);
  document.getElementById("switchToSignup")?.addEventListener("click", switchToSignup);
  document.getElementById("switchToLogin")?.addEventListener("click", switchToLogin);
  document.getElementById("handleLoginBtn")?.addEventListener("click", handleLogin);
  document.getElementById("handleSignupBtn")?.addEventListener("click", handleSignup);
});
