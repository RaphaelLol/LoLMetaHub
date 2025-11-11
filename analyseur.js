async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

// Convertir les runes en noms
function getRuneNames(runeIds, runesData) {
  return runeIds.map(id => {
    let name = null;
    runesData.forEach(tree => {
      tree.slots.forEach(slot => {
        slot.runes.forEach(r => { if (r.id == id) name = r.name; });
      });
    });
    return name || id;
  });
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

async function afficherMatch(matchData, champions, items, runes) {
  const container = document.getElementById('matchContainer');

  const duration = matchData.info.gameDuration;
  const durationMin = Math.floor(duration / 60);
  const durationSec = duration % 60;

  const header = document.createElement('div');
  header.classList.add('matchHeader');
  header.innerHTML = `<h2>Mode : ${matchData.info.gameMode} | Durée : ${durationMin}m ${durationSec}s</h2>`;
  container.appendChild(header);

  const team100 = matchData.info.participants.filter(p => p.teamId === 100);
  const team200 = matchData.info.participants.filter(p => p.teamId === 200);

  // Nouveau container pour afficher les deux équipes en colonnes
  const teamsWrapper = document.createElement('div');
  teamsWrapper.classList.add('teamsWrapper'); // style display: flex; justify-content: space-between;
  container.appendChild(teamsWrapper);

  [team100, team200].forEach((team, idx) => {
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('teamColumn');
    teamDiv.innerHTML = `<h3>Équipe ${idx===0?"Bleue":"Rouge"}</h3>`;

    team.forEach(player => {
      const playerDiv = document.createElement('div');
      playerDiv.classList.add('playerCard');

      // Items
      const itemList = [];
      for(let i=0;i<=6;i++){
        const id = player[`item${i}`];
        if(id && items[id]) itemList.push({name: items[id].name, img: items[id].image?.full});
      }

      // Runes
      const runeList = [];
      player.perks.styles.forEach(style => {
        style.selections.forEach(s => {
          const r = runes.find(rn => rn.id === s.perk);
          if(r) runeList.push(r.name);
        });
      });

      // Actions optionnels
      let actionsList = player.timeline?.events?.map(e => `${Math.floor(e.timestamp/1000)}s - ${e.type}`)?.join('<br>') || "Pas d'actions disponibles";

      playerDiv.innerHTML = `
        <h4>${player.summonerName || player.riotIdGameName || "Joueur"} - ${player.championName}</h4>
        <p><strong>KDA :</strong> ${player.kills}/${player.deaths}/${player.assists}</p>
        <p><strong>CS :</strong> ${player.totalMinionsKilled + player.neutralMinionsKilled}</p>
        <p><strong>Gold :</strong> ${player.goldEarned}</p>
        <p><strong>Objets :</strong><br>
          ${itemList.map(it => `<div class="itemBox"><img src="https://ddragon.leagueoflegends.com/cdn/13.19.1/img/item/${it.img}" alt="${it.name}">${it.name}</div>`).join('')}
        </p>
        <p><strong>Runes :</strong> ${runeList.map(r => `<span class="runeBox">${r}</span>`).join('')}</p>
        <p><strong>Actions :</strong><br>${actionsList}</p>
      `;
      teamDiv.appendChild(playerDiv);
    });

    // Graphique KDA/CS/Gold
    createStatsGraph(team, teamDiv);

    // Stats pour coach
    const coachStats = analyseEquipe(team, duration);
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
}

// Initialisation
async function init() {
  const champions = await chargerJSON('champions.json');
  const items = await chargerJSON('item.json').then(d=>d.data);
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
  importBtn.addEventListener('click', ()=> importInput.click());
  importInput.addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async ev=>{
      try{
        const matchData = JSON.parse(ev.target.result);
        await afficherMatch(matchData, champions, items, runes);
      }catch(err){
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  // Import historique
  importHistoryBtn.addEventListener('click', ()=> importHistoryInput.click());
  importHistoryInput.addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async ev=>{
      try{
        historyData = JSON.parse(ev.target.result);
        matchContainer.innerHTML = "<p>Historique chargé, utilisez la recherche ci-dessus pour filtrer un champion.</p>";
      }catch(err){
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  // Recherche par champion (corrigé)
  searchBtn.addEventListener('click', ()=>{
    const champName = searchInput.value.trim().toLowerCase();
    if(!historyData.length){
      matchContainer.innerHTML = "<p style='color:red;'>Aucun historique chargé !</p>";
      return;
    }
    const filteredMatches = historyData.filter(m =>
      m.info.participants.some(p => (p.championName || "").toLowerCase() === champName)
    );
    if(!filteredMatches.length){
      matchContainer.innerHTML = "<p>Aucun match trouvé pour ce champion.</p>";
      return;
    }
    matchContainer.innerHTML = "";
    filteredMatches.forEach(m=>{
      afficherMatch(m, champions, items, runes);
    });
  });
}

init();
