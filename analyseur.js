// ==== analyseur.js ====

// Charger un JSON
async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

// Crée un petit graphique KDA/CS/Gold
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
async function afficherMatch(matchData, champions, items, runes, append = true) {
  const container = document.getElementById('matchContainer');
  if(!append) container.innerHTML = ''; // reset si nécessaire

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
  matchBlock.classList.add('matchBlock');

  // Équipe Bleu
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

  // Graphes KDA/CS/Gold
  createStatsGraph(team100, teamBlueDiv);
  createStatsGraph(team200, teamRedDiv);

  // Stats pour coach
  const coachBlueStats = analyseEquipe(team100, duration);
  const coachRedStats = analyseEquipe(team200, duration);

  const coachDivBlue = document.createElement('div');
  coachDivBlue.classList.add('coachStats');
  coachDivBlue.innerHTML = `<h4>Analyse coach</h4>`;
  coachBlueStats.forEach(s => {
    const p = document.createElement('p');
    p.innerText = `${s.name} → KDA: ${s.kdaRatio.toFixed(2)}, CS/min: ${s.csPerMin.toFixed(1)}, Gold/min: ${s.goldPerMin.toFixed(1)}`;
    coachDivBlue.appendChild(p);
  });
  teamBlueDiv.appendChild(coachDivBlue);

  const coachDivRed = document.createElement('div');
  coachDivRed.classList.add('coachStats');
  coachRedStats.forEach(s => {
    const p = document.createElement('p');
    p.innerText = `${s.name} → KDA: ${s.kdaRatio.toFixed(2)}, CS/min: ${s.csPerMin.toFixed(1)}, Gold/min: ${s.goldPerMin.toFixed(1)}`;
    coachDivRed.appendChild(p);
  });
  teamRedDiv.appendChild(coachDivRed);

  // Ajout équipes collées
  matchBlock.appendChild(teamBlueDiv);
  matchBlock.appendChild(teamRedDiv);
  container.appendChild(matchBlock);
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

  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const matchData = JSON.parse(ev.target.result);
        await afficherMatch(matchData, champions, items, runes, true);
      } catch (err) {
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  importHistoryBtn.addEventListener('click', () => importHistoryInput.click());
  importHistoryInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        historyData = JSON.parse(ev.target.result);
        matchContainer.innerHTML = "<p>Historique chargé.</p>";
        historyData.forEach(match => afficherMatch(match, champions, items, runes, true));
      } catch (err) {
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

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
    matchContainer.innerHTML = '';
    filteredMatches.forEach(m => afficherMatch(m, champions, items, runes, true));
  });
}

init();
