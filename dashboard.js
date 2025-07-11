import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./config.js";

// ✅ Initialize Firebase
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

// ✅ Helper to Format Date
function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ✅ Auth State Listener
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // 🔒 If not logged in, show overlay & redirect to login
    loginOverlay.style.display = "flex";
    mainContent.classList.add("blurred");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
    return;
  }

  // ✅ Logged In User
  const uid = user.uid;

  // ✅ Load Dashboard Data
  onValue(ref(db, `users/${uid}/dashboard`), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    totalEarningsEl.textContent = `₹${data.totalEarnings ?? 0}`;
    todayEarningsEl.textContent = `₹${data.todayEarnings ?? 0}`;
    impressionsEl.textContent = `${data.todayImpressions ?? data.totalImpressions ?? 0}`;
    cpmEl.textContent = `₹${data.currentCPM ?? 0}`;

    // ✅ Daily Stats Table
    tableBody.innerHTML = "";
    const dailyStats = data.dailyStats ?? {};
    const sortedDates = Object.keys(dailyStats).sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="4" style="text-align:center; padding:10px;">No stats available</td></tr>
      `;
      return;
    }

    sortedDates.slice(0, 10).reverse().forEach(date => {
      const stats = dailyStats[date];
      tableBody.innerHTML += `
        <tr>
          <td style="padding: 10px;">${formatDate(date)}</td>
          <td style="padding: 10px;">${stats.impressions ?? 0}</td>
          <td style="padding: 10px;">₹${stats.earnings ?? 0}</td>
          <td style="padding: 10px;">₹${stats.cpm ?? 0}</td>
        </tr>`;
    });
  });

  // ✅ Load User Name
  onValue(ref(db, `users/${uid}/name`), (snap) => {
    if (snap.exists()) {
      profileNameEl.textContent = snap.val();
    }
  });
});

// ✅ Logout Function
window.handleLogout = () => {
  signOut(auth)
    .then(() => {
      localStorage.clear();
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Logout failed: " + error.message);
    });
};
