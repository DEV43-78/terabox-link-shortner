// ✅ Firebase config and imports
import { fetchAndDecryptConfig } from "./config.js";
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

// ✅ Modal Toggle Functions
window.openLogin = () => {
  document.getElementById("loginModal").classList.remove("hidden");
  document.getElementById("signupModal").classList.add("hidden");
};

window.openSignup = () => {
  document.getElementById("signupModal").classList.remove("hidden");
  document.getElementById("loginModal").classList.add("hidden");
};

// ✅ Global variables for Firebase
let auth, db;

// ✅ Initialize Firebase
async function initializeFirebase() {
  try {
    const firebaseConfig = await fetchAndDecryptConfig();
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    return true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    alert("Failed to initialize Firebase. Please check if the backend server is running.");
    return false;
  }
}

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
    stats[isoDate] = { impressions: 0, earnings: 0 };
  }
  return stats;
}

// ✅ Utility to make Firebase-safe keys
function safeEmailKey(email) {
  return email.replace(/\./g, "_");
}

// ✅ Signup Function
window.handleSignup = async () => {
  if (!auth || !db) {
    alert("Firebase is not initialized yet. Please wait a moment and try again.");
    return;
  }

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!name || !email || !password) {
    alert("Please fill all signup fields.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    const now = new Date().toISOString();
    const emailKey = safeEmailKey(email);

    const userData = {
      dashboard: {
        currentCPM: 0,
        todayEarnings: 0,
        todayImpressions: 0,
        totalEarnings: 0,
        totalImpressions: 0,
        dailyStats: generateZeroStats()
      },
      withdrawals: {
        totalWithdrawn: 0,
        requests: {
          "-initRequest": {
            method: "UPI",
            amount: 0,
            date: now,
            status: "pending",
            details: {
              upi: "init@upi"
            }
          }
        }
      },
      shortner: {
        web: {
          "initCode": {
            originalUrl: "https://terabox.com/s/placeholder",
            shortUrl: "https://teraboxlinke.com/a/initCode",
            fileId: "placeholder",
            views: 0,
            createdAt: now
          }
        },
        telegram: {
          "initTelegram": {
            originalUrl: "https://terabox.com/s/initTelegram",
            shortUrl: "https://teraboxlinke.com/a/initTelegram",
            fileId: "initTelegram",
            telegramId: "000000",
            views: 0,
            createdAt: now
          }
        }
      }
    };

    await set(ref(db, `users/${emailKey}`), userData);

    alert("Signup successful!");
    window.location.href = "/dashboard.html";
  } catch (error) {
    alert("Signup failed: " + error.message);
  }
};

// ✅ Login Function
window.handleLogin = async () => {
  if (!auth || !db) {
    alert("Firebase is not initialized yet. Please wait a moment and try again.");
    return;
  }

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    const emailKey = safeEmailKey(email);
    const snapshot = await get(child(ref(db), `users/${emailKey}`));

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

// ✅ Dummy Shorten (for UI only)
window.shortenLink = () => {
  const linkInput = document.getElementById("linkInput");
  const longURL = linkInput.value.trim();

  if (!longURL || !longURL.startsWith("http")) {
    alert("Please enter a valid URL starting with http or https.");
    return;
  }

  const shortCode = Math.random().toString(36).substring(2, 8);
  const shortURL = window.location.origin + "/a/" + shortCode;

  linkInput.value = shortURL;
  alert("Shortened: " + shortURL);
};

// ✅ Register Events
window.addEventListener("DOMContentLoaded", async () => {
  // Initialize Firebase first
  await initializeFirebase();
  
  // Then set up event listeners
  document.getElementById("loginBtn")?.addEventListener("click", openLogin);
  document.getElementById("signupBtn")?.addEventListener("click", openSignup);
  document.getElementById("switchToSignup")?.addEventListener("click", switchToSignup);
  document.getElementById("switchToLogin")?.addEventListener("click", switchToLogin);
  document.getElementById("handleLoginBtn")?.addEventListener("click", handleLogin);
  document.getElementById("handleSignupBtn")?.addEventListener("click", handleSignup);
});
