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
const db  = getFirestore(app);

/* ─── ID DU MATCH DEPUIS L'URL ───────────────────────────── */
const matchId = new URLSearchParams(window.location.search).get("id");

/* ─── ÉTAT LOCAL ──────────────────────────────────────────── */
let allTeams   = [];
let allMatches = [];
let teamById   = {};
let currentMatch = null;

const DEFAULT_COLORS = [
  { color: "#009EDB", textColor: "#fff"     },
  { color: "#007A3D", textColor: "#fff"     },
  { color: "#CE1126", textColor: "#fff"     },
  { color: "#C8A96E", textColor: "#0A1628" },
  { color: "#1A3358", textColor: "#fff"     },
  { color: "#2ECC71", textColor: "#0A1628" },
  { color: "#E67E22", textColor: "#fff"     },
  { color: "#8E44AD", textColor: "#fff"     },
  { color: "#16A085", textColor: "#fff"     },
  { color: "#C0392B", textColor: "#fff"     },
];

function teamColor(index) {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function initials(name = "") {
  return name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── CALCUL CLASSEMENT ──────────────────────────────────── */
function computeStandings() {
  const pts = {};
  allTeams.forEach(t => {
    pts[t.id] = { id: t.id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  });
  allMatches
    .filter(m => m.status === "done")
    .forEach(m => {
      const h = pts[m.homeId], a = pts[m.awayId];
      if (!h || !a) return;
      h.p++; a.p++;
      h.gf += m.scoreHome; h.ga += m.scoreAway;
      a.gf += m.scoreAway; a.ga += m.scoreHome;
      if (m.scoreHome > m.scoreAway)      { h.w++; h.pts += 3; a.l++; }
      else if (m.scoreHome < m.scoreAway) { a.w++; a.pts += 3; h.l++; }
      else                                { h.d++; a.d++; h.pts++; a.pts++; }
    });
  return Object.values(pts).sort(
    (a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga)
  );
}

/* ─── CALCUL TOPS ─────────────────────────────────────────── */
function computeTopScorers() {
  const map = {};
  allMatches.forEach(m => {
    (m.events || []).filter(e => e.type === "goal").forEach(e => {
      const k = e.playerName + "|" + e.teamId;
      if (!map[k]) map[k] = { name: e.playerName, teamId: e.teamId, goals: 0 };
      map[k].goals++;
    });
  });
  return Object.values(map).sort((a, b) => b.goals - a.goals).slice(0, 5);
}

function computeTopCards(type) {
  const map = {};
  allMatches.forEach(m => {
    (m.events || []).filter(e => e.type === type).forEach(e => {
      const k = e.playerName + "|" + e.teamId;
      if (!map[k]) map[k] = { name: e.playerName, teamId: e.teamId, count: 0 };
      map[k].count++;
    });
  });
  return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
}

/* ─── BADGE STATUT ────────────────────────────────────────── */
function statusBadge(status) {
  const cfg = {
    live:     { cls: "badge-live",     label: '<span class="dot"></span> En cours' },
    half:     { cls: "badge-half",     label: "Mi-temps"  },
    done:     { cls: "badge-done",     label: "Terminé"   },
    upcoming: { cls: "badge-upcoming", label: "À venir"   },
  };
  const c = cfg[status] || cfg.upcoming;
  return `<span class="status-badge ${c.cls}">${c.label}</span>`;
}

/* ─── ICÔNE ÉVÉNEMENT ─────────────────────────────────────── */
function eventIcon(type, scored) {
  if (type === "goal")    return "⚽";
  if (type === "yellow")  return "🟨";
  if (type === "red")     return "🟥";
  if (type === "penalty") return scored ? "⚽ pen." : "❌ pen.";
  return "•";
}

/* ─── RENDU PRINCIPAL ────────────────────────────────────── */
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (!currentMatch || !allTeams.length) {
    app.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:60px">Chargement…</p>`;
    return;
  }

  const m    = currentMatch;
  const home = teamById[m.homeId];
  const away = teamById[m.awayId];

  const homeName  = home ? home.name  : m.homeId;
  const awayName  = away ? away.name  : m.awayId;
  const homeColor = home ? (home.color     || "#009EDB") : "#009EDB";
  const awayColor = away ? (away.color     || "#007A3D") : "#007A3D";
  const homeTxt   = home ? (home.textColor || "#fff")    : "#fff";
  const awayTxt   = away ? (away.textColor || "#fff")    : "#fff";

  const standings = computeStandings();
  const scorers   = computeTopScorers();
  const yellows   = computeTopCards("yellow");
  const reds      = computeTopCards("red");

  /* ── 1. CLASSEMENT ── */
  const standHtml = `
    <table class="standings-table">
      <thead>
        <tr>
          <th>#</th><th>Équipe</th>
          <th>J</th><th>V</th><th>N</th><th>D</th>
          <th>BP</th><th>BC</th><th>Diff</th><th>Pts</th>
        </tr>
      </thead>
      <tbody>
        ${standings.map((s, i) => {
          const t    = teamById[s.id];
          const name = t ? t.name : s.id;
          const tc   = t ? (t.color || "#009EDB") : "#009EDB";
          const tt   = t ? (t.textColor || "#fff") : "#fff";
          const diff = s.gf - s.ga;
          const dc   = diff > 0 ? "diff-pos" : diff < 0 ? "diff-neg" : "diff-zero";
          const isMatch = (s.id === m.homeId || s.id === m.awayId);
          return `
          <tr style="${isMatch ? "background:rgba(0,158,219,0.07);border-left:2px solid var(--dj-blue);" : ""}">
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
        }).join("")}
      </tbody>
    </table>`;

  /* ── 2. TOP BUTEURS ── */
  function topRows(list, valueKey, unit, colorStyle) {
    if (!list.length) return `<div class="top-row"><span style="color:var(--text-dim);font-size:13px">Aucun</span></div>`;
    return list.map((p, i) => {
      const t  = teamById[p.teamId];
      const tc = t ? (t.color || "#009EDB") : "#009EDB";
      const tt = t ? (t.textColor || "#fff") : "#fff";
      const tn = t ? initials(t.name) : "?";
      return `<div class="top-row">
        <span class="top-rank">${i + 1}</span>
        <div class="top-team-badge" style="background:${tc};color:${tt}">${tn}</div>
        <span class="top-player-name">${p.name}</span>
        <span class="top-value" style="${colorStyle}">${p[valueKey]} ${unit}</span>
      </div>`;
    }).join("");
  }

  /* ── 3. SCORE + ÉVÉNEMENTS ── */
  const scoreHtml = m.scoreHome !== null && m.scoreHome !== undefined
    ? `<div class="hero-score-nums">
        <span style="color:${homeColor}">${m.scoreHome}</span>
        <span class="hero-score-sep">—</span>
        <span style="color:${awayColor}">${m.scoreAway}</span>
       </div>`
    : `<div style="font-family:'Oswald',sans-serif;font-size:36px;
                   color:var(--text-dim);letter-spacing:4px">VS</div>`;

  const events = [...(m.events || [])].sort((a, b) => a.minute - b.minute);
  const eventsHtml = events.length
    ? events.map(e => {
        const isHome = e.teamId === m.homeId;
        const t = teamById[e.teamId];
        const tName = t ? initials(t.name) : "?";
        return `
          <div class="event-row" style="${isHome ? "" : "flex-direction:row-reverse;text-align:right"}">
            <span class="event-min">${e.minute}'</span>
            <span class="event-icon">${eventIcon(e.type, e.scored)}</span>
            <span class="event-label">${e.playerName || ""}</span>
            <span class="event-team">${tName}</span>
          </div>`;
      }).join("")
    : `<p style="color:var(--text-dim);font-size:13px">Aucun événement enregistré.</p>`;

  const dateFormatted = m.day
    ? m.day.split("-").reverse().join("/")
    : "—";

  /* ── ASSEMBLAGE ── */
  app.innerHTML = `

    <!-- CLASSEMENT -->
    <div class="section-header">
      <div class="section-line"></div>
      <h2>Classement général</h2>
      <div class="section-line" style="transform:scaleX(-1)"></div>
    </div>
    ${standHtml}

    <!-- STATS -->
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

    <!-- SCORE DU MATCH -->
    <div class="section-header" style="margin-top:32px">
      <div class="section-line"></div>
      <h2>Score du match</h2>
      <div class="section-line" style="transform:scaleX(-1)"></div>
    </div>
    <div class="match-score-hero">
      <div class="match-hero-top">
        <span class="field-label">${dateFormatted} · ${m.time || "--:--"} · ${m.field || ""}</span>
        ${statusBadge(m.status || "upcoming")}
      </div>
      <div class="match-hero-body">
        <div class="hero-team">
          <div class="hero-team-badge"
               style="background:${homeColor};color:${homeTxt};width:72px;height:72px;font-size:22px">
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
               style="background:${awayColor};color:${awayTxt};width:72px;height:72px;font-size:22px">
            ${initials(awayName)}
          </div>
          <div class="hero-team-name">${awayName}</div>
        </div>
      </div>
      <div class="events-list">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;
                    letter-spacing:2px;text-transform:uppercase;
                    color:var(--text-dim);margin-bottom:8px">
          Événements du match
        </div>
        ${eventsHtml}
      </div>
    </div>
  `;
}

