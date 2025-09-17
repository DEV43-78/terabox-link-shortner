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
const paginationEl = document.getElementById("pagination");

// ✅ Helpers
function safeEmailKey(email) {
  return email.replace(/\./g, "_");
}

// 🔹 Month mapping for custom Firebase date format ("Aug 19")
const monthMap = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};
function parseCustomDate(str) {
  const [mon, day] = str.split(" ");
  return new Date(2025, monthMap[mon], parseInt(day)); // Fixed year = 2025
}

// ✅ Globals
let sortedDates = [];
let dailyStats = {};
let currentPage = 1;
const rowsPerPage = 15;

// ✅ Render Table
function renderTable(page) {
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageDates = sortedDates.slice(start, end);

  tableBody.innerHTML = pageDates.length === 0
    ? `<tr><td colspan="4" style="text-align:center;">No stats available</td></tr>`
    : pageDates.map(date => {
        const stats = dailyStats[date] || {};
        return `
          <tr>
            <td>${date}</td>
            <td>${stats.impressions ?? 0}</td>
            <td>₹${stats.earnings ?? 0}</td>
            <td>₹${stats.cpm ?? 0}</td>
          </tr>`;
      }).join('');

  renderPagination();
}

// ✅ Render Pagination Buttons
function renderPagination() {
  const totalPages = Math.ceil(sortedDates.length / rowsPerPage);
  paginationEl.innerHTML = "";
  if (totalPages <= 1) return;

  let buttons = `<button ${currentPage===1?"disabled":""} onclick="changePage(${currentPage-1})">⬅ Prev</button>`;

  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="${i===currentPage?"active":""}" onclick="changePage(${i})">${i}</button>`;
  }

  buttons += `<button ${currentPage===totalPages?"disabled":""} onclick="changePage(${currentPage+1})">Next ➡</button>`;

  paginationEl.innerHTML = buttons;
}

window.changePage = function (page) {
  const totalPages = Math.ceil(sortedDates.length / rowsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable(currentPage);
};

// ✅ Load Dashboard
function loadDashboard(emailKey) {
  const dashboardRef = ref(db, `users/${emailKey}/dashboard`);
  onValue(dashboardRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    dailyStats = data.dailyStats || {};

    // 🔹 Dates ko parse karke sort (latest → oldest) aur 120 limit
    sortedDates = Object.keys(dailyStats)
      .sort((a, b) => parseCustomDate(b) - parseCustomDate(a))
      .slice(0, 120);

    // 🔹 Update cards using latest date
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

    // 🔹 Show first page
    currentPage = 1;
    renderTable(currentPage);
  });
}

// ✅ Profile Name
function loadUserProfile(emailKey) {
  onValue(ref(db, `users/${emailKey}/name`), (snap) => {
    if (snap.exists()) profileNameEl.textContent = snap.val();
  });
}

// ✅ Auth State
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
  signOut(auth).then(() => {
    localStorage.clear();
    window.location.href = "index.html";
  }).catch((err) => alert("Logout error: " + err.message));
};
