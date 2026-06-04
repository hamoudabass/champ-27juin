/* =============================================================
   DONNÉES — MODIFIEZ CE BLOC SELON VOS BESOINS
   ============================================================= */

/* --- SPONSORS & PARTENAIRES ---
   Ajoutez / supprimez des entrées librement.
   color   = couleur du texte dans le logo carré
   bg      = fond du logo carré (hex)
   type    = "Sponsor principal" | "Partenaire" | "Médias" | etc.
*/
const sponsors = [
  {
    name: "Banque Populaire de Djibouti",
    shortName: "BPD",
    type: "Sponsor principal",
    color: "#fff",
    bg: "#009EDB",
  },
  {
    name: "Telecom Djibouti",
    shortName: "TD",
    type: "Partenaire officiel",
    color: "#fff",
    bg: "#007A3D",
  },
  {
    name: "Port de Djibouti",
    shortName: "PD",
    type: "Sponsor or",
    color: "#0A1628",
    bg: "#C8A96E",
  },
  {
    name: "Mairie d'Alisabieh",
    shortName: "MA",
    type: "Soutien institutionnel",
    color: "#fff",
    bg: "#CE1126",
  },
  {
    name: "Radio Djibouti",
    shortName: "RDJ",
    type: "Médias officiels",
    color: "#fff",
    bg: "#1A3358",
  },
  {
    name: "Brasserie Star",
    shortName: "BST",
    type: "Partenaire boisson",
    color: "#0A1628",
    bg: "#FFD700",
  },
  {
    name: "Assurances Djibouti",
    shortName: "ASSDJ",
    type: "Partenaire",
    color: "#fff",
    bg: "#3D5A80",
  },
];

