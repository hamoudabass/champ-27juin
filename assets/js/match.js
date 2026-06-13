import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  getDocs,
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

/* ─── URL ─────────────────────────────────────────────────── */
const matchId = new URLSearchParams(window.location.search).get("id");

/* ─── ÉTAT LOCAL ──────────────────────────────────────────── */
let allTeams = [];
let allMatches = [];
let teamById = {};
let currentMatch = null;

/* ─── GROUPES DES TABLEAUX ────────────────────────────────── */
// Noms normalisés (minuscules, sans accents, sans espaces superflus)
// pour une comparaison robuste même si la casse diffère dans Firebase
const TABLE_A_NAMES = [
  "feraad",
  "abatoir",
  "q.ali",
  "qali",
  "il jano",
  "iljano",
  "main de lion",
];
const TABLE_B_NAMES = [
  "barwaqo",
  "cite",
  "cité",
  "chateau d'eau",
  "château d'eau",
  "al rahma",
  "cheikh moussa",
];

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire accents
    .trim();
}

function getTableGroup(teamId) {
  const team = teamById[teamId];
  if (!team) return null;
  const n = normalize(team.name);
  if (TABLE_A_NAMES.some((t) => n.includes(normalize(t)))) return "A";
  if (TABLE_B_NAMES.some((t) => n.includes(normalize(t)))) return "B";
  return null; // équipe non classifiée
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

function initials(name = "") {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─── CLASSEMENT ──────────────────────────────────────────── */
function computeStandings() {
  const pts = {};
  allTeams.forEach((t) => {
    pts[t.id] = { id: t.id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  });
  allMatches
    .filter((m) => m.status === "done")
    .forEach((m) => {
      const h = pts[m.homeId],
        a = pts[m.awayId];
      if (!h || !a) return;
      h.p++;
      a.p++;
      h.gf += m.scoreHome;
      h.ga += m.scoreAway;
      a.gf += m.scoreAway;
      a.ga += m.scoreHome;
      if (m.scoreHome > m.scoreAway) {
        h.w++;
        h.pts += 3;
        a.l++;
      } else if (m.scoreHome < m.scoreAway) {
        a.w++;
        a.pts += 3;
        h.l++;
      } else {
        h.d++;
        a.d++;
        h.pts++;
        a.pts++;
      }
    });
  return Object.values(pts).sort(
    (a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga),
  );
}

/* ─── TOPS ────────────────────────────────────────────────── */
function computeTopScorers() {
  const map = {};
  allMatches.forEach((m) =>
    (m.events || [])
      .filter((e) => e.type === "goal")
      .forEach((e) => {
        const k = e.playerName + "|" + e.teamId;
        if (!map[k])
          map[k] = { name: e.playerName, teamId: e.teamId, goals: 0 };
        map[k].goals++;
      }),
  );
  return Object.values(map)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);
}

function computeTopCards(type) {
  const map = {};
  allMatches.forEach((m) =>
    (m.events || [])
      .filter((e) => e.type === type)
      .forEach((e) => {
        const k = e.playerName + "|" + e.teamId;
        if (!map[k])
          map[k] = { name: e.playerName, teamId: e.teamId, count: 0 };
        map[k].count++;
      }),
  );
  return Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/* ─── BADGES ──────────────────────────────────────────────── */
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

function eventIcon(type, scored) {
  if (type === "goal") return "⚽";
  if (type === "yellow") return "🟨";
  if (type === "red") return "🟥";
  if (type === "penalty") return scored ? "⚽ pen." : "❌ pen.";
  if (type === "forfait") return "🚫 Forfait";
  return "•";
}

/* ─── RENDU TABLE DE CLASSEMENT ───────────────────────────── */
function renderStandingsTable(
  rows,
  matchHomeId,
  matchAwayId,
  tableLabel,
  accentColor,
) {
  if (!rows.length) {
    return `<p style="color:var(--text-dim);font-size:13px;padding:12px 0">
              Aucune équipe dans ce groupe.
            </p>`;
  }
  return `
    <div class="standings-group" style="--accent:${accentColor}">
      <div class="standings-group-label"
           style="background:${accentColor}20;border-left:3px solid ${accentColor};
                  padding:8px 14px;margin-bottom:0;
                  font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;
                  letter-spacing:2px;text-transform:uppercase;color:${accentColor}">
        ${tableLabel}
      </div>
      <table class="standings-table">
        <thead>
          <tr>
            <th>#</th><th>Équipe</th>
            <th>J</th><th>V</th><th>N</th><th>D</th>
            <th>BP</th><th>BC</th><th>Diff</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          ${rows
      .map((s, i) => {
        const t = teamById[s.id];
        const name = t ? t.name : s.id;
        const tc = t ? t.color || "#009EDB" : "#009EDB";
        const tt = t ? t.textColor || "#fff" : "#fff";
        const diff = s.gf - s.ga;
        const dc =
          diff > 0 ? "diff-pos" : diff < 0 ? "diff-neg" : "diff-zero";
        const isMatch = s.id === matchHomeId || s.id === matchAwayId;
        return `
            <tr style="${isMatch
            ? "background:rgba(0,158,219,0.08);border-left:2px solid var(--dj-blue);"
            : ""
          }">
              <td><span class="rank-num rank-${i + 1}">${i + 1}</span></td>
              <td>
                <span class="team-badge-sm" style="background:${tc};color:${tt}">
                  ${initials(name)}
                </span>
                ${name}
              </td>
              <td>${s.p}</td><td>${s.w}</td><td>${s.d}</td><td>${s.l}</td>
              <td>${s.gf}</td><td>${s.ga}</td>
              <td class="${dc}">${diff > 0 ? "+" : ""}${diff}</td>
              <td class="pts-cell">${s.pts}</td>
            </tr>`;
      })
      .join("")}
        </tbody>
      </table>
    </div>`;
}

/* ─── PROBABILITÉ DE VICTOIRE basée sur l'historique ── */
function computeWinProbability(homeId, awayId) {
  // Stats globales par équipe : victoires, nuls, défaites, buts marqués/encaissés, matchs joués
  function teamStats(teamId) {
    let played = 0,
      wins = 0,
      draws = 0,
      goalsFor = 0,
      goalsAgainst = 0;
    allMatches
      .filter((m) => m.status === "done")
      .forEach((m) => {
        if (m.homeId === teamId) {
          played++;
          goalsFor += m.scoreHome;
          goalsAgainst += m.scoreAway;
          if (m.scoreHome > m.scoreAway) wins++;
          else if (m.scoreHome === m.scoreAway) draws++;
        } else if (m.awayId === teamId) {
          played++;
          goalsFor += m.scoreAway;
          goalsAgainst += m.scoreHome;
          if (m.scoreAway > m.scoreHome) wins++;
          else if (m.scoreHome === m.scoreAway) draws++;
        }
      });
    return { played, wins, draws, goalsFor, goalsAgainst };
  }

  const h = teamStats(homeId);
  const a = teamStats(awayId);

  // "Force" de chaque équipe = (points par match) + (buts marqués par match) - (buts encaissés par match)
  function strength(s) {
    if (s.played === 0) return 1; // neutre si aucun historique
    const ptsPerGame = (s.wins * 3 + s.draws) / s.played;
    const gfPerGame = s.goalsFor / s.played;
    const gaPerGame = s.goalsAgainst / s.played;
    return Math.max(0.1, ptsPerGame + gfPerGame - gaPerGame + 1); // +1 pour éviter 0
  }

  const sh = strength(h);
  const sa = strength(a);
  const total = sh + sa;

  // Probabilité de victoire de chaque équipe (le nul est réparti proportionnellement)
  let pHome = sh / total;
  let pAway = sa / total;

  // Petite marge pour le match nul (10% fixe, réparti depuis les deux probas)
  const drawShare = 0.1;
  pHome = pHome * (1 - drawShare);
  pAway = pAway * (1 - drawShare);
  const pDraw = 1 - pHome - pAway;

  return {
    home: Math.round(pHome * 100),
    draw: Math.round(pDraw * 100),
    away: Math.round(pAway * 100),
  };
}

/* ─── RENDU PRINCIPAL ─────────────────────────────────────── */
function render() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  if (!currentMatch || !allTeams.length) {
    appEl.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:60px">Chargement…</p>`;
    return;
  }

  const m = currentMatch;
  const isBracketMatch = m.round && m.round !== "poule";
  const home = teamById[m.homeId];
  const away = teamById[m.awayId];

  const homeName = home ? home.name : m.homeId;
  const awayName = away ? away.name : m.awayId;
  const homeColor = home ? home.color || "#009EDB" : "#009EDB";
  const awayColor = away ? away.color || "#007A3D" : "#007A3D";
  const homeTxt = home ? home.textColor || "#fff" : "#fff";
  const awayTxt = away ? away.textColor || "#fff" : "#fff";

  /* ── Classement → séparer A / B / non classifié ── */
  const allStandings = computeStandings();
  const standA = allStandings.filter((s) => getTableGroup(s.id) === "A");
  const standB = allStandings.filter((s) => getTableGroup(s.id) === "B");
  const standX = allStandings.filter((s) => getTableGroup(s.id) === null);

  /* ── Tops ── */
  const scorers = computeTopScorers();
  const yellows = computeTopCards("yellow");
  const reds = computeTopCards("red");

  function topRows(list, valueKey, unit, colorStyle) {
    if (!list.length)
      return `<div class="top-row"><span style="color:var(--text-dim);font-size:13px">Aucun</span></div>`;
    return list
      .map((p, i) => {
        const t = teamById[p.teamId];
        const tc = t ? t.color || "#009EDB" : "#009EDB";
        const tt = t ? t.textColor || "#fff" : "#fff";
        const tn = t ? initials(t.name) : "?";
        return `<div class="top-row">
        <span class="top-rank">${i + 1}</span>
        <div class="top-team-badge" style="background:${tc};color:${tt}">${tn}</div>
        <span class="top-player-name">${p.name}</span>
        <span class="top-value" style="${colorStyle}">${p[valueKey]} ${unit}</span>
      </div>`;
      })
      .join("");
  }

  /* ── Score + événements ── */
  const scoreHtml =
    m.scoreHome !== null && m.scoreHome !== undefined
      ? `<div class="hero-score-nums">
         <span style="color:${homeColor}">${m.scoreHome}</span>
         <span class="hero-score-sep">—</span>
         <span style="color:${awayColor}">${m.scoreAway}</span>
       </div>`
      : `<div style="font-family:'Oswald',sans-serif;font-size:36px;
                   color:var(--text-dim);letter-spacing:4px">VS</div>`;

  const events = [...(m.events || [])].sort((a, b) => a.minute - b.minute);
  const eventsHtml = events.length
    ? events
      .map((e) => {
        const isHome = e.teamId === m.homeId;
        const t = teamById[e.teamId];
        const tName = t ? initials(t.name) : "?";
        return `
          <div class="event-row"
               style="${isHome ? "" : "flex-direction:row-reverse;text-align:right"}">
            <span class="event-min">${e.minute}'</span>
            <span class="event-icon">${eventIcon(e.type, e.scored)}</span>
            <span class="event-label">${e.playerName || ""}</span>
            <span class="event-team">${tName}</span>
          </div>`;
      })
      .join("")
    : `<p style="color:var(--text-dim);font-size:13px">Aucun événement enregistré.</p>`;

  const dateFormatted = m.day ? m.day.split("-").reverse().join("/") : "—";

  // Arbitres
  const arbitres = m.arbitres || {};
  const arbitresHtml = arbitres.principal
    ? `
  <div class="arbitres-panel">
    <div class="arbitres-title">⚖️ Officiels du match</div>
    <div class="arbitre-row">
      <span class="arbitre-role">Arbitre principal</span>
      <span class="arbitre-name">${arbitres.principal}</span>
    </div>
    ${arbitres.assistant1
      ? `
    <div class="arbitre-row">
      <span class="arbitre-role">Assistant 1</span>
      <span class="arbitre-name">${arbitres.assistant1}</span>
    </div>`
      : ""
    }
  </div>`
    : "";

  /* ── Assemblage ── */
  appEl.innerHTML = `
  ${isBracketMatch
      ? (() => {
        const prob = computeWinProbability(m.homeId, m.awayId);
        return `
    <div class="section-header" style="margin-top:32px">
      <div class="section-line"></div>
      <h2>Probabilité de victoire</h2>
      <div class="section-line" style="transform:scaleX(-1)"></div>
    </div>
    <div class="prob-card">
      <div class="prob-row">
        <span class="prob-team" style="color:${homeColor}">${homeName}</span>
        <span class="prob-value" style="color:${homeColor}">${prob.home}%</span>
      </div>
      <div class="prob-bar">
        <div class="prob-bar-home" style="width:${prob.home}%;background:${homeColor}"></div>
        <div class="prob-bar-draw" style="width:${prob.draw}%"></div>
        <div class="prob-bar-away" style="width:${prob.away}%;background:${awayColor}"></div>
      </div>
      <div class="prob-row">
        <span class="prob-team" style="color:${awayColor}">${awayName}</span>
        <span class="prob-value" style="color:${awayColor}">${prob.away}%</span>
      </div>
      <div class="prob-draw-label">Match nul : ${prob.draw}%</div>
    </div>`;
      })()
      : ""
    }
    <!-- ③ SCORE DU MATCH -->
    <div class="section-header" style="margin-top:32px">
      <div class="section-line"></div>
      <h2>Score du match</h2>
      <div class="section-line" style="transform:scaleX(-1)"></div>
    </div>
    <div class="match-score-hero">
      <div class="match-hero-top">
        <span class="field-label">
          ${dateFormatted} · ${m.time || "--:--"} · ${m.field || ""}
        </span>
        ${statusBadge(m.status || "upcoming")}
      </div>
      <div class="match-hero-body">
        <div class="hero-team">
          <div class="hero-team-badge"
               style="background:${homeColor};color:${homeTxt};
                      width:72px;height:72px;font-size:22px">
            ${initials(homeName)}
          </div>
          <div class="hero-team-name">${homeName}</div>
        </div>
        <div class="hero-score-center">
          ${scoreHtml}
          <div class="hero-time-info">${m.time || ""} — ${m.field || ""}</div>
        </div>
        <div class="hero-team">
          <div class="hero-team-badge"
               style="background:${awayColor};color:${awayTxt};
                      width:72px;height:72px;font-size:22px">
            ${initials(awayName)}
          </div>
          <div class="hero-team-name">${awayName}</div>
        </div>
      </div>
      ${arbitresHtml}
      <div class="events-list">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;
                    letter-spacing:2px;text-transform:uppercase;
                    color:var(--text-dim);margin-bottom:8px">
          Événements du match
        </div>
        ${eventsHtml}
      </div>
    </div>

    <!-- ① CLASSEMENTS A & B -->
   ${!isBracketMatch
      ? `
<div class="section-header">
  <div class="section-line"></div>
  <h2>Classements</h2>
  <div class="section-line" style="transform:scaleX(-1)"></div>
</div>

<div class="standings-grid">
  ${renderStandingsTable(standA, m.homeId, m.awayId, "Tableau A", "#009EDB")}
  ${renderStandingsTable(standB, m.homeId, m.awayId, "Tableau B", "#007A3D")}
</div>

${standX.length
        ? `
<div style="margin-top:14px">
  ${renderStandingsTable(standX, m.homeId, m.awayId, "Autres équipes", "#C8A96E")}
</div>`
        : ""
      }
`
      : ""
    }
    <!-- ② STATISTIQUES -->
    <div class="section-header" style="margin-top:32px">
      <div class="section-line"></div>
      <h2>Statistiques du championnat</h2>
      <div class="section-line" style="transform:scaleX(-1)"></div>
    </div>
    <div class="tops-grid">
      <div class="top-card">
        <div class="top-card-header">
          <div class="top-card-icon" style="background:rgba(0,158,219,0.15)">⚽</div>
          <h3>Top Buteurs</h3>
        </div>
        ${topRows(scorers, "goals", "⚽", "color:var(--dj-blue)")}
      </div>
      <div class="top-card">
        <div class="top-card-header">
          <div class="top-card-icon" style="background:rgba(255,215,0,0.15)">🟨</div>
          <h3>Cartons Jaunes</h3>
        </div>
        ${topRows(yellows, "count", "🟨", "color:#FFD700")}
      </div>
      <div class="top-card">
        <div class="top-card-header">
          <div class="top-card-icon" style="background:rgba(206,17,38,0.15)">🟥</div>
          <h3>Cartons Rouges</h3>
        </div>
        ${topRows(reds, "count", "🟥", "color:var(--dj-red)")}
      </div>
    </div>

  `;
}

/* ─── CHARGEMENT ──────────────────────────────────────────── */
if (!matchId) {
  document.getElementById("app").innerHTML =
    `<p style="color:var(--dj-red);text-align:center;padding:40px">
       Aucun match sélectionné.
     </p>`;
} else {
  getDocs(collection(db, "teams")).then((snap) => {
    snap.docs.forEach((d, i) => {
      const raw = d.data();
      const fallback = teamColor(i);
      const team = {
        id: d.id,
        name: raw.name || d.id,
        color: raw.color || fallback.color,
        textColor: raw.textColor || fallback.textColor,
      };
      allTeams.push(team);
      teamById[team.id] = team;
    });

    getDocs(collection(db, "matches")).then((snap2) => {
      snap2.forEach((d) => allMatches.push({ id: d.id, ...d.data() }));

      onSnapshot(doc(db, "matches", matchId), (docSnap) => {
        if (!docSnap.exists()) {
          document.getElementById("app").innerHTML =
            `<p style="color:var(--dj-red);text-align:center;padding:40px">
               Match introuvable.
             </p>`;
          return;
        }
        currentMatch = { id: docSnap.id, ...docSnap.data() };
        const idx = allMatches.findIndex((x) => x.id === matchId);
        if (idx >= 0) allMatches[idx] = currentMatch;
        else allMatches.push(currentMatch);
        render();
      });
    });
  });
}
