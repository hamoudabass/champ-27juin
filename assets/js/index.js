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
let teamById = {};

/* ─── PWA : BOUTON D'INSTALLATION PERSONNALISÉ ───────────── */

let deferredPrompt = null;
const installBtn = document.getElementById("installBtn");

// 1. Le navigateur signale qu'une installation est possible
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();        // empêche le mini-prompt automatique du navigateur
  deferredPrompt = event;        // on garde l'événement pour plus tard
  installBtn.style.display = "";  // on affiche notre bouton
});

// 2. Clic sur notre bouton → déclenche le vrai prompt natif
installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();  // affiche la fenêtre native d'installation

  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") {
    console.log("Utilisateur a installé l'app");
  } else {
    console.log("Utilisateur a refusé");
  }

  // Le prompt ne peut être utilisé qu'une fois
  deferredPrompt = null;
  installBtn.style.display = "none";
});

// 3. Si déjà installée → cacher le bouton définitivement
window.addEventListener("appinstalled", () => {
  installBtn.style.display = "none";
  deferredPrompt = null;
});

// 4. Détection si déjà lancée en mode standalone (déjà installée)
if (window.matchMedia("(display-mode: standalone)").matches) {
  installBtn.style.display = "none";
}

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
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(d) {
  if (d === todayStr()) return "Aujourd'hui";
  if (d === tomorrowStr()) return "Demain";
  if (d === yesterdayStr()) return "Hier";
  const dd = parseInt(d.split("-")[2]);
  return d === "2026-06-27" ? `${dd} Juin ⭐` : `${dd} Juin`;
}