/* --- ÉQUIPES ---
   id       = identifiant unique (ne pas changer après avoir configuré les matchs)
   name     = nom complet
   short    = abbréviation 3 lettres
   color    = couleur principale (fond du badge)
   textColor= couleur du texte dans le badge
   coach    = nom du coach
   players  = liste des joueurs (14 max recommandé)
              { num, name, pos }
              pos: GK, DEF, MIL, ATT
*/
const teams = [
  {
    id: "ali",
    name: "AS Alisabieh",
    short: "ALI",
    color: "#009EDB",
    textColor: "#fff",
    coach: "Mohamed Hassan Warsama",
    players: [
      { num: 1, name: "Omar Abdillahi Robleh", pos: "GK" },
      { num: 2, name: "Hassan Elmi Gouled", pos: "DEF" },
      { num: 3, name: "Youssouf Ali Mahamoud", pos: "DEF" },
      { num: 4, name: "Abdi Farah Ibrahim", pos: "DEF" },
      { num: 5, name: "Ismail Omar Hassan", pos: "DEF" },
      { num: 6, name: "Ahmed Djibril Said", pos: "MIL" },
      { num: 7, name: "Moussa Guirreh Ali", pos: "MIL" },
      { num: 8, name: "Kadar Hassan Farah", pos: "MIL" },
      { num: 9, name: "Idriss Bouh Ibrahim", pos: "ATT" },
      { num: 10, name: "Abdirahman Youssouf Dirie", pos: "ATT" },
      { num: 11, name: "Djama Elmi Warsama", pos: "ATT" },
      { num: 12, name: "Said Ahmed Osman", pos: "GK" },
      { num: 13, name: "Ibrahim Mahamoud Hassan", pos: "DEF" },
      { num: 14, name: "Houssein Ali Gouled", pos: "MIL" },
    ],
  },
  {
    id: "dag",
    name: "FC Dagueyto",
    short: "DAG",
    color: "#007A3D",
    textColor: "#fff",
    coach: "Abdirahman Bouh Said",
    players: [
      { num: 1, name: "Farah Osman Elmi", pos: "GK" },
      { num: 2, name: "Ahmed Ibrahim Warsama", pos: "DEF" },
      { num: 3, name: "Moussa Djama Hassan", pos: "DEF" },
      { num: 4, name: "Omar Said Guirreh", pos: "DEF" },
      { num: 5, name: "Ali Hassan Mahamoud", pos: "DEF" },
      { num: 6, name: "Ismail Farah Dirie", pos: "MIL" },
      { num: 7, name: "Hassan Abdi Ibrahim", pos: "MIL" },
      { num: 8, name: "Djibril Omar Warsama", pos: "MIL" },
      { num: 9, name: "Kadar Ali Hassan", pos: "ATT" },
      { num: 10, name: "Abdirahman Said Ahmed", pos: "ATT" },
      { num: 11, name: "Houssein Elmi Bouh", pos: "ATT" },
      { num: 12, name: "Youssouf Hassan Omar", pos: "GK" },
      { num: 13, name: "Ibrahim Djama Farah", pos: "DEF" },
      { num: 14, name: "Said Idriss Mahamoud", pos: "MIL" },
    ],
  },
  {
    id: "gal",
    name: "Étoile de Gallafi",
    short: "GAL",
    color: "#CE1126",
    textColor: "#fff",
    coach: "Ibrahim Guirreh Warsama",
    players: [
      { num: 1, name: "Omar Djibril Farah", pos: "GK" },
      { num: 2, name: "Hassan Said Elmi", pos: "DEF" },
      { num: 3, name: "Abdi Moussa Mahamoud", pos: "DEF" },
      { num: 4, name: "Youssouf Ibrahim Dirie", pos: "DEF" },
      { num: 5, name: "Ahmed Omar Hassan", pos: "DEF" },
      { num: 6, name: "Ismail Abdirahman Bouh", pos: "MIL" },
      { num: 7, name: "Djama Houssein Ali", pos: "MIL" },
      { num: 8, name: "Kadar Farah Warsama", pos: "MIL" },
      { num: 9, name: "Idriss Ahmed Said", pos: "ATT" },
      { num: 10, name: "Said Ali Elmi", pos: "ATT" },
      { num: 11, name: "Moussa Ibrahim Omar", pos: "ATT" },
      { num: 12, name: "Farah Hassan Djama", pos: "GK" },
      { num: 13, name: "Ali Youssouf Guirreh", pos: "DEF" },
      { num: 14, name: "Hassan Mahamoud Idriss", pos: "MIL" },
    ],
  },
  {
    id: "hol",
    name: "Holhol United",
    short: "HOL",
    color: "#C8A96E",
    textColor: "#0A1628",
    coach: "Said Warsama Hassan",
    players: [
      { num: 1, name: "Farah Ahmed Guirreh", pos: "GK" },
      { num: 2, name: "Omar Hassan Elmi", pos: "DEF" },
      { num: 3, name: "Abdirahman Djibril Said", pos: "DEF" },
      { num: 4, name: "Hassan Idriss Mahamoud", pos: "DEF" },
      { num: 5, name: "Moussa Ali Ibrahim", pos: "DEF" },
      { num: 6, name: "Ismail Omar Dirie", pos: "MIL" },
      { num: 7, name: "Ahmed Farah Bouh", pos: "MIL" },
      { num: 8, name: "Youssouf Djama Hassan", pos: "MIL" },
      { num: 9, name: "Kadar Said Elmi", pos: "ATT" },
      { num: 10, name: "Idriss Moussa Warsama", pos: "ATT" },
      { num: 11, name: "Said Hassan Omar", pos: "ATT" },
      { num: 12, name: "Ali Abdi Ibrahim", pos: "GK" },
      { num: 13, name: "Djibril Houssein Ahmed", pos: "DEF" },
      { num: 14, name: "Ibrahim Omar Guirreh", pos: "MIL" },
    ],
  },
];

