import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* ─── CONFIG FIREBASE ─────────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyCnpck3ez1b1oD9A9-cfMKMPm1I1WONXYY",
  authDomain: "championnat-alisabieh-2026.firebaseapp.com",
  projectId: "championnat-alisabieh-2026",
  storageBucket: "championnat-alisabieh-2026.firebasestorage.app",
  messagingSenderId: "971207034843",
  appId: "1:971207034843:web:dac112b526239ff75fc9fe",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ─── ÉTAT LOCAL ──────────────────────────────────────────── */
let teams = [];
let matches = [];
let sponsors = [];
let teamById = {};

/* ─── COULEURS PAR DÉFAUT ─────────────────────────────────── */
const DEFAULT_COLORS = [
  { color: "#009EDB", textColor: "#fff" },
  { color: "#007A3D", textColor: "#fff" },
  { color: "#CE1126", textColor: "#fff" },
  { color: "#C8A96E", textColor: "#0A1628" },
  { color: "#1A3358", textColor: "#fff" },
  { color: "#2ECC71", textColor: "#0A1628" },
  { color: "#E67E22", textColor: "#fff" },
  { color: "#8E44AD", textColor: "#fff" },
  { color: "#16A085", textColor: "#fff" },
  { color: "#C0392B", textColor: "#fff" },
];
function teamColor(i) {
  return DEFAULT_COLORS[i % DEFAULT_COLORS.length];
}

/* ─── DATE UTILITAIRES ────────────────────────────────────── */
// Retourne "YYYY-MM-DD" pour aujourd'hui en heure locale
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Label affiché sur le bouton de jour
function dayLabel(d) {
  const today = todayStr();
  const tomorrow = tomorrowStr();
  const yesterday = yesterdayStr();

  if (d === today) return "Aujourd'hui";
  if (d === tomorrow) return "Demain";
  if (d === yesterday) return "Hier";

  // Sinon : "24 Juin" avec étoile sur le 27
  const dd = parseInt(d.split("-")[2]);
  const label = `${dd} Juin`;
  return d === "2026-06-27" ? label + " ⭐" : label;
}

// Choisit le jour à activer par défaut :
// - aujourd'hui s'il existe dans les matchs
// - sinon la date la plus proche dans le futur
// - sinon la dernière date passée
function pickDefaultDay(days) {
  const today = todayStr();
  if (days.includes(today)) return today;

  // Dates futures triées
  const future = days.filter((d) => d > today).sort();
  if (future.length) return future[0];

  // Sinon la dernière date passée
  const past = days.filter((d) => d < today).sort();
  return past[past.length - 1] || days[0];
}

/* ─── STATUT BADGE ────────────────────────────────────────── */
function statusBadge(status) {
  const cfg = {
    live: { cls: "badge-live", label: '<span class="dot"></span> En cours' },
    half: { cls: "badge-half", label: "Mi-temps" },
    done: { cls: "badge-done", label: "Terminé" },
    upcoming: { cls: "badge-upcoming", label: "À venir" },
  };
  const c = cfg[status] || cfg.upcoming;
  return `<span class="status-badge ${c.cls}">${c.label}</span>`;
}

// Texte brut du statut pour l'attribut data (pseudo-element CSS mobile)
function statusText(status) {
  return (
    {
      live: "● En cours",
      half: "⏸ Mi-temps",
      done: "✓ Terminé",
      upcoming: "À venir",
    }[status] || "À venir"
  );
}

