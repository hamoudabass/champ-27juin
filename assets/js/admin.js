import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* ─── CONFIG ──────────────────────────────────────────────── */
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
const auth = getAuth(app);

/* ─── AUTH GUARD ─────────────────────────────────────────── */
onAuthStateChanged(auth, (user) => {
  if (!user) window.location = "login.html";
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location = "login.html";
});

/* ─── ÉTAT LOCAL ──────────────────────────────────────────── */
let teams = [];
let matches = [];

/* ─── UTILITAIRES UI ──────────────────────────────────────── */
function toast(msg, ok = true) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.background = ok ? "#007A3D" : "#CE1126";
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function setLoading(btnId, loading) {
  const b = document.getElementById(btnId);
  if (!b) return;
  b.disabled = loading;
  b.textContent = loading ? "…" : b.dataset.label;
}

/* ─── NAVIGATION ONGLETS ADMIN ───────────────────────────── */
window.showTab = function(tabId) {
  document
    .querySelectorAll(".tab-section")
    .forEach((s) => s.classList.toggle("active", s.id === tabId));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
};

/* ═══════════════════════════════════════════════════════════
   ONGLET 1 — MATCHS
   ═══════════════════════════════════════════════════════════ */

function fillTeamSelects() {
  ["homeTeam", "awayTeam", "matchTeamSelect"].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = `<option value="">— Choisir une équipe —</option>`;
    teams.forEach((t) => {
      sel.innerHTML += `<option value="${t.id}">${t.name}</option>`;
    });
    sel.value = cur;
  });
}

function fillMatchSelects() {
  ["matchSelect", "eventMatch"].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = `<option value="">— Choisir un match —</option>`;
    matches
      .sort(
        (a, b) =>
          (a.day || "").localeCompare(b.day || "") ||
          (a.time || "").localeCompare(b.time || ""),
      )
      .forEach((m) => {
        const home = teams.find((t) => t.id === m.homeId)?.name || m.homeId;
        const away = teams.find((t) => t.id === m.awayId)?.name || m.awayId;
        const label = `${m.day || "?"} ${m.time || ""} — ${home} vs ${away}`;
        sel.innerHTML += `<option value="${m.id}">${label}</option>`;
      });
    sel.value = cur;
  });

  renderMatchesTable();
}

function renderMatchesTable() {
  const tbody = document.getElementById("matchesTableBody");
  if (!tbody) return;

  if (!matches.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-dim)">Aucun match</td></tr>`;
    return;
  }

  const sorted = [...matches].sort(
    (a, b) =>
      (a.day || "").localeCompare(b.day || "") ||
      (a.time || "").localeCompare(b.time || ""),
  );

  tbody.innerHTML = sorted
    .map((m) => {
      const home = teams.find((t) => t.id === m.homeId)?.name || m.homeId;
      const away = teams.find((t) => t.id === m.awayId)?.name || m.awayId;
      const score =
        m.scoreHome !== null && m.scoreHome !== undefined
          ? `${m.scoreHome} — ${m.scoreAway}`
          : "— vs —";
      const statusLabels = {
        upcoming: "À venir",
        live: "En cours",
        half: "Mi-temps",
        done: "Terminé",
      };
      return `
      <tr>
        <td>${m.day || "—"} ${m.time || ""}</td>
        <td>${home}</td>
        <td>${away}</td>
        <td>${score}</td>
        <td><span class="status-pill status-${m.status || "upcoming"}">${statusLabels[m.status] || "À venir"}</span></td>
        <td>
          <button class="btn-sm btn-danger" onclick="deleteMatch('${m.id}')">Suppr.</button>
        </td>
      </tr>`;
    })
    .join("");
}

