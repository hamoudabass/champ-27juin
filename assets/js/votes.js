import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  increment,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* ─── CONFIG (même que index.js) ─────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyCnpck3ez1b1oD9A9-cfMKMPm1I1WONXYY",
  authDomain: "championnat-alisabieh-2026.firebaseapp.com",
  projectId: "championnat-alisabieh-2026",
  storageBucket: "championnat-alisabieh-2026.firebasestorage.app",
  messagingSenderId: "971207034843",
  appId: "1:971207034843:web:dac112b526239ff75fc9fe",
};

// Réutilise l'app Firebase si déjà initialisée
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ─── STATE LOCAL ─────────────────────────────────────────── */
let allTeams = [];
let allMatches = [];
let teamById = {};

/* ─── INITIALES ───────────────────────────────────────────── */
function initials(name = "") {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─── LECTURE LOCALSTORAGE ────────────────────────────────── */
function hasVoted(key) {
  return localStorage.getItem("voted_" + key) !== null;
}
function saveVote(key, value) {
  localStorage.setItem("voted_" + key, value);
}
function getVote(key) {
  return localStorage.getItem("voted_" + key);
}

/* ═══════════════════════════════════════════════════════════
   SECTION 1 — PRONOSTIC DU PROCHAIN MATCH
   ═══════════════════════════════════════════════════════════ */

function getNextMatch() {
  // Les rounds éligibles au pronostic (on exclut les matchs de poules)
  const bracketRounds = ["quart", "demi", "finale", "petite-finale"];

  // D'abord chercher un match en cours (live ou mi-temps) dans la phase finale
  const live = allMatches.find(m =>
    (m.status === "live" || m.status === "half") &&
    bracketRounds.includes(m.round)
  );
  if (live) return live;

  // Sinon le prochain match "upcoming" de la phase finale avec date définie
  const upcomingBracket = allMatches
    .filter(m =>
      m.status === "upcoming" &&
      m.day && m.day !== "A_DEFINIR" &&
      bracketRounds.includes(m.round)
    )
    .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));

  if (upcomingBracket.length) return upcomingBracket[0];

  // Fallback : n'importe quel prochain match upcoming (poules ou autre)
  const upcoming = allMatches
    .filter(m => m.status === "upcoming" && m.day && m.day !== "A_DEFINIR")
    .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));

  return upcoming[0] || null;
}

async function renderPronostic() {
  const el = document.getElementById("pronosticContent");
  if (!el) return;

  const m = getNextMatch();
  if (!m) {
    el.innerHTML = `<p class="vote-empty">Aucun match à venir pour le moment.</p>`;
    return;
  }

  const home = teamById[m.homeId];
  const away = teamById[m.awayId];
  const homeName = home?.name || m.homeId;
  const awayName = away?.name || m.awayId;
  const homeColor = home?.color || "#009EDB";
  const awayColor = away?.color || "#007A3D";
  const homeTxt = home?.textColor || "#fff";
  const awayTxt = away?.textColor || "#fff";

  const voteKey = "pronostic_" + m.id;
  const alreadyVoted = hasVoted(voteKey);
  const myVote = getVote(voteKey);

  // Lire les votes depuis Firestore
  const voteRef = doc(db, "votes", "pronostics_" + m.id);
  const voteSnap = await getDoc(voteRef);
  const data = voteSnap.exists()
    ? voteSnap.data()
    : { home: 0, draw: 0, away: 0 };
  const total = (data.home || 0) + (data.draw || 0) + (data.away || 0);

  function pct(val) {
    return total > 0 ? Math.round((val / total) * 100) : 0;
  }

  const pHome = pct(data.home);
  const pDraw = pct(data.draw);
  const pAway = pct(data.away);

  const isLive = m.status === "live" || m.status === "half";

  el.innerHTML = `
    <div class="pronostic-card">
      <div class="pronostic-teams">
        <div class="pronostic-team">
          <div class="pronostic-badge" style="background:${homeColor};color:${homeTxt}">
            ${initials(homeName)}
          </div>
          <span class="pronostic-name">${homeName}</span>
        </div>
        <span class="pronostic-vs">VS</span>
        <div class="pronostic-team">
          <div class="pronostic-badge" style="background:${awayColor};color:${awayTxt}">
            ${initials(awayName)}
          </div>
          <span class="pronostic-name">${awayName}</span>
        </div>
      </div>

      ${!alreadyVoted && !isLive
      ? `
        <div class="vote-btns">
          <button class="vote-btn" style="border-color:${homeColor};color:${homeColor}"
                  onclick="votePronostic('${m.id}', 'home')">
            ${homeName} gagne
          </button>
          <button class="vote-btn vote-btn-draw"
                  onclick="votePronostic('${m.id}', 'draw')">
            Match nul
          </button>
          <button class="vote-btn" style="border-color:${awayColor};color:${awayColor}"
                  onclick="votePronostic('${m.id}', 'away')">
            ${awayName} gagne
          </button>
        </div>`
      : ""
    }

      ${isLive ? `<p class="vote-locked">🔒 Vote fermé — match en cours</p>` : ""}

      ${alreadyVoted
      ? `<p class="vote-my-choice">
        Votre vote : <strong>${myVote === "home" ? homeName : myVote === "away" ? awayName : "Match nul"}</strong>
      </p>`
      : ""
    }

      <div class="vote-results">
        ${renderVoteBar(homeName, data.home, pHome, homeColor)}
        ${renderVoteBar("Match nul", data.draw, pDraw, "#8BA3C0")}
        ${renderVoteBar(awayName, data.away, pAway, awayColor)}
        <p class="vote-total">${total} vote${total > 1 ? "s" : ""} au total</p>
      </div>
    </div>`;
}

