async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

function getItemImage(id) {
  return id ? `https://ddragon.leagueoflegends.com/cdn/13.19.1/img/item/${id}.png` : "";
}

function getChampionImage(name) {
  return `https://ddragon.leagueoflegends.com/cdn/13.19.1/img/champion/${name}.png`;
}

function createDamageBar(player, maxDamage) {
  const pct = Math.round((player.totalDamageDealtToChampions / maxDamage) * 100);
  const color = player.teamId === 100 ? "#2e86de" : "#e74c3c";
  return `
    <div class="damageBar">
      <div class="bar" style="width:${pct}%; background:${color}"></div>
      <span>${player.totalDamageDealtToChampions.toLocaleString()}</span>
    </div>
  `;
}

async function afficherMatch(matchData, champions, items, runes) {
  const container = document.getElementById("matchContainer");
  const matchCard = document.createElement("div");
  matchCard.classList.add("matchCard");

  const durationMin = Math.floor(matchData.info.gameDuration / 60);
  const durationSec = matchData.info.gameDuration % 60;

  const header = document.createElement("div");
  header.classList.add("matchHeader");
  header.innerHTML = `
    <h2>${matchData.info.gameMode} • ${durationMin}m ${durationSec}s</h2>
  `;
  matchCard.appendChild(header);

  const team100 = matchData.info.participants.filter(p => p.teamId === 100);
  const team200 = matchData.info.participants.filter(p => p.teamId === 200);
  const allPlayers = [...team100, ...team200];
  const maxDamage = Math.max(...allPlayers.map(p => p.totalDamageDealtToChampions));

  const table = document.createElement("table");
  table.classList.add("matchTable");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Équipe</th>
        <th>Joueur</th>
        <th>KDA</th>
        <th>Gold</th>
        <th>CS</th>
        <th>Wards</th>
        <th>Dégâts</th>
        <th>Objets</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  allPlayers.forEach(player => {
    const tr = document.createElement("tr");
    tr.classList.add(player.teamId === 100 ? "blueTeam" : "redTeam");

    const itemsHTML = [];
    for (let i = 0; i <= 6; i++) {
      const id = player[`item${i}`];
      if (id) {
        itemsHTML.push(`<img class="itemIcon" src="${getItemImage(id)}" alt="">`);
      }
    }

    tr.innerHTML = `
      <td class="teamLabel ${player.win ? "victory" : "defeat"}">
        ${player.teamId === 100 ? "Bleue" : "Rouge"}
      </td>
      <td>
        <img src="${getChampionImage(player.championName)}" class="champIcon">
        <span class="playerName">${player.summonerName}</span>
      </td>
      <td>${player.kills}/${player.deaths}/${player.assists}</td>
      <td>${player.goldEarned.toLocaleString()}</td>
      <td>${player.totalMinionsKilled + player.neutralMinionsKilled}</td>
      <td>${player.wardsPlaced}</td>
      <td>${createDamageBar(player, maxDamage)}</td>
      <td class="itemsCell">${itemsHTML.join("")}</td>
    `;
    tbody.appendChild(tr);
  });

  matchCard.appendChild(table);
  container.appendChild(matchCard);
}

async function init() {
  const champions = await chargerJSON("champions.json");
  const items = await chargerJSON("item.json").then(d => d.data);
  const runes = await chargerJSON("runesReforged.json");

  const matchContainer = document.getElementById("matchContainer");
  const importBtn = document.getElementById("importBtn");
  const importInput = document.getElementById("importInput");
  const importHistoryBtn = document.getElementById("importHistoryBtn");
  const importHistoryInput = document.getElementById("importHistoryInput");
  const searchInput = document.getElementById("championSearch");
  const searchBtn = document.getElementById("searchBtn");

  let historyData = [];

  importBtn.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const matchData = JSON.parse(ev.target.result);
        matchContainer.innerHTML = "";
        await afficherMatch(matchData, champions, items, runes);
      } catch {
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  importHistoryBtn.addEventListener("click", () => importHistoryInput.click());
  importHistoryInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        historyData = JSON.parse(ev.target.result);
        matchContainer.innerHTML = "<p>Historique chargé. Recherchez un champion.</p>";
      } catch {
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  searchBtn.addEventListener("click", () => {
    const champName = searchInput.value.trim().toLowerCase();
    if (!historyData.length) {
      matchContainer.innerHTML = "<p style='color:red;'>Aucun historique chargé !</p>";
      return;
    }

    const filteredMatches = historyData.filter(m =>
      m.info.participants.some(p => (p.championName || "").toLowerCase() === champName)
    );

    if (!filteredMatches.length) {
      matchContainer.innerHTML = "<p>Aucun match trouvé pour ce champion.</p>";
      return;
    }

    matchContainer.innerHTML = "";
    filteredMatches.forEach(m => afficherMatch(m, champions, items, runes));
  });
}

init();