/* Créer un match */
window.createMatch = async () => {
  const day = document.getElementById("newDay").value;
  const homeId = document.getElementById("homeTeam").value;
  const awayId = document.getElementById("awayTeam").value;
  const time = document.getElementById("newTime").value;
  const field = document.getElementById("field").value;

  if (!day || !homeId || !awayId || !time) {
    toast("Remplissez tous les champs obligatoires", false);
    return;
  }
  if (homeId === awayId) {
    toast("L'équipe domicile et extérieure doivent être différentes", false);
    return;
  }

  try {
    await addDoc(collection(db, "matches"), {
      day,
      homeId,
      awayId,
      time,
      field: field || "",
      status: "upcoming",
      scoreHome: null,
      scoreAway: null,
      events: [],
      createdAt: serverTimestamp(),
    });
    toast("Match créé ✓");
    ["newDay", "newTime", "field"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  } catch (e) {
    toast("Erreur : " + e.message, false);
  }
};

/* Mettre à jour score + statut */
window.saveMatch = async () => {
  const id = document.getElementById("matchSelect").value;
  const status = document.getElementById("status").value;
  const shRaw = document.getElementById("scoreHome").value;
  const saRaw = document.getElementById("scoreAway").value;

  if (!id) {
    toast("Sélectionnez un match", false);
    return;
  }

  const update = { status };
  if (shRaw !== "" && saRaw !== "") {
    update.scoreHome = parseInt(shRaw);
    update.scoreAway = parseInt(saRaw);
  }

  try {
    await updateDoc(doc(db, "matches", id), update);
    toast("Match mis à jour ✓");
  } catch (e) {
    toast("Erreur : " + e.message, false);
  }
};

/* Ajouter un événement */
window.addEvent = async () => {
  const matchId = document.getElementById("eventMatch").value;
  const teamId = document.getElementById("matchTeamSelect").value;
  const type = document.getElementById("eventType").value;
  const minuteRaw = document.getElementById("eventMinute").value;
  const playerName = document.getElementById("eventPlayer").value.trim();

  const isForfait = type === "forfait";
  if (!matchId || !teamId) {
    toast("Selectionnez un match et une equipe", false); return;
  }
  if (!isForfait && (!minuteRaw || !playerName)) {
    toast("Remplissez tous les champs", false); return;
  }

  const minute = Number(minuteRaw);

  if (isNaN(minute)) {
    toast("Minute invalide", false);
    return;
  }

  const event = {
    type,
    minute: isForfait ? 0 : parseInt(minuteRaw),
    teamId,
    playerName,
  };

  if (type === "penalty") {
    event.scored = true;
  }

  try {
    await updateDoc(doc(db, "matches", matchId), {
      events: arrayUnion(event),
    });

    toast("Événement ajouté ✓");

    document.getElementById("eventMinute").value = "";
    document.getElementById("eventPlayer").value = "";
  } catch (e) {
    console.error(e);
    toast("Erreur : " + e.message, false);
  }
};

/* Supprimer un match */
window.deleteMatch = async (id) => {
  if (!confirm("Supprimer ce match ?")) return;
  try {
    await deleteDoc(doc(db, "matches", id));
    toast("Match supprimé");
  } catch (e) {
    toast("Erreur : " + e.message, false);
  }
};

/* ═══════════════════════════════════════════════════════════
   ONGLET 2 — ÉQUIPES
   ═══════════════════════════════════════════════════════════ */

function renderTeamsTable() {
  const tbody = document.getElementById("teamsTableBody");
  if (!tbody) return;

  if (!teams.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-dim)">Aucune équipe</td></tr>`;
    return;
  }

  tbody.innerHTML = teams
    .map(
      (t) => `
    <tr>
      <td>
        <span style="display:inline-block;width:16px;height:16px;border-radius:50%;
                     background:${t.color || "#009EDB"};vertical-align:middle;
                     margin-right:8px;border:1px solid rgba(255,255,255,0.2)"></span>
        ${t.name}
      </td>
      <td style="color:var(--text-dim);font-size:12px">${t.phone || "—"}</td>
      <td>
        <button class="btn-sm btn-danger" onclick="deleteTeam('${t.id}')">Suppr.</button>
      </td>
    </tr>`,
    )
    .join("");
}

