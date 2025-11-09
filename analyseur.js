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

async function afficherMatch(matchData, champions, items, runes) {
  const container = document.getElementById('matchContainer');
  container.innerHTML = ''; // nettoie l'affichage

  // Durée du match et mode
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
    teamDiv.innerHTML = `<h3>Équipe ${idx === 0 ? "Bleue" : "Rouge"}</h3>`;
    
    team.forEach(player => {
      const playerDiv = document.createElement('div');
      playerDiv.classList.add('playerCard');

      // Items
      const itemList = [];
      for (let i = 0; i <= 6; i++) {
        const itemId = player[`item${i}`];
        if (itemId && items[itemId]) itemList.push(items[itemId].name);
      }

      // Runes
      const runeList = [];
      player.perks.styles.forEach(style => {
        style.selections.forEach(s => {
          runeList.push(runes.find(r => r.id === s.perk)?.name || s.perk);
        });
      });

      // Actions (facultatif, peut être basé sur events si tu en veux)
      let actionsList = player.timeline ? player.timeline.events?.map(a => {
        if(a.type === "CHAMPION_KILL") return `${a.timestamp / 1000}s - Kill ${a.killerId} -> ${a.victimId}`;
        return `${a.timestamp / 1000}s - ${a.type}`;
      }).join('<br>') : "Pas d'actions disponibles";

      playerDiv.innerHTML = `
        <h4>${player.summonerName} - ${champions.data[player.championId]?.name || player.championId}</h4>
        <p><strong>KDA :</strong> ${player.kills}/${player.deaths}/${player.assists}</p>
        <p><strong>CS :</strong> ${player.totalMinionsKilled + player.neutralMinionsKilled}</p>
        <p><strong>Gold :</strong> ${player.goldEarned}</p>
        <p><strong>Objets :</strong> ${itemList.join(', ')}</p>
        <p><strong>Runes :</strong> ${runeList.join(', ')}</p>
        <p><strong>Actions :</strong><br>${actionsList}</p>
      `;

      teamDiv.appendChild(playerDiv);
    });

    container.appendChild(teamDiv);
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