/* --- MATCHS ---
   Statuts : "upcoming" | "live" | "half" | "done"
   scoreHome / scoreAway : null si pas encore joué
   events : tableau d'événements
     { type: "goal"|"yellow"|"red"|"penalty", minute, teamId, playerName }
*/
const matches = [
  /* ======== JOUR 1 : 24 JUIN ======== */
  {
    id: "m1",
    day: "2026-06-24",
    time: "08:30",
    homeId: "ali",
    awayId: "dag",
    status: "done",
    scoreHome: 3,
    scoreAway: 1,
    field: "Terrain Principal",
    events: [
      {
        type: "goal",
        minute: 12,
        teamId: "ali",
        playerName: "Idriss Bouh Ibrahim",
      },
      {
        type: "yellow",
        minute: 23,
        teamId: "dag",
        playerName: "Hassan Abdi Ibrahim",
      },
      {
        type: "goal",
        minute: 35,
        teamId: "ali",
        playerName: "Abdirahman Youssouf Dirie",
      },
      {
        type: "goal",
        minute: 51,
        teamId: "dag",
        playerName: "Kadar Ali Hassan",
      },
      {
        type: "red",
        minute: 67,
        teamId: "dag",
        playerName: "Omar Said Guirreh",
      },
      {
        type: "goal",
        minute: 78,
        teamId: "ali",
        playerName: "Djama Elmi Warsama",
      },
      {
        type: "penalty",
        minute: 82,
        teamId: "ali",
        playerName: "Abdirahman Youssouf Dirie",
        scored: false,
      },
    ],
  },
  {
    id: "m2",
    day: "2026-06-24",
    time: "10:30",
    homeId: "gal",
    awayId: "hol",
    status: "done",
    scoreHome: 2,
    scoreAway: 2,
    field: "Terrain Principal",
    events: [
      {
        type: "goal",
        minute: 8,
        teamId: "gal",
        playerName: "Idriss Ahmed Said",
      },
      {
        type: "goal",
        minute: 29,
        teamId: "hol",
        playerName: "Kadar Said Elmi",
      },
      {
        type: "yellow",
        minute: 38,
        teamId: "gal",
        playerName: "Djama Houssein Ali",
      },
      {
        type: "goal",
        minute: 44,
        teamId: "hol",
        playerName: "Idriss Moussa Warsama",
      },
      {
        type: "yellow",
        minute: 55,
        teamId: "hol",
        playerName: "Ahmed Farah Bouh",
      },
      { type: "goal", minute: 71, teamId: "gal", playerName: "Said Ali Elmi" },
      {
        type: "penalty",
        minute: 85,
        teamId: "gal",
        playerName: "Said Ali Elmi",
        scored: true,
      },
    ],
  },
  {
    id: "m3",
    day: "2026-06-24",
    time: "14:00",
    homeId: "ali",
    awayId: "gal",
    status: "done",
    scoreHome: 1,
    scoreAway: 0,
    field: "Terrain Annexe",
    events: [
      {
        type: "yellow",
        minute: 15,
        teamId: "gal",
        playerName: "Kadar Farah Warsama",
      },
      {
        type: "goal",
        minute: 33,
        teamId: "ali",
        playerName: "Djama Elmi Warsama",
      },
      {
        type: "yellow",
        minute: 60,
        teamId: "ali",
        playerName: "Moussa Guirreh Ali",
      },
      {
        type: "yellow",
        minute: 72,
        teamId: "gal",
        playerName: "Ahmed Omar Hassan",
      },
    ],
  },
  {
    id: "m4",
    day: "2026-06-24",
    time: "16:30",
    homeId: "dag",
    awayId: "hol",
    status: "done",
    scoreHome: 0,
    scoreAway: 2,
    field: "Terrain Annexe",
    events: [
      {
        type: "goal",
        minute: 18,
        teamId: "hol",
        playerName: "Said Hassan Omar",
      },
      {
        type: "yellow",
        minute: 32,
        teamId: "dag",
        playerName: "Djibril Omar Warsama",
      },
      {
        type: "goal",
        minute: 64,
        teamId: "hol",
        playerName: "Kadar Said Elmi",
      },
      {
        type: "red",
        minute: 80,
        teamId: "dag",
        playerName: "Said Idriss Mahamoud",
      },
    ],
  },

  /* ======== JOUR 2 : 25 JUIN ======== */
  {
    id: "m5",
    day: "2026-06-25",
    time: "08:30",
    homeId: "hol",
    awayId: "ali",
    status: "done",
    scoreHome: 1,
    scoreAway: 3,
    field: "Terrain Principal",
    events: [
      {
        type: "goal",
        minute: 5,
        teamId: "ali",
        playerName: "Abdirahman Youssouf Dirie",
      },
      {
        type: "goal",
        minute: 20,
        teamId: "hol",
        playerName: "Idriss Moussa Warsama",
      },
      {
        type: "yellow",
        minute: 37,
        teamId: "hol",
        playerName: "Moussa Ali Ibrahim",
      },
      {
        type: "goal",
        minute: 50,
        teamId: "ali",
        playerName: "Idriss Bouh Ibrahim",
      },
      {
        type: "goal",
        minute: 73,
        teamId: "ali",
        playerName: "Djama Elmi Warsama",
      },
    ],
  },
  {
    id: "m6",
    day: "2026-06-25",
    time: "10:30",
    homeId: "dag",
    awayId: "gal",
    status: "done",
    scoreHome: 2,
    scoreAway: 1,
    field: "Terrain Principal",
    events: [
      {
        type: "goal",
        minute: 14,
        teamId: "dag",
        playerName: "Abdirahman Said Ahmed",
      },
      {
        type: "goal",
        minute: 28,
        teamId: "gal",
        playerName: "Moussa Ibrahim Omar",
      },
      {
        type: "yellow",
        minute: 44,
        teamId: "gal",
        playerName: "Ismail Abdirahman Bouh",
      },
      {
        type: "goal",
        minute: 67,
        teamId: "dag",
        playerName: "Kadar Ali Hassan",
      },
      {
        type: "penalty",
        minute: 75,
        teamId: "dag",
        playerName: "Kadar Ali Hassan",
        scored: false,
      },
    ],
  },

  /* ======== JOUR 3 : 26 JUIN ======== */
  {
    id: "m7",
    day: "2026-06-26",
    time: "09:00",
    homeId: "ali",
    awayId: "hol",
    status: "done",
    scoreHome: 4,
    scoreAway: 0,
    field: "Terrain Principal",
    events: [
      {
        type: "goal",
        minute: 10,
        teamId: "ali",
        playerName: "Idriss Bouh Ibrahim",
      },
      {
        type: "goal",
        minute: 22,
        teamId: "ali",
        playerName: "Abdirahman Youssouf Dirie",
      },
      {
        type: "red",
        minute: 30,
        teamId: "hol",
        playerName: "Omar Hassan Elmi",
      },
      {
        type: "goal",
        minute: 41,
        teamId: "ali",
        playerName: "Djama Elmi Warsama",
      },
      {
        type: "yellow",
        minute: 55,
        teamId: "ali",
        playerName: "Ahmed Djibril Said",
      },
      {
        type: "penalty",
        minute: 60,
        teamId: "ali",
        playerName: "Abdirahman Youssouf Dirie",
        scored: true,
      },
      {
        type: "goal",
        minute: 60,
        teamId: "ali",
        playerName: "Abdirahman Youssouf Dirie",
      },
    ],
  },
  {
    id: "m8",
    day: "2026-06-26",
    time: "11:00",
    homeId: "gal",
    awayId: "dag",
    status: "half",
    scoreHome: 1,
    scoreAway: 1,
    field: "Terrain Annexe",
    events: [
      { type: "goal", minute: 17, teamId: "gal", playerName: "Said Ali Elmi" },
      {
        type: "yellow",
        minute: 25,
        teamId: "dag",
        playerName: "Hassan Abdi Ibrahim",
      },
      {
        type: "goal",
        minute: 38,
        teamId: "dag",
        playerName: "Abdirahman Said Ahmed",
      },
      {
        type: "yellow",
        minute: 45,
        teamId: "gal",
        playerName: "Moussa Ibrahim Omar",
      },
    ],
  },
  {
    id: "m9",
    day: "2026-06-26",
    time: "15:00",
    homeId: "dag",
    awayId: "ali",
    status: "live",
    scoreHome: 0,
    scoreAway: 1,
    field: "Terrain Principal",
    events: [
      {
        type: "goal",
        minute: 23,
        teamId: "ali",
        playerName: "Idriss Bouh Ibrahim",
      },
      {
        type: "yellow",
        minute: 38,
        teamId: "dag",
        playerName: "Moussa Djama Hassan",
      },
    ],
  },
  {
    id: "m10",
    day: "2026-06-26",
    time: "17:30",
    homeId: "hol",
    awayId: "gal",
    status: "upcoming",
    scoreHome: null,
    scoreAway: null,
    field: "Terrain Principal",
    events: [],
  },

  /* ======== JOUR 4 : 27 JUIN — FINALE ======== */
  {
    id: "m11",
    day: "2026-06-27",
    time: "09:00",
    homeId: "hol",
    awayId: "dag",
    status: "upcoming",
    scoreHome: null,
    scoreAway: null,
    field: "Terrain Annexe",
    events: [],
  },
  {
    id: "m12",
    day: "2026-06-27",
    time: "11:00",
    homeId: "gal",
    awayId: "ali",
    status: "upcoming",
    scoreHome: null,
    scoreAway: null,
    field: "Terrain Annexe",
    events: [],
  },
  {
    id: "m13",
    day: "2026-06-27",
    time: "15:00",
    homeId: "dag",
    awayId: "hol",
    status: "upcoming",
    scoreHome: null,
    scoreAway: null,
    field: "Terrain Principal — Petite Finale",
    events: [],
  },
  {
    id: "m14",
    day: "2026-06-27",
    time: "17:30",
    homeId: "ali",
    awayId: "gal",
    status: "upcoming",
    scoreHome: null,
    scoreAway: null,
    field: "Terrain Principal — ⭐ GRANDE FINALE",
    events: [],
  },
];