function pickDefaultDay(days) {
  const today = todayStr();
  if (days.includes(today)) return today;
  const future = days.filter((d) => d > today).sort();
  if (future.length) return future[0];
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

function initials(name = "") {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─── RENDU MATCHS ────────────────────────────────────────── */
function renderMatches() {
  const nav = document.getElementById("daysNav");
  const sections = document.getElementById("daysSections");
  if (!nav || !sections) return;

  // Seuls les matchs de phase de poules (round absent ou "poule")
  const pouleMatches = matches.filter((m) => !m.round || m.round === "poule");

  if (!teams.length || !pouleMatches.length) {
    sections.innerHTML = `
      <p style="color:var(--text-dim);text-align:center;padding:40px;font-size:14px">
        ${!teams.length ? "Chargement des données…" : "Aucun match de poule pour le moment."}
      </p>`;
    nav.innerHTML = "";
    return;
  }

  const days = [...new Set(pouleMatches.map((m) => m.day))].sort();
  const defaultDay = pickDefaultDay(days);

  nav.innerHTML = days
    .map(
      (d) => `
    <button class="day-btn ${d === defaultDay ? "active" : ""}"
            onclick="switchDay('${d}')" data-day="${d}">
      ${dayLabel(d)}
    </button>`,
    )
    .join("");

  sections.innerHTML = days
    .map((d) => {
      const dayMatches = pouleMatches
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

  requestAnimationFrame(() => {
    const btn = nav.querySelector(".day-btn.active");
    if (btn)
      btn.scrollIntoView({
        inline: "center",
        behavior: "smooth",
        block: "nearest",
      });
  });
}

/* ─── RENDU BRACKET — PHASE FINALE ────────────────────────── */
function renderBracket() {
  const el = document.getElementById("bracketContent");
  if (!el) return;
 
  if (!teams.length) {
    el.innerHTML = `<p class="empty-bracket">Chargement…</p>`;
    return;
  }
 
  const quarts  = matches.filter(m => m.round === "quart");
  const demis   = matches.filter(m => m.round === "demi");
  const finale  = matches.filter(m => m.round === "finale");
  const petite  = matches.filter(m => m.round === "petite-finale");
 
  if (!quarts.length && !demis.length && !finale.length && !petite.length) {
    el.innerHTML = `<p class="empty-bracket">La phase finale n'a pas encore été configurée.</p>`;
    return;
  }
 
  /* Quarts groupés par paires (1-2, 3-4) qui mènent aux demis */
  const quartPairs = [
    [getByPos(quarts, 1), getByPos(quarts, 2)],
    [getByPos(quarts, 3), getByPos(quarts, 4)],
  ];
  const demiPair = [getByPos(demis, 1), getByPos(demis, 2)];
  const finaleMatch = getByPos(finale, 1);
  const petiteMatch = getByPos(petite, 1);
 
  el.innerHTML = `
    <div class="bracket-wrap">
 
      <!-- QUARTS -->
      <div class="bracket-round">
        <div class="bracket-round-title">Quarts de Finale</div>
        ${quartPairs.map(pair => `
          <div class="bracket-pair">
            <div class="bracket-slot">${renderBracketCard(pair[0])}</div>
            <div class="bracket-slot">${renderBracketCard(pair[1])}</div>
          </div>
        `).join("")}
      </div>
 
      <!-- DEMIS -->
      <div class="bracket-round">
        <div class="bracket-round-title">Demi-finales</div>
        <div class="bracket-pair">
          <div class="bracket-slot">${renderBracketCard(demiPair[0])}</div>
          <div class="bracket-slot">${renderBracketCard(demiPair[1])}</div>
        </div>
      </div>
 
      <!-- FINALE + PETITE FINALE -->
      <div class="bracket-round">
        <div class="bracket-round-title">Finale</div>
        <div class="bracket-pair bracket-pair-single">
          <div class="bracket-slot">${renderBracketCard(finaleMatch)}</div>
        </div>
 
        ${petite.length || true ? `
        <div class="bracket-petite-finale">
          <div class="bracket-round-title">Petite Finale</div>
          <div class="bracket-pair bracket-pair-single">
            <div class="bracket-slot">${renderBracketCard(petiteMatch)}</div>
          </div>
        </div>` : ""}
      </div>
 
    </div>`;
}
 
/* Trouve un match par sa position dans le bracket */
function getByPos(list, pos) {
  return list.find(m => Number(m.bracketPosition) === pos) || null;
}
 
/* Carte mini-match du bracket (ou carte vide si pas encore défini) */
function renderBracketCard(m) {
  if (!m) {
    return `<div class="bracket-card-empty">À déterminer</div>`;
  }
  
  const home = teamById[m.homeId];
  const away = teamById[m.awayId];
  const homeName = home ? home.name : (m.homeId || "?");
  const awayName = away ? away.name : (m.awayId || "?");
  const homeColor = home ? (home.color || "#009EDB") : "#009EDB";
  const awayColor = away ? (away.color || "#007A3D") : "#007A3D";
  const homeTxt   = home ? (home.textColor || "#fff") : "#fff";
  const awayTxt   = away ? (away.textColor || "#fff") : "#fff";
 
  const hasScore = m.scoreHome !== null && m.scoreHome !== undefined;
  const homeWin  = hasScore && m.scoreHome > m.scoreAway;
  const awayWin  = hasScore && m.scoreAway > m.scoreHome;
 
  const scoreH = hasScore ? m.scoreHome : "-";
  const scoreA = hasScore ? m.scoreAway : "-";
 
  const dateLabel = m.day ? m.day.split("-").slice(1).reverse().join("/") : "";
 
  return `
    <div class="bracket-card" onclick="openMatchDetail('${m.id}')">
      <div class="bracket-meta">
        <span>${dateLabel}${m.time ? " · "+m.time : ""}</span>
        ${statusBadge(m.status || "upcoming")}
      </div>
      <div class="bracket-team-row ${homeWin ? "winner" : ""}">
        <span class="bracket-team-name">
          <span class="bracket-badge-sm" style="background:${homeColor};color:${homeTxt}">
            ${initials(homeName)}
          </span>
          ${homeName}
        </span>
        <span class="bracket-score">${scoreH}</span>
      </div>
      <div class="bracket-team-row ${awayWin ? "winner" : ""}">
        <span class="bracket-team-name">
          <span class="bracket-badge-sm" style="background:${awayColor};color:${awayTxt}">
            ${initials(awayName)}
          </span>
          ${awayName}
        </span>
        <span class="bracket-score">${scoreA}</span>
      </div>
    </div>`;
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
          <div class="team-badge" style="background:${homeColor};color:${homeTxt}">
            ${initials(homeName)}
          </div>
        </div>
        <div class="match-score-center">${scoreHtml}</div>
        <div class="match-team team-away">
          <div class="team-badge" style="background:${awayColor};color:${awayTxt}">
            ${initials(awayName)}
          </div>
          <div class="team-name">${awayName}</div>
        </div>
        <div class="match-status-col">
          ${statusBadge(status)}
          <div class="click-hint">Détails →</div>
        </div>
      </div>
    </div>`;
}

/* ─── SWITCH ONGLET PRINCIPAL (Poules / Bracket) ─────────── */
window.switchMainTab = function(tab) {
  document.querySelectorAll(".main-tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.maintab === tab)
  );
  document.getElementById("poulesView").classList.toggle("active", tab === "poules");
  document.getElementById("bracketView").classList.toggle("active", tab === "bracket");
 
  if (tab === "bracket") renderBracket();
};

/* ─── SWITCH JOUR ─────────────────────────────────────────── */
window.switchDay = function(day) {
  document
    .querySelectorAll(".day-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.day === day));
  document
    .querySelectorAll(".day-section")
    .forEach((s) => s.classList.toggle("active", s.id === "day-" + day));
  const btn = document.querySelector(`.day-btn[data-day="${day}"]`);
  if (btn)
    btn.scrollIntoView({
      inline: "center",
      behavior: "smooth",
      block: "nearest",
    });
};

window.openMatchDetail = function(matchId) {
  window.location.href = `match.html?id=${matchId}`;
};

/* ─── ÉCOUTES FIRESTORE ───────────────────────────────────── */
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
  renderBracket();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(reg => console.log("SW enregistré", reg.scope))
      .catch(err => console.error("Échec SW", err));
  });
}
