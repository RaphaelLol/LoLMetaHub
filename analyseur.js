async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

function getItemImage(id) {
  return id ? `https://ddragon.leagueoflegends.com/cdn/14.3.1/img/item/${id}.png` : "";
}

function getRuneImage(id) {
  return `https://ddragon.leagueoflegends.com/cdn/15.22.1/img/perk/${id}.png`;
}


function getChampionImage(name) {
  return `https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/${name}.png`;
}

function createDamageBar(player, maxDamage) {
  const pct = Math.round((player.totalDamageDealtToChampions / maxDamage) * 100);
  const color = player.teamId === 100 ? "#3498db" : "#e74c3c";
  return `
    <div class="damageBar" style="display:flex;align-items:center;gap:6px;">
      <div class="bar" style="width:${pct}%; height:8px; background:${color}; border-radius:4px;"></div>
      <span style="font-size:12px;">${player.totalDamageDealtToChampions.toLocaleString()}</span>
    </div>
  `;
}

function createMatchRow(match, player, maxDamage) {
  const itemsHTML = [];
  for (let i = 0; i <= 6; i++) {
    const id = player[`item${i}`];
    if (id) itemsHTML.push(`<img class="itemIcon" src="${getItemImage(id)}" alt="">`);
  }

  // Runes
 let runesHTML = "";
if (player.perks?.styles) {
  runesHTML = player.perks.styles
    .map(style =>
      style.selections
        .map(sel => `<img class="runeIcon" src="${getRuneImage(sel.perk)}" alt="">`)
        .join("")
    )
    .join(" ");
  }

  // Pseudo Riot (si dispo)
  const pseudo = player.riotIdGameName
    ? `${player.riotIdGameName}#${player.riotIdTagline}`
    : (player.summonerName || "Inconnu");

  const durationMin = Math.floor(match.info.gameDuration / 60);

  return `
    <tr class="${player.win ? "victoryRow" : "defeatRow"}">
      <td>
        <div class="playerCell">
          <img src="${getChampionImage(player.championName)}" class="champIcon">
          <span class="playerName">${pseudo}</span>
          <div class="runesCell">${runesHTML}</div>
        </div>
      </td>
      <td>${player.kills}/${player.deaths}/${player.assists}</td>
      <td>${player.goldEarned.toLocaleString()}</td>
      <td>${player.totalMinionsKilled + player.neutralMinionsKilled}</td>
      <td>${player.wardsPlaced}</td>
      <td>${createDamageBar(player, maxDamage)}</td>
      <td class="itemsCell">${itemsHTML.join("")}</td>
      <td>${durationMin}m</td>
      <td class="${player.win ? "victory" : "defeat"}">${player.win ? "Victoire" : "Défaite"}</td>
    </tr>
  `;
}

async function afficherHistorique(filteredMatches) {
  const container = document.getElementById("matchContainer");
  container.innerHTML = "";

  if (!filteredMatches.length) {
    container.innerHTML = "<p>Aucun match trouvé.</p>";
    return;
  }

  filteredMatches.forEach((match, index) => {
    const matchBlock = document.createElement("div");
    matchBlock.classList.add("matchBlock");

    const header = document.createElement("h2");
    header.textContent = `Partie ${index + 1}`;
    header.classList.add("matchHeader");
    matchBlock.appendChild(header);

    const table = document.createElement("table");
    table.classList.add("matchTable");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Champion</th>
          <th>KDA</th>
          <th>Gold</th>
          <th>CS</th>
          <th>Wards</th>
          <th>Dégâts</th>
          <th>Objets</th>
          <th>Durée</th>
          <th>Résultat</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    const players = match.info.participants;
    const maxDamage = Math.max(...players.map(p => p.totalDamageDealtToChampions));

    players.forEach(player => {
      tbody.innerHTML += createMatchRow(match, player, maxDamage);
    });

    matchBlock.appendChild(table);
    container.appendChild(matchBlock);
  });
}

async function init() {
  // Chargement des assets (champions, items, runes)
  try {
    await chargerJSON("champions.json");
    await chargerJSON("item.json");
    await chargerJSON("runesReforged.json");
  } catch (e) {
    console.warn("Impossible de charger les assets locaux :", e);
  }

  const matchContainer = document.getElementById("matchContainer");
  const importBtn = document.getElementById("importBtn");
  const importInput = document.getElementById("importInput");
  const importHistoryBtn = document.getElementById("importHistoryBtn");
  const importHistoryInput = document.getElementById("importHistoryInput");
  const searchInput = document.getElementById("championSearch");
  const searchBtn = document.getElementById("searchBtn");

  let historyData = [];

  // Importer un match
  importBtn?.addEventListener("click", () => importInput.click());
  importInput?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const matchData = JSON.parse(ev.target.result);
        matchContainer.innerHTML = "";
        await afficherHistorique([matchData]);
      } catch {
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  // Importer un historique
  importHistoryBtn?.addEventListener("click", () => importHistoryInput.click());
  importHistoryInput?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed)) {
          historyData = parsed;
        } else {
          throw new Error("Format JSON inattendu : attendu un tableau");
        }
        matchContainer.innerHTML = "<p>✅ Historique chargé. Recherchez un champion ci-dessus.</p>";
      } catch {
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  // Recherche par champion
  searchBtn?.addEventListener("click", () => {
    const champName = searchInput.value.trim().toLowerCase();
    if (!historyData.length) {
      matchContainer.innerHTML = "<p style='color:red;'>⚠️ Aucun historique chargé !</p>";
      return;
    }

    const filteredMatches = historyData.filter(m =>
      m.info.participants.some(p => (p.championName || "").toLowerCase() === champName)
    );

    afficherHistorique(filteredMatches);
  });
}

init();