/* =============================================================
   FIN DES DONNÉES
   ============================================================= */

// Lookup rapide
const teamById = {};
teams.forEach((t) => (teamById[t.id] = t));

// Jours uniques triés
const days = [...new Set(matches.map((m) => m.day))].sort();

const dayLabels = {
  "2026-06-24": "24 Juin",
  "2026-06-25": "25 Juin",
  "2026-06-26": "26 Juin",
  "2026-06-27": "27 Juin ⭐ Finale",
};

// ===== CLASSEMENT =====
function computeStandings() {
  const pts = {};
  teams.forEach((t) => {
    pts[t.id] = { id: t.id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
  });
  matches
    .filter((m) => m.status === "done")
    .forEach((m) => {
      const h = pts[m.homeId],
        a = pts[m.awayId];
      h.p++;
      a.p++;
      h.gf += m.scoreHome;
      h.ga += m.scoreAway;
      a.gf += m.scoreAway;
      a.ga += m.scoreHome;
      if (m.scoreHome > m.scoreAway) {
        h.w++;
        h.pts = (h.pts || 0) + 3;
        a.l++;
        a.pts = a.pts || 0;
      } else if (m.scoreHome < m.scoreAway) {
        a.w++;
        a.pts = (a.pts || 0) + 3;
        h.l++;
        h.pts = h.pts || 0;
      } else {
        h.d++;
        a.d++;
        h.pts = (h.pts || 0) + 1;
        a.pts = (a.pts || 0) + 1;
      }
    });
  return Object.values(pts).sort(
    (a, b) => (b.pts || 0) - (a.pts || 0) || b.gf - b.ga - (a.gf - a.ga),
  );
}

// ===== TOP BUTEURS =====
function computeTopScorers() {
  const map = {};
  matches.forEach((m) => {
    m.events
      .filter((e) => e.type === "goal")
      .forEach((e) => {
        const k = e.playerName + "|" + e.teamId;
        if (!map[k])
          map[k] = { name: e.playerName, teamId: e.teamId, goals: 0 };
        map[k].goals++;
      });
  });
  return Object.values(map)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);
}

