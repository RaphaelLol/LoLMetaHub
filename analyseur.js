// ==== analyseur.js ====

// Charger un JSON
async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

// Crée un graphique KDA/CS/Gold
function createStatsGraph(players, container) {
  const graphDiv = document.createElement('div');
  graphDiv.classList.add('statsGraph');
  players.forEach(player => {
    const bar = document.createElement('div');
    bar.classList.add('playerBar');
    bar.innerHTML = `
      <strong>${player.summonerName || player.riotIdGameName || "Joueur"}</strong><br>
      KDA: ${player.kills}/${player.deaths}/${player.assists}<br>
      CS: ${player.totalMinionsKilled + player.neutralMinionsKilled}<br>
      Gold: ${player.goldEarned}
    `;
    graphDiv.appendChild(bar);
  });
  container.appendChild(graphDiv);
}

// Analyse pour coach
function analyseEquipe(players, matchDuration) {
  return players.map(p => ({
    name: p.summonerName || p.riotIdGameName || "Joueur",
    kdaRatio: p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists)/p.deaths,
    csPerMin: (p.totalMinionsKilled + p.neutralMinionsKilled) / (matchDuration/60),
    goldPerMin: p.goldEarned / (matchDuration/60)
  }));
}

// Affichage d’un match
async function afficherMatch(matchData, champions, items, runes) {
  const container = document.getElementById('matchContainer');
  container.innerHTML = ''; // toujours reset pour ne montrer qu'un match

  const duration = matchData.info.gameDuration;
  const durationMin = Math.floor(duration / 60);
  const durationSec = duration % 60;

  const header = document.createElement('div');
  header.classList.add('matchHeader');
  header.innerHTML = `<h2>Mode : ${matchData.info.gameMode} | Durée : ${durationMin}m ${durationSec}s</h2>`;
  container.appendChild(header);

  const team100 = matchData.info.participants.filter(p => p.teamId === 100);
  const team200 = matchData.info.participants.filter(p => p.teamId === 200);

  const matchBlock = document.createElement('div');
  matchBlock.classList.add('matchBlock'); // container pour bleu et rouge
  container.appendChild(matchBlock);

  // Équipe Bleue
  const teamBlueDiv = document.createElement('div');
  teamBlueDiv.classList.add('teamColumn', 'teamBlue');
  teamBlueDiv.innerHTML = `<h3>Équipe Bleue</h3>`;
  team100.forEach(player => {
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('playerCard');
    playerDiv.innerHTML = `
      <h4>${player.summonerName || player.riotIdGameName || "Joueur"} - ${player.championName}</h4>
      <p>KDA: ${player.kills}/${player.deaths}/${player.assists}</p>
      <p>CS: ${player.totalMinionsKilled + player.neutralMinionsKilled}</p>
      <p>Gold: ${player.goldEarned}</p>
    `;
    teamBlueDiv.appendChild(playerDiv);
  });
  createStatsGraph(team100, teamBlueDiv); // graphes KDA/CS/Gold

  // Coach stats
  const coachBlueDiv = document.createElement('div');
  coachBlueDiv.classList.add('coachStats');
  analyseEquipe(team100, duration).forEach(s => {
    const p = document.createElement('p');
    p.innerText = `${s.name} → KDA: ${s.kdaRatio.toFixed(2)}, CS/min: ${s.csPerMin.toFixed(1)}, Gold/min: ${s.goldPerMin.toFixed(1)}`;
    coachBlueDiv.appendChild(p);
  });
  teamBlueDiv.appendChild(coachBlueDiv);

  // Équipe Rouge
  const teamRedDiv = document.createElement('div');
  teamRedDiv.classList.add('teamColumn', 'teamRed');
  teamRedDiv.innerHTML = `<h3>Équipe Rouge</h3>`;
  team200.forEach(player => {
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('playerCard');
    playerDiv.innerHTML = `
      <h4>${player.summonerName || player.riotIdGameName || "Joueur"} - ${player.championName}</h4>
      <p>KDA: ${player.kills}/${player.deaths}/${player.assists}</p>
      <p>CS: ${player.totalMinionsKilled + player.neutralMinionsKilled}</p>
      <p>Gold: ${player.goldEarned}</p>
    `;
    teamRedDiv.appendChild(playerDiv);
  });
  createStatsGraph(team200, teamRedDiv);

  const coachRedDiv = document.createElement('div');
  coachRedDiv.classList.add('coachStats');
  analyseEquipe(team200, duration).forEach(s => {
    const p = document.createElement('p');
    p.innerText = `${s.name} → KDA: ${s.kdaRatio.toFixed(2)}, CS/min: ${s.csPerMin.toFixed(1)}, Gold/min: ${s.goldPerMin.toFixed(1)}`;
    coachRedDiv.appendChild(p);
  });
  teamRedDiv.appendChild(coachRedDiv);

  matchBlock.appendChild(teamBlueDiv);
  matchBlock.appendChild(teamRedDiv);
}

// Initialisation
async function init() {
  const champions = await chargerJSON('champions.json');
  const items = await chargerJSON('item.json').then(d => d.data);
  const runes = await chargerJSON('runesReforged.json');

  const matchContainer = document.getElementById('matchContainer');
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');
  const importHistoryBtn = document.getElementById('importHistoryBtn');
  const importHistoryInput = document.getElementById('importHistoryInput');
  const searchInput = document.getElementById('championSearch');
  const searchBtn = document.getElementById('searchBtn');

  let historyData = [];

  // Import match simple
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const matchData = JSON.parse(ev.target.result);
        await afficherMatch(matchData, champions, items, runes);
      } catch (err) {
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  // Import historique (stockage mais **pas affichage automatique**)
  importHistoryBtn.addEventListener('click', () => importHistoryInput.click());
  importHistoryInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        historyData = JSON.parse(ev.target.result);
        matchContainer.innerHTML = "<p>Historique chargé. Faites une recherche pour voir les parties.</p>";
      } catch (err) {
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  // Recherche par champion
  searchBtn.addEventListener('click', () => {
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
    // Affiche toutes les parties filtrées
    matchContainer.innerHTML = '';
    filteredMatches.forEach(m => afficherMatch(m, champions, items, runes));
  });
}

init();
