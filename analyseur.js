async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

// Graphique KDA / CS / Gold
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

// Stats pour coach
function analyseEquipe(players, matchDuration) {
  return players.map(p => ({
    name: p.summonerName || "Joueur",
    kdaRatio: p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists)/p.deaths,
    csPerMin: (p.totalMinionsKilled + p.neutralMinionsKilled) / (matchDuration/60),
    goldPerMin: p.goldEarned / (matchDuration/60)
  }));
}

// Affiche un match
async function afficherMatch(matchData, champions, items, runes) {
  const container = document.getElementById('matchContainer');

  // Bloc du match
  const matchBlock = document.createElement('div');
  matchBlock.classList.add('matchBlock');

  const duration = matchData.info.gameDuration;
  const durationMin = Math.floor(duration / 60);
  const durationSec = duration % 60;

  const header = document.createElement('div');
  header.classList.add('matchHeader');
  header.innerHTML = `
    <h2>${matchData.info.gameMode} | Durée : ${durationMin}m ${durationSec}s</h2>
  `;
  matchBlock.appendChild(header);

  // Séparer les équipes
  const team100 = matchData.info.participants.filter(p => p.teamId === 100);
  const team200 = matchData.info.participants.filter(p => p.teamId === 200);

  const teamsWrapper = document.createElement('div');
  teamsWrapper.classList.add('teamsWrapper'); // display: flex; justify-content: center
  matchBlock.appendChild(teamsWrapper);

  const teams = [
    { data: team100, name: "Bleue", win: team100[0].win },
    { data: team200, name: "Rouge", win: team200[0].win }
  ];

  teams.forEach((team, idx) => {
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('teamColumn');
    teamDiv.classList.add(team.name === "Bleue" ? "teamBlue" : "teamRed");

    teamDiv.innerHTML = `<h3>Équipe ${team.name} ${team.win ? "(Victoire)" : "(Défaite)"}</h3>`;

    team.data.forEach(player => {
      const playerDiv = document.createElement('div');
      playerDiv.classList.add('playerCard');

      // Items
      const itemList = [];
      for (let i = 0; i <= 6; i++) {
        const id = player[`item${i}`];
        if (id && items[id]) itemList.push({ name: items[id].name, img: items[id].image?.full });
      }

      // Runes
      const runeList = [];
      player.perks.styles.forEach(style => {
        style.selections.forEach(s => {
          const r = runes.find(rn => rn.id === s.perk);
          if (r) runeList.push(r.name);
        });
      });

      playerDiv.innerHTML = `
        <h4>
          <img src="http://ddragon.leagueoflegends.com/cdn/13.19.1/img/champion/${player.championName}.png" 
               alt="${player.championName}" class="championImg">
          ${player.summonerName} - ${player.championName}
        </h4>
        <p><strong>KDA :</strong> ${player.kills}/${player.deaths}/${player.assists}</p>
        <p><strong>CS :</strong> ${player.totalMinionsKilled + player.neutralMinionsKilled}</p>
        <p><strong>Gold :</strong> ${player.goldEarned}</p>
        <p><strong>Objets :</strong><br>
          ${itemList.map(it => `<div class="itemBox"><img src="https://ddragon.leagueoflegends.com/cdn/13.19.1/img/item/${it.img}" alt="${it.name}"><span>${it.name}</span></div>`).join('')}
        </p>
        <p><strong>Runes :</strong><br>${runeList.map(r => `<span class="runeBox">${r}</span>`).join('')}</p>
      `;
      teamDiv.appendChild(playerDiv);
    });

    // Graphiques
    createStatsGraph(team.data, teamDiv);

    // Analyse coach
    const coachStats = analyseEquipe(team.data, duration);
    const coachDiv = document.createElement('div');
    coachDiv.classList.add('coachStats');
    coachDiv.innerHTML = `<h4>Analyse pour coach :</h4>`;
    coachStats.forEach(s => {
      const p = document.createElement('p');
      p.innerText = `${s.name} → KDA ratio: ${s.kdaRatio.toFixed(2)}, CS/min: ${s.csPerMin.toFixed(1)}, Gold/min: ${s.goldPerMin.toFixed(1)}`;
      coachDiv.appendChild(p);
    });
    teamDiv.appendChild(coachDiv);

    teamsWrapper.appendChild(teamDiv);
  });

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

  // Import match simple
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', e => {
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

  // Import historique
  importHistoryBtn.addEventListener('click', () => importHistoryInput.click());
  importHistoryInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        historyData = JSON.parse(ev.target.result);
        matchContainer.innerHTML = "<p>Historique chargé. Recherchez un champion pour afficher plusieurs parties.</p>";
      } catch {
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

    matchContainer.innerHTML = "";
    filteredMatches.forEach(m => afficherMatch(m, champions, items, runes));
  });
}

init();