// ===== TOP CARDS =====
function computeTopCards() {
  const map = {};
  matches.forEach((m) => {
    m.events
      .filter((e) => e.type === "yellow" || e.type === "red")
      .forEach((e) => {
        const k = e.playerName + "|" + e.teamId;
        if (!map[k])
          map[k] = { name: e.playerName, teamId: e.teamId, yellow: 0, red: 0 };
        if (e.type === "yellow") map[k].yellow++;
        else map[k].red++;
      });
  });
  return Object.values(map)
    .sort((a, b) => b.red * 2 + b.yellow - (a.red * 2 + a.yellow))
    .slice(0, 5);
}

// ===== STATUT BADGE =====
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

// ===== RENDU SPONSORS =====
function renderSponsors() {
  const track = document.getElementById("sponsorsTrack");
  // On duplique pour que le CSS de défilement puisse tourner en boucle
  const allSponsors = [...sponsors, ...sponsors];
  track.innerHTML = allSponsors
    .map(
      (s, i) => `
    <div class="sponsor-item" data-idx="${i % sponsors.length}">
      <div class="sponsor-logo-box" style="background:${s.bg}; color:${s.color};">
        ${s.shortName}
      </div>
      <div>
        <div class="sponsor-name">${s.name}</div>
        <div class="sponsor-type">${s.type}</div>
      </div>
    </div>
  `,
    )
    .join("");

  // Défilement 5 secondes
  let current = 0;
  function scroll() {
    document.querySelectorAll(".sponsor-item").forEach((el, i) => {
      el.classList.toggle(
        "active-sponsor",
        parseInt(el.dataset.idx) === current % sponsors.length,
      );
    });
    // Déplace le track
    const itemW = 260; // largeur approx d'un sponsor
    track.style.transform = `translateX(-${current * itemW}px)`;
    current = (current + 1) % sponsors.length;
  }
  scroll();
  setInterval(scroll, 5000);
}

