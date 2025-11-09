async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

// Convertit les runes IDs en noms
function getRuneNames(player, runesData) {
  const runeList = [];
  player.perks.styles.forEach(style => {
    style.selections.forEach(s => {
      const rune = runesData.find(r => r.id === s.perk);
      runeList.push(rune?.name || s.perk);
    });
  });
  return runeList;
}

// Graphiques simples par joueur
function createStatsGraph(players, container) {
  const graphDiv = document.createElement('div');
  graphDiv.classList.add('statsGraph');

  players.forEach(player => {
    const bar = document.createElement('div');
    bar.classList.add('playerBar');
    bar.innerHTML = `
      <strong>${player.summonerName}</strong><br>
      KDA: ${player.kills}/${player.deaths}/${player.assists}<br>
      CS: ${player.totalMinionsKilled + player.neutralMinionsKilled}<br>
      Gold: ${player.goldEarned}
    `;
    graphDiv.appendChild(bar);
  });

  container.appendChild(graphDiv);
}

// Analyse pour coach
function analyseEquipe(players, duration) {
  return players.map(p => ({
    name: p.summonerName,
    kdaRatio: p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists)/p.deaths,
    csPerMin: (p.totalMinionsKilled + p.neutralMinionsKilled)/(duration/60),
    goldPerMin: p.goldEarned/(duration/60)
  }));
}

async function afficherMatch(matchData, champions, items, runes) {
  const container = document.getElementById('matchContainer');
  container.innerHTML = ''; // Nettoie l'affichage

  // Header match : mode et durée
  const durationMin = Math.floor(matchData.info.gameDuration / 60);
  const durationSec = matchData.info.gameDuration % 60;
  const header = document.createElement('div');
  header.classList.add('matchHeader');
  header.innerHTML = `<h2>Mode : ${matchData.info.gameMode} | Durée : ${durationMin}m ${durationSec}s</h2>`;
  container.appendChild(header);

  // Séparer les équipes
  const team100 = matchData.info.participants.filter(p => p.teamId === 100);
  const team200 = matchData.info.participants.filter(p => p.teamId === 200);

  [team100, team200].forEach((team, idx) => {
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('teamContainer');
    teamDiv.innerHTML = `<h3>Équipe ${idx === 0 ? 'Bleue' : 'Rouge'}</h3>`;

    team.forEach(player => {
      const playerDiv = document.createElement('div');
      playerDiv.classList.add('playerCard');

      // Champion
      const champName = champions.data[player.championId]?.name || player.championId;

      // Items en colonnes avec logo
      const itemContainer = document.createElement('div');
      itemContainer.classList.add('build-container');
      for (let i = 0; i <= 6; i++) {
        const itemId = player[`item${i}`];
        if (itemId && items[itemId]) {
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('item');
          itemDiv.innerHTML = `<img src="https://ddragon.leagueoflegends.com/cdn/13.23.1/img/item/${itemId}.png" alt="${items[itemId].name}"><br>${items[itemId].name}`;
          itemContainer.appendChild(itemDiv);
        }
      }

      // Runes en petites boîtes
      const runeContainer = document.createElement('div');
      runeContainer.classList.add('runes-container');
      player.perks.styles.forEach(style => {
        style.selections.forEach(s => {
          const runeName = runes.find(r => r.id === s.perk)?.name || s.perk;
          const runeDiv = document.createElement('div');
          runeDiv.classList.add('rune-box');
          runeDiv.textContent = runeName;
          runeContainer.appendChild(runeDiv);
        });
      });

      // Actions (facultatif)
      let actionsList = player.timeline?.events?.map(a => {
        if(a.type === "CHAMPION_KILL") return `${(a.timestamp/1000).toFixed(1)}s - Kill ${a.killerId} -> ${a.victimId}`;
        return `${(a.timestamp/1000).toFixed(1)}s - ${a.type}`;
      }).join('<br>') || "Pas d'actions disponibles";

      // Création du HTML de la carte joueur
      playerDiv.innerHTML = `
        <h4>${player.summonerName} - ${champName}</h4>
        <p><strong>KDA :</strong> ${player.kills}/${player.deaths}/${player.assists}</p>
        <p><strong>CS :</strong> ${player.totalMinionsKilled + player.neutralMinionsKilled}</p>
        <p><strong>Gold :</strong> ${player.goldEarned}</p>
        <p><strong>Objets :</strong></p>
      `;
      playerDiv.appendChild(itemContainer);
      playerDiv.innerHTML += `<p><strong>Runes :</strong></p>`;
      playerDiv.appendChild(runeContainer);
      playerDiv.innerHTML += `<p><strong>Actions :</strong><br>${actionsList}</p>`;

      teamDiv.appendChild(playerDiv);
    });

    // Graphiques statistiques
    createStatsGraph(team, teamDiv);

    // Analyse coach
    const coachStats = analyseEquipe(team);
    const coachDiv = document.createElement('div');
    coachDiv.classList.add('coachStats');
    coachDiv.innerHTML = `<h4>Analyse pour coach :</h4>`;
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Joueur</th>
          <th>KDA ratio</th>
          <th>CS/min</th>
          <th>Gold/min</th>
        </tr>
      </thead>
      <tbody>
        ${coachStats.map(s => `<tr>
          <td>${s.name}</td>
          <td>${s.kdaRatio.toFixed(2)}</td>
          <td>${s.csPerMin.toFixed(1)}</td>
          <td>${s.goldPerMin.toFixed(1)}</td>
        </tr>`).join('')}
      </tbody>
    `;
    coachDiv.appendChild(table);
    teamDiv.appendChild(coachDiv);

    container.appendChild(teamDiv);
  });
}

async function init() {
  console.log("Initialisation de l'analyseur... ✅");

  const champions = await chargerJSON('champions.json');
  const items = await chargerJSON('item.json').then(d => d.data);
  const runes = await chargerJSON('runesReforged.json');

  const container = document.getElementById('matchContainer');
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');

  container.innerHTML = "<p>Aucun match chargé pour le moment.</p>";

  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', event => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const matchData = JSON.parse(e.target.result);
          await afficherMatch(matchData, champions, items, runes);
        } catch (err) {
          console.error("Erreur JSON :", err);
          container.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
        }
      };
      reader.readAsText(file);
    });
  } else {
    console.error("Impossible de trouver le bouton ou l'input d'import !");
  }
}

// Lancement unique
init();

