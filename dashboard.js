import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { fetchAndDecryptConfig } from "./config.js";

// ✅ Firebase Init
const firebaseConfig = await fetchAndDecryptConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ✅ DOM Elements
const totalEarningsEl = document.getElementById("totalEarnings");
const todayEarningsEl = document.getElementById("todayEarnings");
const impressionsEl = document.getElementById("totalImpressions");
const cpmEl = document.getElementById("currentCPM");
const tableBody = document.getElementById("dailyStatsBody");
const profileNameEl = document.getElementById("profileName");
const loginOverlay = document.getElementById("loginOverlay");
const mainContent = document.getElementById("mainContent");

// ✅ Helper to convert email to Firebase-safe key
function safeEmailKey(email) {
  return email.replace(/\./g, "_");
}

// ✅ Format YYYY-MM-DD to readable
function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ✅ Load Dashboard Data
function loadDashboard(emailKey) {
  const dashboardRef = ref(db, `users/${emailKey}/dashboard`);
  onValue(dashboardRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    totalEarningsEl.textContent = `₹${data.totalEarnings ?? 0}`;
    todayEarningsEl.textContent = `₹${data.todayEarnings ?? 0}`;
    impressionsEl.textContent = `${data.todayImpressions ?? data.totalImpressions ?? 0}`;
    cpmEl.textContent = `₹${data.currentCPM ?? 0}`;

    const dailyStats = data.dailyStats || {};
    const sortedDates = Object.keys(dailyStats).sort((a, b) => new Date(b) - new Date(a));

    tableBody.innerHTML = sortedDates.length === 0
      ? `<tr><td colspan="4" style="text-align:center;">No stats available</td></tr>`
      : sortedDates.slice(0, 10).reverse().map(date => {
        const stats = dailyStats[date];
        return `
          <tr>
            <td>${formatDate(date)}</td>
            <td>${stats.impressions ?? 0}</td>
            <td>₹${stats.earnings ?? 0}</td>
            <td>₹${stats.cpm ?? 0}</td>
          </tr>`;
      }).join('');
  });
}

// ✅ Load Profile Name
function loadUserProfile(emailKey) {
  onValue(ref(db, `users/${emailKey}/name`), (snap) => {
    if (snap.exists()) {
      profileNameEl.textContent = snap.val();
    }
  });
}

// ✅ Auth State Check
onAuthStateChanged(auth, (user) => {
  if (!user) {
    loginOverlay.style.display = "flex";
    mainContent.classList.add("blurred");
    setTimeout(() => window.location.href = "index.html", 2000);
    return;
  }

  const emailKey = safeEmailKey(user.email);
  loadDashboard(emailKey);
  loadUserProfile(emailKey);
});

// ✅ Logout
window.handleLogout = () => {
  signOut(auth)
    .then(() => {
      localStorage.clear();
      window.location.href = "index.html";
    })
    .catch((err) => {
      alert("Logout error: " + err.message);
    });
};