window.votePronostic = async (matchId, choice) => {
  const voteKey = "pronostic_" + matchId;
  if (hasVoted(voteKey)) return;

  const voteRef = doc(db, "votes", "pronostics_" + matchId);
  const snap = await getDoc(voteRef);

  if (!snap.exists()) {
    await setDoc(voteRef, { home: 0, draw: 0, away: 0, [choice]: 1 });
  } else {
    await updateDoc(voteRef, { [choice]: increment(1) });
  }

  saveVote(voteKey, choice);
  renderPronostic();
};

/* ═══════════════════════════════════════════════════════════
   SECTION 2 — MEILLEURE ÉQUIPE
   ═══════════════════════════════════════════════════════════ */

async function renderBestTeam() {
  const el = document.getElementById("bestTeamContent");
  if (!el) return;

  const voteRef = doc(db, "votes", "bestTeam");
  const voteSnap = await getDoc(voteRef);
  const data = voteSnap.exists() ? voteSnap.data() : {};

  const total = Object.values(data).reduce((s, v) => s + v, 0);
  const alreadyVoted = hasVoted("bestTeam");
  const myVote = getVote("bestTeam");

  function pct(teamId) {
    return total > 0 ? Math.round(((data[teamId] || 0) / total) * 100) : 0;
  }

  const sortedTeams = [...allTeams].sort(
    (a, b) => (data[b.id] || 0) - (data[a.id] || 0),
  );

  el.innerHTML = `
    <div class="team-vote-grid">
      ${allTeams
      .map((t) => {
        const voted = alreadyVoted && myVote === t.id;
        return `
          <button class="team-vote-card ${voted ? "team-voted" : ""} ${alreadyVoted ? "vote-disabled" : ""}"
                  onclick="voteBestTeam('${t.id}')"
                  ${alreadyVoted ? "disabled" : ""}>
            <div class="team-vote-badge" style="background:${t.color};color:${t.textColor}">
              ${initials(t.name)}
            </div>
            <span class="team-vote-name">${t.name}</span>
            ${voted ? `<span class="voted-check">✓ Mon vote</span>` : ""}
          </button>`;
      })
      .join("")}
    </div>

    ${alreadyVoted
      ? `
    <div class="vote-results" style="margin-top:16px">
      <p style="font-family:'Barlow Condensed',sans-serif;font-size:11px;
                letter-spacing:2px;text-transform:uppercase;color:var(--text-dim);
                margin-bottom:12px">Résultats (${total} votes)</p>
      ${sortedTeams
        .map((t) => renderVoteBar(t.name, data[t.id] || 0, pct(t.id), t.color))
        .join("")}
    </div>`
      : `
    <p class="vote-hint">Cliquez sur une équipe pour voter</p>`
    }
  `;
}

window.voteBestTeam = async (teamId) => {
  if (hasVoted("bestTeam")) return;

  const voteRef = doc(db, "votes", "bestTeam");
  const snap = await getDoc(voteRef);

  if (!snap.exists()) {
    await setDoc(voteRef, { [teamId]: 1 });
  } else {
    await updateDoc(voteRef, { [teamId]: increment(1) });
  }

  saveVote("bestTeam", teamId);
  renderBestTeam();
};

