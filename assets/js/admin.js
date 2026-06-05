import { signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location = "login.html";
  }
});

let matches = [];
let teams = [];

async function loadTeams() {
  const snap = await getDocs(collection(db, "teams"));

  snap.forEach((d) => {
    teams.push({
      id: d.id,
      ...d.data(),
    });
  });

  const home = document.getElementById("homeTeam");
  const away = document.getElementById("awayTeam");

  teams.forEach((team) => {
    home.innerHTML += `
<option value="${team.id}">
${team.name}
</option>`;

    away.innerHTML += `
<option value="${team.id}">
${team.name}
</option>`;
  });
}

async function loadMatches() {
  const snap = await getDocs(collection(db, "matches"));

  const matchSelect = document.getElementById("matchSelect");

  const eventMatch = document.getElementById("eventMatch");

  snap.forEach((d) => {
    matches.push({
      id: d.id,
      ...d.data(),
    });

    matchSelect.innerHTML += `
<option value="${d.id}">
${d.data().homeId}
 vs
${d.data().awayId}
</option>`;

    eventMatch.innerHTML += `
<option value="${d.id}">
${d.data().homeId}
 vs
${d.data().awayId}
</option>`;
  });
}

window.saveMatch = async () => {
  const id = document.getElementById("matchSelect").value;

  await updateDoc(doc(db, "matches", id), {
    scoreHome: Number(document.getElementById("scoreHome").value),

    scoreAway: Number(document.getElementById("scoreAway").value),

    status: document.getElementById("status").value,
  });

  alert("Match mis à jour");
};

window.addEvent = async () => {
  const matchId = document.getElementById("eventMatch").value;

  await updateDoc(doc(db, "matches", matchId), {
    events: arrayUnion({
      type: document.getElementById("eventType").value,

      minute: Number(document.getElementById("eventMinute").value),

      playerName: document.getElementById("eventPlayer").value,
    }),
  });

  alert("Événement ajouté");
};

window.createMatch = async () => {
  await addDoc(collection(db, "matches"), {
    day: document.getElementById("newDay").value,

    homeId: document.getElementById("homeTeam").value,

    awayId: document.getElementById("awayTeam").value,

    time: document.getElementById("newTime").value,

    field: document.getElementById("field").value,

    status: "upcoming",

    scoreHome: null,
    scoreAway: null,

    events: [],
  });

  alert("Match créé");
};

loadTeams();
loadMatches();

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);

  window.location = "login.html";
});