// ===== RENDU JOURS + MATCHS =====
function renderDays() {
  const nav = document.getElementById("daysNav");
  const sections = document.getElementById("daysSections");

  nav.innerHTML = days
    .map(
      (d, i) => `
    <button class="day-btn ${i === 0 ? "active" : ""}" onclick="switchDay('${d}')" data-day="${d}">
      ${dayLabels[d] || d}
    </button>
  `,
    )
    .join("");

  sections.innerHTML = days
    .map((d, i) => {
      const dayMatches = matches
        .filter((m) => m.day === d)
        .sort((a, b) => a.time.localeCompare(b.time));
      return `
      <div class="day-section ${i === 0 ? "active" : ""}" id="day-${d}">
        <div class="day-header">
          <div class="day-header-line"></div>
          <h2>${dayLabels[d] || d}</h2>
          <div class="day-header-line" style="background:linear-gradient(90deg,rgba(0,158,219,0.4),transparent);transform:scaleX(-1)"></div>
        </div>
        <div class="matches-list">
          ${dayMatches.map((m) => renderMatchCard(m)).join("")}
        </div>
      </div>`;
    })
    .join("");
}

function renderMatchCard(m) {
  const home = teamById[m.homeId];
  const away = teamById[m.awayId];
  const scoreHtml =
    m.scoreHome !== null
      ? `<div class="score-box" style="color:${home.color}">${m.scoreHome}</div>
       <div class="score-sep">—</div>
       <div class="score-box" style="color:${away.color}">${m.scoreAway}</div>`
      : `<div style="font-family:'Oswald',sans-serif;font-size:22px;color:var(--text-dim);letter-spacing:2px">VS</div>`;

  return `
    <div class="match-card status-${m.status}" onclick="openMatchDetail('${m.id}')">
      <div class="match-card-inner">
        <div class="match-time-col">
          <div class="match-time">${m.time}</div>
          <div class="match-field">${m.field}</div>
        </div>
        <div class="match-team team-home">
          <div class="team-name" style="text-align:right">${home.name}</div>
          <div class="team-badge" style="background:${home.color};color:${home.textColor}">${home.short}</div>
        </div>
        <div class="match-score-center">
          ${scoreHtml}
        </div>
        <div class="match-team team-away">
          <div class="team-badge" style="background:${away.color};color:${away.textColor}">${away.short}</div>
          <div class="team-name">${away.name}</div>
        </div>
        <div class="match-status-col">
          ${statusBadge(m.status)}
          <div class="click-hint">Détails →</div>
        </div>
      </div>
    </div>`;
}

function switchDay(day) {
  document
    .querySelectorAll(".day-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.day === day));
  document
    .querySelectorAll(".day-section")
    .forEach((s) => s.classList.toggle("active", s.id === "day-" + day));
}

// ===== OUVERTURE DÉTAIL MATCH =====
function openMatchDetail(matchId) {
  window.location.href = `match.html?id=${matchId}`;
}

// ===== INIT =====
renderSponsors();
renderDays();