/* ═══════════════════════════════════════════════════════════
   SECTION 3 — MVP DU TOURNOI
   ═══════════════════════════════════════════════════════════ */

function getMVPCandidates() {
  // Construit la liste des buteurs depuis tous les matchs terminés
  const map = {};
  allMatches.forEach((m) => {
    (m.events || [])
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
    .slice(0, 8);
}

async function renderMVP() {
  const el = document.getElementById("mvpContent");
  if (!el) return;

  const candidates = getMVPCandidates();

  if (!candidates.length) {
    el.innerHTML = `<p class="vote-empty">Aucun buteur enregistré pour le moment.</p>`;
    return;
  }

  const voteRef = doc(db, "votes", "mvp");
  const voteSnap = await getDoc(voteRef);
  const data = voteSnap.exists() ? voteSnap.data() : {};

  const total = Object.values(data).reduce((s, v) => s + v, 0);
  const alreadyVoted = hasVoted("mvp");
  const myVote = getVote("mvp");

  function pct(key) {
    return total > 0 ? Math.round(((data[key] || 0) / total) * 100) : 0;
  }

  el.innerHTML = `
    <div class="mvp-list">
      ${candidates
      .map((p) => {
        const key = p.name + "|" + p.teamId;
        const t = teamById[p.teamId];
        const color = t?.color || "#009EDB";
        const txt = t?.textColor || "#fff";
        const voted = alreadyVoted && myVote === key;

        return `
          <div class="mvp-row ${voted ? "mvp-voted" : ""} ${alreadyVoted ? "vote-disabled" : ""}"
               onclick="${alreadyVoted ? "" : `voteMVP('${key}')`}">
            <div class="mvp-badge" style="background:${color};color:${txt}">
              ${initials(p.name)}
            </div>
            <div class="mvp-info">
              <span class="mvp-name">${p.name}</span>
              <span class="mvp-team">${t?.name || p.teamId} — ${p.goals} but${p.goals > 1 ? "s" : ""}</span>
            </div>
            ${alreadyVoted
            ? `<div class="mvp-pct-bar">
                   <div class="mvp-pct-fill" style="width:${pct(key)}%;background:${color}"></div>
                 </div>
                 <span class="mvp-pct-label">${pct(key)}%</span>`
            : `<span class="mvp-vote-label">${voted ? "✓ Mon vote" : "Voter"}</span>`
          }
          </div>`;
      })
      .join("")}
    </div>
    ${alreadyVoted
      ? `<p class="vote-total" style="margin-top:12px">${total} vote${total > 1 ? "s" : ""} au total</p>`
      : `<p class="vote-hint">Votez pour le meilleur joueur du tournoi</p>`
    }
  `;
}

window.voteMVP = async (key) => {
  if (hasVoted("mvp")) return;

  const voteRef = doc(db, "votes", "mvp");
  const snap = await getDoc(voteRef);

  if (!snap.exists()) {
    await setDoc(voteRef, { [key]: 1 });
  } else {
    await updateDoc(voteRef, { [key]: increment(1) });
  }

  saveVote("mvp", key);
  renderMVP();
};

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PARTAGÉ — BARRE DE RÉSULTAT
   ═══════════════════════════════════════════════════════════ */

function renderVoteBar(label, count, pct, color) {
  return `
    <div class="vote-bar-row">
      <span class="vote-bar-label">${label}</span>
      <div class="vote-bar-track">
        <div class="vote-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="vote-bar-pct">${pct}%</span>
      <span class="vote-bar-count">(${count})</span>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   POINT D'ENTRÉE — appelé depuis index.js
   ═══════════════════════════════════════════════════════════ */

window._renderVotes = async function() {
  await renderPronostic();
  await renderBestTeam();
  await renderMVP();
};

// Écoute les données partagées depuis index.js via les variables globales
// On re-render toutes les 10 secondes si l'onglet est ouvert
setInterval(() => {
  if (document.getElementById("votesView")?.classList.contains("active")) {
    // Resync des données depuis window (remplies par index.js)
    if (window._teams) {
      allTeams = window._teams;
      teamById = window._teamById;
    }
    if (window._matches) {
      allMatches = window._matches;
    }
    window._renderVotes();
  }
}, 10000);

// Sync initiale
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (window._teams) {
      allTeams = window._teams;
      teamById = window._teamById;
    }
    if (window._matches) {
      allMatches = window._matches;
    }
  }, 2000);
});