/* ─── CHARGEMENT INITIAL ─────────────────────────────────── */
if (!matchId) {
  document.getElementById("app").innerHTML =
    `<p style="color:var(--dj-red);text-align:center;padding:40px">
       Aucun match sélectionné.
     </p>`;
} else {
  // Charger toutes les équipes une fois
  getDocs(collection(db, "teams")).then(snap => {
    snap.forEach((d, i) => {
      const raw      = d.data();
      const fallback = teamColor(i);
      const team = {
        id:        d.id,
        name:      raw.name      || d.id,
        color:     raw.color     || fallback.color,
        textColor: raw.textColor || fallback.textColor,
      };
      allTeams.push(team);
      teamById[team.id] = team;
    });

    // Charger tous les matchs une fois pour les stats globales
    getDocs(collection(db, "matches")).then(snap2 => {
      snap2.forEach(d => allMatches.push({ id: d.id, ...d.data() }));

      // Écouter ce match en temps réel (score live, événements)
      onSnapshot(doc(db, "matches", matchId), docSnap => {
        if (!docSnap.exists()) {
          document.getElementById("app").innerHTML =
            `<p style="color:var(--dj-red);text-align:center;padding:40px">
               Match introuvable.
             </p>`;
          return;
        }
        currentMatch = { id: docSnap.id, ...docSnap.data() };

        // Mettre à jour ce match dans allMatches pour les stats
        const idx = allMatches.findIndex(x => x.id === matchId);
        if (idx >= 0) allMatches[idx] = currentMatch;
        else allMatches.push(currentMatch);

        render();
      });
    });
  });
}