/* Créer une équipe */
window.createTeam = async () => {
  const name = document.getElementById("teamName").value.trim();
  const phone = document.getElementById("teamPhone").value.trim();
  const color = document.getElementById("teamColor").value || "#009EDB";

  if (!name) {
    toast("Le nom de l'équipe est obligatoire", false);
    return;
  }

  // Couleur du texte : blanc si couleur foncée, noir sinon
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.5 ? "#0A1628" : "#ffffff";

  try {
    await addDoc(collection(db, "teams"), {
      name,
      phone: phone || "",
      color,
      textColor,
      createdAt: serverTimestamp(),
    });
    toast("Équipe créée ✓");
    ["teamName", "teamPhone"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  } catch (e) {
    toast("Erreur : " + e.message, false);
  }
};

/* Supprimer une équipe */
window.deleteTeam = async (id) => {
  if (!confirm("Supprimer cette équipe ?")) return;
  try {
    await deleteDoc(doc(db, "teams", id));
    toast("Équipe supprimée");
  } catch (e) {
    toast("Erreur : " + e.message, false);
  }
};

/* ═══════════════════════════════════════════════════════════
   ONGLET 3 — SPONSORS
   ═══════════════════════════════════════════════════════════ */

function renderSponsorsTable() {
  const tbody = document.getElementById("sponsorsTableBody");
  if (!tbody) return;

  getDocs(collection(db, "sponsors")).then((snap) => {
    const sponsors = [];
    snap.forEach((d) => sponsors.push({ id: d.id, ...d.data() }));
    sponsors.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!sponsors.length) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-dim)">Aucun sponsor</td></tr>`;
      return;
    }

    tbody.innerHTML = sponsors
      .map(
        (s) => `
      <tr>
        <td>
          <span style="display:inline-block;width:28px;height:28px;border-radius:4px;
                       background:${s.bg || "#009EDB"};color:${s.color || "#fff"};
                       text-align:center;line-height:28px;font-size:10px;font-weight:700;
                       vertical-align:middle;margin-right:8px">
            ${(s.shortName || s.name || "?").slice(0, 4)}
          </span>
          ${s.name}
        </td>
        <td style="color:var(--text-dim)">${s.type || "—"}</td>
        <td>
          <button class="btn-sm btn-danger" onclick="deleteSponsor('${s.id}')">Suppr.</button>
        </td>
      </tr>`,
      )
      .join("");
  });
}

/* Créer un sponsor */
window.createSponsor = async () => {
  const name = document.getElementById("sponsorName").value.trim();
  const shortName = document.getElementById("sponsorShort").value.trim();
  const type = document.getElementById("sponsorType").value.trim();
  const bg = document.getElementById("sponsorBg").value || "#009EDB";
  const color = document.getElementById("sponsorColor").value || "#ffffff";
  const orderRaw = document.getElementById("sponsorOrder").value;

  if (!name) {
    toast("Le nom du sponsor est obligatoire", false);
    return;
  }

  try {
    await addDoc(collection(db, "sponsors"), {
      name,
      shortName: shortName || name.slice(0, 4).toUpperCase(),
      type: type || "Partenaire",
      bg,
      color,
      order: orderRaw ? parseInt(orderRaw) : 99,
      createdAt: serverTimestamp(),
    });
    toast("Sponsor ajouté ✓");
    renderSponsorsTable();
    ["sponsorName", "sponsorShort", "sponsorType", "sponsorOrder"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      },
    );
  } catch (e) {
    toast("Erreur : " + e.message, false);
  }
};

/* Supprimer un sponsor */
window.deleteSponsor = async (id) => {
  if (!confirm("Supprimer ce sponsor ?")) return;
  try {
    await deleteDoc(doc(db, "sponsors", id));
    toast("Sponsor supprimé");
    renderSponsorsTable();
  } catch (e) {
    toast("Erreur : " + e.message, false);
  }
};

/* ═══════════════════════════════════════════════════════════
   ÉCOUTE TEMPS RÉEL — équipes + matchs
   ═══════════════════════════════════════════════════════════ */

onSnapshot(collection(db, "teams"), (snap) => {
  teams = [];
  snap.forEach((d) => teams.push({ id: d.id, ...d.data() }));
  fillTeamSelects();
  renderTeamsTable();
  fillMatchSelects();
});

onSnapshot(collection(db, "matches"), (snap) => {
  matches = [];
  snap.forEach((d) => matches.push({ id: d.id, ...d.data() }));
  fillMatchSelects();
});

/* Init onglet actif + table sponsors */
showTab("tab-matches");
renderSponsorsTable();