/* ─── INITIALES ───────────────────────────────────────────── */
function initials(name = "") {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─── SPONSORS ────────────────────────────────────────────── */
function renderSponsors() {
  const track = document.getElementById("sponsorsTrack");
  if (!track) return;

  if (!sponsors.length) {
    track.innerHTML = `<div class="sponsor-item active-sponsor">
      <div class="sponsor-name" style="font-size:13px;color:var(--text-dim)">
        Aucun partenaire enregistré
      </div></div>`;
    return;
  }

  const all = [...sponsors, ...sponsors];
  track.innerHTML = all
    .map(
      (s, i) => `
    <div class="sponsor-item" data-idx="${i % sponsors.length}">
      <div class="sponsor-logo-box"
           style="background:${s.bg || "#009EDB"};color:${s.color || "#fff"}">
        ${(s.shortName || s.name || "?").slice(0, 4)}
      </div>
      <div>
        <div class="sponsor-name">${s.name}</div>
        <div class="sponsor-type">${s.type || ""}</div>
      </div>
    </div>`,
    )
    .join("");

  if (window._sponsorTimer) clearInterval(window._sponsorTimer);
  let current = 0;

  function scroll() {
    document.querySelectorAll(".sponsor-item").forEach((el) => {
      el.classList.toggle(
        "active-sponsor",
        parseInt(el.dataset.idx) === current % sponsors.length,
      );
    });
    track.style.transform = `translateX(-${current * 260}px)`;
    current = (current + 1) % sponsors.length;
  }
  scroll();
  window._sponsorTimer = setInterval(scroll, 5000);
}

/* ─── RENDU MATCHS ────────────────────────────────────────── */
function renderMatches() {
  const nav = document.getElementById("daysNav");
  const sections = document.getElementById("daysSections");
  if (!nav || !sections) return;

  if (!teams.length || !matches.length) {
    sections.innerHTML = `
      <p style="color:var(--text-dim);text-align:center;padding:40px;font-size:14px">
        Chargement des données…
      </p>`;
    nav.innerHTML = "";
    return;
  }

  const days = [...new Set(matches.map((m) => m.day))].sort();
  const defaultDay = pickDefaultDay(days);

  /* ── Onglets ── */
  nav.innerHTML = days
    .map(
      (d) => `
    <button class="day-btn ${d === defaultDay ? "active" : ""}"
            onclick="switchDay('${d}')" data-day="${d}">
      ${dayLabel(d)}
    </button>`,
    )
    .join("");

  /* ── Sections ── */
  sections.innerHTML = days
    .map((d) => {
      const dayMatches = matches
        .filter((m) => m.day === d)
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

      return `
      <div class="day-section ${d === defaultDay ? "active" : ""}" id="day-${d}">
        <div class="day-header">
          <div class="day-header-line"></div>
          <h2>${dayLabel(d)}</h2>
          <div class="day-header-line"
               style="background:linear-gradient(90deg,rgba(0,158,219,0.4),transparent);
                      transform:scaleX(-1)"></div>
        </div>
        <div class="matches-list">
          ${dayMatches.map((m) => renderMatchCard(m)).join("")}
        </div>
      </div>`;
    })
    .join("");

  /* ── Scroll automatique vers le bouton actif ── */
  requestAnimationFrame(() => {
    const activeBtn = nav.querySelector(".day-btn.active");
    if (activeBtn) {
      activeBtn.scrollIntoView({
        inline: "center",
        behavior: "smooth",
        block: "nearest",
      });
    }
  });
}

/* ─── CARTE MATCH ─────────────────────────────────────────── */
function renderMatchCard(m) {
  const home = teamById[m.homeId];
  const away = teamById[m.awayId];

  const homeName = home ? home.name : m.homeId;
  const awayName = away ? away.name : m.awayId;
  const homeColor = home ? home.color || "#009EDB" : "#009EDB";
  const awayColor = away ? away.color || "#007A3D" : "#007A3D";
  const homeTxt = home ? home.textColor || "#fff" : "#fff";
  const awayTxt = away ? away.textColor || "#fff" : "#fff";
  const homeInit = home ? initials(home.name) : "??";
  const awayInit = away ? initials(away.name) : "??";
  const status = m.status || "upcoming";

  const scoreHtml =
    m.scoreHome !== null && m.scoreHome !== undefined
      ? `<div class="score-box" style="color:${homeColor}">${m.scoreHome}</div>
       <div class="score-sep">—</div>
       <div class="score-box" style="color:${awayColor}">${m.scoreAway}</div>`
      : `<div style="font-family:'Oswald',sans-serif;font-size:22px;
                   color:var(--text-dim);letter-spacing:2px">VS</div>`;

  return `
    <div class="match-card status-${status}" onclick="openMatchDetail('${m.id}')">
      <div class="match-card-inner" data-status-label="${statusText(status)}">

        <div class="match-time-col">
          <div class="match-time">${m.time || "--:--"}</div>
          <div class="match-field">${m.field || ""}</div>
        </div>

        <div class="match-team team-home">
          <div class="team-name" style="text-align:right">${homeName}</div>
          <div class="team-badge"
               style="background:${homeColor};color:${homeTxt}">${homeInit}</div>
        </div>

        <div class="match-score-center">${scoreHtml}</div>

        <div class="match-team team-away">
          <div class="team-badge"
               style="background:${awayColor};color:${awayTxt}">${awayInit}</div>
          <div class="team-name">${awayName}</div>
        </div>

        <div class="match-status-col">
          ${statusBadge(status)}
          <div class="click-hint">Détails →</div>
        </div>

      </div>
    </div>`;
}

/* ─── SWITCH JOUR ─────────────────────────────────────────── */
window.switchDay = function(day) {
  document
    .querySelectorAll(".day-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.day === day));
  document
    .querySelectorAll(".day-section")
    .forEach((s) => s.classList.toggle("active", s.id === "day-" + day));
  // Scroll le bouton actif au centre de la nav
  const activeBtn = document.querySelector(`.day-btn[data-day="${day}"]`);
  if (activeBtn) {
    activeBtn.scrollIntoView({
      inline: "center",
      behavior: "smooth",
      block: "nearest",
    });
  }
};

/* ─── NAVIGATION DÉTAIL ───────────────────────────────────── */
window.openMatchDetail = function(matchId) {
  window.location.href = `match.html?id=${matchId}`;
};

/* ─── ÉCOUTES FIRESTORE TEMPS RÉEL ───────────────────────── */

onSnapshot(collection(db, "teams"), (snap) => {
  teams = [];
  teamById = {};
  snap.docs.forEach((d, i) => {
    const raw = d.data();
    const fallback = teamColor(i);
    const team = {
      id: d.id,
      name: raw.name || d.id,
      color: raw.color || fallback.color,
      textColor: raw.textColor || fallback.textColor,
      phone: raw.phone || "",
    };
    teams.push(team);
    teamById[team.id] = team;
  });
  renderMatches();
});

onSnapshot(collection(db, "matches"), (snap) => {
  matches = [];
  snap.forEach((d) => matches.push({ id: d.id, ...d.data() }));
  matches.sort((a, b) => {
    const dd = (a.day || "").localeCompare(b.day || "");
    return dd !== 0 ? dd : (a.time || "").localeCompare(b.time || "");
  });
  renderMatches();
});

onSnapshot(collection(db, "sponsors"), (snap) => {
  sponsors = [];
  snap.forEach((d) => sponsors.push({ id: d.id, ...d.data() }));
  sponsors.sort((a, b) => (a.order || 0) - (b.order || 0));
  renderSponsors();
});
