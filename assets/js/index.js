import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
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
let teams = []; // tableau d'objets équipe
let matches = []; // tableau d'objets match
let sponsors = []; // tableau d'objets sponsor
let teamById = {}; // lookup rapide id → équipe

/* ─── COULEURS PAR DÉFAUT (palette Djibouti, 10 équipes) ──── */
const DEFAULT_COLORS = [
  { color: "#009EDB", textColor: "#fff" }, // bleu ciel
  { color: "#007A3D", textColor: "#fff" }, // vert
  { color: "#CE1126", textColor: "#fff" }, // rouge
  { color: "#C8A96E", textColor: "#0A1628" }, // sable
  { color: "#1A3358", textColor: "#fff" }, // bleu nuit
  { color: "#2ECC71", textColor: "#0A1628" }, // vert clair
  { color: "#E67E22", textColor: "#fff" }, // orange
  { color: "#8E44AD", textColor: "#fff" }, // violet
  { color: "#16A085", textColor: "#fff" }, // teal
  { color: "#C0392B", textColor: "#fff" }, // rouge foncé
];

function teamColor(index) {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
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

/* ─── INITIALES D'UNE ÉQUIPE (2 lettres max) ──────────────── */
function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─── RENDU SPONSORS ──────────────────────────────────────── */
function renderSponsors() {
  const track = document.getElementById("sponsorsTrack");
  if (!track) return;

  if (!sponsors.length) {
    track.innerHTML = `<div class="sponsor-item active-sponsor">
      <div class="sponsor-name" style="font-size:13px;color:var(--text-dim)">Aucun partenaire enregistré</div>
    </div>`;
    return;
  }

  // On duplique pour le défilement en boucle
  const all = [...sponsors, ...sponsors];
  track.innerHTML = all
    .map(
      (s, i) => `
    <div class="sponsor-item" data-idx="${i % sponsors.length}">
      <div class="sponsor-logo-box" style="background:${s.bg || "#009EDB"};color:${s.color || "#fff"}">
        ${(s.shortName || s.name || "?").slice(0, 4)}
      </div>
      <div>
        <div class="sponsor-name">${s.name}</div>
        <div class="sponsor-type">${s.type || ""}</div>
      </div>
    </div>
  `,
    )
    .join("");

  // Défilement toutes les 5 secondes
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

/* ─── RENDU LISTE DES MATCHS ─────────────────────────────── */
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

  // Jours uniques triés
  const days = [...new Set(matches.map((m) => m.day))].sort();

  // Label jours — le 27 juin reçoit l'étoile finale
  function dayLabel(d) {
    const [y, mo, dd] = d.split("-");
    const label = `${parseInt(dd)} Juin`;
    return d === "2026-06-27" ? label + " ⭐" : label;
  }

  // Onglets
  nav.innerHTML = days
    .map(
      (d, i) => `
    <button class="day-btn ${i === 0 ? "active" : ""}"
            onclick="switchDay('${d}')" data-day="${d}">
      ${dayLabel(d)}
    </button>
  `,
    )
    .join("");

  // Sections par jour
  sections.innerHTML = days
    .map((d, i) => {
      const dayMatches = matches
        .filter((m) => m.day === d)
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

      return `
      <div class="day-section ${i === 0 ? "active" : ""}" id="day-${d}">
        <div class="day-header">
          <div class="day-header-line"></div>
          <h2>${dayLabel(d)}</h2>
          <div class="day-header-line"
               style="background:linear-gradient(90deg,rgba(0,158,219,0.4),transparent);transform:scaleX(-1)">
          </div>
        </div>
        <div class="matches-list">
          ${dayMatches.map((m) => renderMatchCard(m)).join("")}
        </div>
      </div>`;
    })
    .join("");
}

/* ─── CARTE D'UN MATCH ───────────────────────────────────── */
function renderMatchCard(m) {
  const home = teamById[m.homeId];
  const away = teamById[m.awayId];

  // Si une équipe est manquante dans Firestore on affiche un placeholder
  const homeName = home ? home.name : m.homeId;
  const awayName = away ? away.name : m.awayId;
  const homeColor = home ? home.color || "#009EDB" : "#009EDB";
  const awayColor = away ? away.color || "#007A3D" : "#007A3D";
  const homeTxt = home ? home.textColor || "#fff" : "#fff";
  const awayTxt = away ? away.textColor || "#fff" : "#fff";
  const homeInit = home ? initials(home.name) : "??";
  const awayInit = away ? initials(away.name) : "??";

  const scoreHtml =
    m.scoreHome !== null && m.scoreHome !== undefined
      ? `<div class="score-box" style="color:${homeColor}">${m.scoreHome}</div>
       <div class="score-sep">—</div>
       <div class="score-box" style="color:${awayColor}">${m.scoreAway}</div>`
      : `<div style="font-family:'Oswald',sans-serif;font-size:22px;
                   color:var(--text-dim);letter-spacing:2px">VS</div>`;

  return `
    <div class="match-card status-${m.status || "upcoming"}"
         onclick="openMatchDetail('${m.id}')">
      <div class="match-card-inner">

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
          ${statusBadge(m.status || "upcoming")}
          <div class="click-hint">Détails →</div>
        </div>

      </div>
    </div>`;
}

/* ─── SWITCH ONGLET JOUR ─────────────────────────────────── */
window.switchDay = function(day) {
  document
    .querySelectorAll(".day-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.day === day));
  document
    .querySelectorAll(".day-section")
    .forEach((s) => s.classList.toggle("active", s.id === "day-" + day));
};

/* ─── NAVIGATION VERS LE DÉTAIL ──────────────────────────── */
window.openMatchDetail = function(matchId) {
  window.location.href = `match.html?id=${matchId}`;
};

/* ─── ÉCOUTE FIRESTORE EN TEMPS RÉEL ─────────────────────── */

// 1. Équipes
onSnapshot(collection(db, "teams"), (snap) => {
  teams = [];
  teamById = {};
  snap.forEach((d, i) => {
    const raw = d.data();
    // Couleur : celle stockée dans Firestore OU couleur par défaut selon index
    const fallback = teamColor(snap.docs.indexOf(d));
    const team = {
      id: d.id,
      name: raw.name || d.id,
      color: raw.color || fallback.color,
      textColor: raw.textColor || fallback.textColor,
      phone: raw.phone || "", // stocké mais jamais affiché
    };
    teams.push(team);
    teamById[team.id] = team;
  });
  renderMatches();
});

// 2. Matchs (triés par jour puis heure côté Firestore si possible, sinon JS)
onSnapshot(collection(db, "matches"), (snap) => {
  matches = [];
  snap.forEach((d) => {
    matches.push({ id: d.id, ...d.data() });
  });
  matches.sort((a, b) => {
    const dayDiff = (a.day || "").localeCompare(b.day || "");
    return dayDiff !== 0 ? dayDiff : (a.time || "").localeCompare(b.time || "");
  });
  renderMatches();
});

// 3. Sponsors (triés par ordre si le champ existe)
onSnapshot(collection(db, "sponsors"), (snap) => {
  sponsors = [];
  snap.forEach((d) => {
    sponsors.push({ id: d.id, ...d.data() });
  });
  sponsors.sort((a, b) => (a.order || 0) - (b.order || 0));
  renderSponsors();
});
