async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

// Convertit les runes IDs en noms grâce au fichier runesReforged.json
function getRuneNames(runeIds, runesData) {
  return runeIds.map(id => {
    let name = null;
    runesData.forEach(tree => {
      tree.slots.forEach(slot => {
        slot.runes.forEach(r => {
          if (r.id == id) name = r.name;
        });
      });
    });
    return name || id;
  });
}

// Création d'un graphique simple (barres) pour KDA, CS, Gold
function createStatsGraph(players, container) {
  const graphDiv = document.createElement('div');
  graphDiv.classList.add('statsGraph');

  players.forEach(player => {
    const bar = document.createElement('div');
    bar.classList.add('playerBar');
    bar.innerHTML = `
      <strong>${player.name}</strong><br>
      KDA: ${player.kills}/${player.deaths}/${player.assists}<br>
      CS: ${player.cs}<br>
      Gold: ${player.gold}
    `;
    graphDiv.appendChild(bar);
  });

  container.appendChild(graphDiv);
}

// Calcul simple des stats pour le coach
function analyseEquipe(players) {
  const stats = players.map(p => ({
    name: p.name,
    kdaRatio: p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists)/p.deaths,
    csPerMin: p.cs / (p.duration/60),
    goldPerMin: p.gold / (p.duration/60)
  }));
  return stats;
}

async function afficherMatch(match, champions, items, runes) {
  const container = document.getElementById('matchContainer');
  container.innerHTML = '';

  // En-tête du match
  const header = document.createElement('div');
  header.classList.add('matchHeader');
  header.innerHTML = `
    <h2>Mode : ${match.gameMode} | Durée : ${Math.floor(match.gameDuration/60)}m ${match.gameDuration % 60}s</h2>
    <h3>Score : Blue ${match.teams[0].kills} - Red ${match.teams[1].kills}</h3>
  `;
  container.appendChild(header);

  // Séparer les équipes
  const blueTeam = match.players.filter(p => p.teamId === 100);
  const redTeam = match.players.filter(p => p.teamId === 200);

  [ {team: "Blue Team", players: blueTeam}, {team: "Red Team", players: redTeam} ].forEach(group => {
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('teamContainer');
    teamDiv.innerHTML = `<h2>${group.team}</h2>`;
    
    group.players.forEach(player => {
      const champData = champions.data[player.championName];
      const playerDiv = document.createElement('div');
      playerDiv.classList.add('playerCard');

      const itemList = player.items.map(id => items[id]?.name || id).join(', ');
      const runeList = getRuneNames(player.runes, runes).join(', ');

      // Actions simplifiées pour l'instant
      const actionsList = player.actions?.map(a => {
        if(a.type === "skill") return `${a.time}s - Skill ${a.skillId} -> ${a.target}`;
        return `${a.time}s - ${a.type}`;
      })?.join('<br>') || "Aucune action enregistrée";

      playerDiv.innerHTML = `
        <h3>${player.summonerName} - ${champData?.name || player.championName}</h3>
        <p><strong>KDA :</strong> ${player.kills}/${player.deaths}/${player.assists}</p>
        <p><strong>CS :</strong> ${player.cs}</p>
        <p><strong>Gold :</strong> ${player.gold}</p>
        <p><strong>Items :</strong> ${itemList}</p>
        <p><strong>Runes :</strong> ${runeList}</p>
        <p><strong>Actions :</strong><br>${actionsList}</p>
      `;

      teamDiv.appendChild(playerDiv);
    });

    // Graphiques pour la team
    createStatsGraph(group.players, teamDiv);

    // Analyse pour coach
    const coachStats = analyseEquipe(group.players);
    const coachDiv = document.createElement('div');
    coachDiv.classList.add('coachStats');
    coachDiv.innerHTML = `<h4>Analyse pour coach :</h4>`;
    coachStats.forEach(s => {
      const p = document.createElement('p');
      p.innerText = `${s.name} → KDA ratio: ${s.kdaRatio.toFixed(2)}, CS/min: ${s.csPerMin.toFixed(1)}, Gold/min: ${s.goldPerMin.toFixed(1)}`;
      coachDiv.appendChild(p);
    });

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

init();

// Lancement
init();

