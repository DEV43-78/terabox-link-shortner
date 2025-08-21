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
const availableEarningsEl = document.getElementById("totalEarnings");
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

// ✅ Format YYYY-MM-DD / Aug 10 → readable
function formatDate(dateString) {
  return dateString; // Firebase में वैसे ही दिखाओ (Aug 10 → Aug 19)
}

// ✅ Proper Month → Number Map
const monthMap = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

// ✅ Custom Date Parser
function parseCustomDate(str) {
  // Example: "Aug 19"
  const [mon, day] = str.split(" ");
  return new Date(2025, monthMap[mon], parseInt(day)); // year fixed (2025)
}

// ✅ Load Dashboard Data
function loadDashboard(emailKey) {
  const dashboardRef = ref(db, `users/${emailKey}/dashboard`);
  onValue(dashboardRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const dailyStats = data.dailyStats || {};

    // 🔹 Dates को custom parse करके sort (latest → oldest)
    const sortedDates = Object.keys(dailyStats).sort(
      (a, b) => parseCustomDate(b) - parseCustomDate(a)
    );

    // 🔹 Latest Day Data for Cards
    if (sortedDates.length > 0) {
      const latestDate = sortedDates[0];
      const latest = dailyStats[latestDate];

      availableEarningsEl.textContent = `₹${data.availableEarnings ?? latest.earnings ?? 0}`;
      todayEarningsEl.textContent = `₹${data.todayEarnings ?? latest.earnings ?? 0}`;
      impressionsEl.textContent = `${data.todayImpressions ?? latest.impressions ?? data.totalImpressions ?? 0}`;
      cpmEl.textContent = `₹${data.currentCPM ?? latest.cpm ?? 0}`;
    } else {
      availableEarningsEl.textContent = "₹0";
      todayEarningsEl.textContent = "₹0";
      impressionsEl.textContent = "0";
      cpmEl.textContent = "₹0";
    }

    // 🔹 Table Render (latest → oldest)
    tableBody.innerHTML = sortedDates.length === 0
      ? `<tr><td colspan="4" style="text-align:center;">No stats available</td></tr>`
      : sortedDates.slice(0, 10).map(date => {
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
