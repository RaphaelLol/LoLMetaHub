// ====== CONFIG ======
const DDRAGON_PATCH = "15.22.1"; // version du patch pour champions/items
let RUNE_ICON_MAP = {}; // id → chemin d’icône pour runes (runesReforged.json)

// ====== UTILS ASSETS ======
async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

function getSummonerSpellImage(filename) {
  if (!filename) return "";

  // 🔥 Cas spécial pour Ignite → lien absolu GitHub Pages
  if (filename === "SummonerIgnite.png") {
    return `https://raphaellol.github.io/LoLMetaHub/static/img/spell/${filename}`;
  }

  // 🌐 Tous les autres → Riot CDN
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_PATCH}/img/spell/${filename}`;
}

function getItemImage(id) {
  return id ? `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_PATCH}/img/item/${id}.png` : "";
}


function getChampionImage(name) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_PATCH}/img/champion/${name}.png`;
}

function getRuneImageById(id) {
  const iconPath = RUNE_ICON_MAP[id];
  if (!iconPath) return "";
  if (iconPath.includes("perk-images/")) {
    return `https://ddragon.leagueoflegends.com/cdn/img/${iconPath}`;
  }
  return "";
}

// ====== FORMATTING ======
function formatKDA(p) {
  return `${p.kills}/${p.deaths}/${p.assists}`;
}

function formatCS(p) {
  return (p.totalMinionsKilled + p.neutralMinionsKilled);
}

function formatGold(p) {
  return p.goldEarned.toLocaleString();
}

function playerDisplayName(p) {
  return p.riotIdGameName ? `${p.riotIdGameName}#${p.riotIdTagline}` : (p.summonerName || "Inconnu");
}

// ====== SUMMONER SPELLS ======
const SUMMONER_SPELLS = {
  1: "SummonerBoost.png",
  3: "SummonerExhaust.png",
  4: "SummonerFlash.png",
  6: "SummonerHaste.png",
  7: "SummonerHeal.png",
  11: "SummonerSmite.png",
  12: "SummonerTeleport.png",
  13: "SummonerMana.png",
  14: "SummonerIgnite.png", // Ignite → cas spécial
  21: "SummonerBarrier.png",
};

const SUMMONER_SPELL_DESCRIPTIONS = {
  "SummonerBoost.png": "Supprime les effets de contrôle et réduit ceux à venir.",
  "SummonerExhaust.png": "Réduit la vitesse et les dégâts de la cible.",
  "SummonerFlash.png": "Téléporte votre champion sur une courte distance.",
  "SummonerHaste.png": "Augmente fortement la vitesse de déplacement.",
  "SummonerHeal.png": "Soigne et augmente la vitesse de déplacement.",
  "SummonerSmite.png": "Inflige des dégâts aux monstres et sbires.",
  "SummonerTeleport.png": "Téléporte vers une tourelle, un sbire ou un allié.",
  "SummonerMana.png": "Restaure du mana à vous et vos alliés proches.",
  "SummonerIgnite.png": "Inflige des dégâts sur la durée et réduit les soins.",
  "SummonerBarrier.png": "Crée un bouclier temporaire qui absorbe les dégâts.",
};

// ====== ROLE ORDERING ======
const ROLE_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

function normalizeRole(pos) {
  const v = (pos || "").toUpperCase();
  if (ROLE_ORDER.includes(v)) return v;
  if (v.includes("TOP")) return "TOP";
  if (v.includes("JUNG")) return "JUNGLE";
  if (v.includes("MID") || v.includes("MIDDLE")) return "MIDDLE";
  if (v.includes("ADC") || v.includes("BOTTOM") || v.includes("BOT")) return "BOTTOM";
  if (v.includes("SUPPORT") || v.includes("UTIL")) return "UTILITY";
  return "";
}

// ====== DAMAGE BAR ======
function createDamageBar(player, maxDamage, color) {
  const pct = maxDamage ? Math.round((player.totalDamageDealtToChampions / maxDamage) * 100) : 0;
  return `
    <div class="damageBar" title="${player.totalDamageDealtToChampions.toLocaleString()}">
      <div class="bar" style="width:${pct}%; background:${color};"></div>
      <span>${player.totalDamageDealtToChampions.toLocaleString()}</span>
    </div>
  `;
}

// ====== RUNES RENDER ======
function renderRunes(perks) {
  if (!perks?.styles) return "";
  const html = perks.styles
    .map(style =>
      style.selections
        .map(sel => {
          const url = getRuneImageById(sel.perk);
          if (!url) return "";
          return `<img class="runeIcon" src="${url}" alt="">`;
        })
        .join("")
    )
    .join(" ");
  return `<div class="runesCell">${html}</div>`;
}

// ====== ITEMS RENDER ======
function renderItems(p) {
  const itemsHTML = [];
  for (let i = 0; i <= 6; i++) {
    const id = p[`item${i}`];
    if (id) itemsHTML.push(`<img class="itemIcon" src="${getItemImage(id)}" alt="">`);
  }
  return `<div class="itemsCell">${itemsHTML.join("")}</div>`;
}

// ====== ADVANCED STATS (bloc latéral) ======
function renderAdvancedStats(p, match, teamTotalKills) {
  if (!p) return "<div class='advancedStats'>—</div>";
  const minutes = (match.info.gameDuration || 0) / 60;
  return `
    <div class="advancedStats">
      <div><strong>DPM:</strong> ${(p.totalDamageDealtToChampions / minutes).toFixed(1)}</div>
      <div><strong>KP:</strong> ${(((p.kills + p.assists) / teamTotalKills) * 100).toFixed(1)}%</div>
      <div><strong>Vision/min:</strong> ${(p.visionScore / minutes).toFixed(2)}</div>
      <div><strong>Gold→Damage:</strong> ${(p.totalDamageDealtToChampions / p.goldEarned).toFixed(2)}</div>
    </div>
  `;
}

// ====== PLAYER CELL ======
function renderPlayerCell(p, matchId) {
  const name = playerDisplayName(p);
  const champImg = getChampionImage(p.championName);
  const runes = renderRunes(p.perks);

  const spell1File = SUMMONER_SPELLS[p.summoner1Id];
  const spell2File = SUMMONER_SPELLS[p.summoner2Id];

  const spell1URL = getSummonerSpellImage(spell1File);
  const spell2URL = getSummonerSpellImage(spell2File);

  const spell1Name = spell1File ? spell1File.replace("Summoner","").replace(".png","") : "Sort inconnu";
  const spell2Name = spell2File ? spell2File.replace("Summoner","").replace(".png","") : "Sort inconnu";

  const spell1Desc = SUMMONER_SPELL_DESCRIPTIONS[spell1File] || spell1Name;
  const spell2Desc = SUMMONER_SPELL_DESCRIPTIONS[spell2File] || spell2Name;

  return `
    <div class="playerCell">
      <img src="${champImg}" class="champIcon" alt="${p.championName}">
      <div class="spellsCell">
        <span class="label">Sorts :</span>
        <img src="${spell1URL}" class="spellIcon" alt="${spell1Name}" title="${spell1Desc}">
        <img src="${spell2URL}" class="spellIcon" alt="${spell2Name}" title="${spell2Desc}">
      </div>
      <span class="playerName">${name}</span>
      ${runes}
      <button class="coachBtn"
        onclick="ouvrirVueCoach('${matchId}', '${p.puuid}', '${p.teamId}', '${p.individualPosition}')">
        Vue Coach
      </button>
    </div>
  `;
}

// ====== FONCTION VUE COACH ======
function ouvrirVueCoach(matchId, puuid, teamId, role) {
  const match =
    (window.historyData || []).find(m => m.metadata.matchId === matchId) ||
    (window.importedMatch?.metadata?.matchId === matchId ? window.importedMatch : null);
  
  if (!match) {
    console.warn("Match introuvable:", matchId);
    return;
  }

  const player = match.info.participants.find(p => p.puuid === puuid);
  if (!player) return;

  const opponent = match.info.participants.find(p =>
    p.individualPosition === player.individualPosition && p.teamId !== player.teamId
  );

  // 🔥 Ajouter le fond du champion
  const champName = player.championName;
  const splashURL = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champName}_0.jpg`;
  document.getElementById("coachBackground").style.backgroundImage = `url('${splashURL}')`;

  // Afficher la vue coach
  document.getElementById("matchContainer").style.display = "none";
  document.getElementById("coachView").style.display = "block";

  renderCoachHeader(player, match);
  renderCoachContent(player, opponent, match);
}


// ====== FERMER VUE COACH ======
function fermerCoachView() {
  document.getElementById("coachView").style.display = "none";
  document.getElementById("matchContainer").style.display = "block";
}

// ====== RENDU HEADER ======
function renderCoachHeader(player, match) {
  const win = player.win ? "Victoire" : "Défaite";
  const durationMin = Math.round(match.info.gameDuration / 60);
  document.getElementById("coachHeader").innerHTML = `
    <h2>${player.championName} joué par ${playerDisplayName(player)}</h2>
    <p><strong>Résultat:</strong> ${win} | <strong>Durée:</strong> ${durationMin} min</p>
  `;
}

// ====== RENDU CONTENU ======
function renderCoachContent(player, opponent, match) {
  const minutes = Math.max(1, Math.round(match.info.gameDuration / 60));
  const visionPerMin = (player.visionScore / minutes).toFixed(2);
  const dpm = (player.totalDamageDealtToChampions / minutes).toFixed(1);

  // 🔢 Calculs pour stats avancées
  const teamTotalKills = match.info.participants
    .filter(p => p.teamId === player.teamId)
    .reduce((sum, p) => sum + p.kills, 0);

  const killParticipation = (((player.kills + player.assists) / teamTotalKills) * 100).toFixed(1);

  const teamTotalDamage = match.info.participants
    .filter(p => p.teamId === player.teamId)
    .reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0);

  const damageShare = ((player.totalDamageDealtToChampions / teamTotalDamage) * 100).toFixed(1);

  const goldEfficiency = (player.totalDamageDealtToChampions / player.goldEarned).toFixed(2);

  // ➕ Nouveau calcul : Temps moyen de survie en teamfight
const estimatedTeamfights = Math.max(1, Math.round(teamTotalKills / 4));
const deathTimeTotal = player.totalTimeDead || (player.deaths * 30); // approx 30s par mort
const survivalTimeTotal = match.info.gameDuration - deathTimeTotal;
const survivalPerFight = (survivalTimeTotal / estimatedTeamfights).toFixed(1);

  
// 🔢 Timeline des achats
const itemEvents = match.info.timeline
  ?.filter(e => e.participantId === player.participantId && e.type === "ITEM_PURCHASED")
  .map(e => ({
    itemId: e.itemId,
    minute: Math.floor(e.timestamp / 60000),
    icon: getItemImage(e.itemId),
    name: getItemName(e.itemId)
  })) || [];
  

  document.getElementById("coachContent").innerHTML = `
    <div class="panel">
      <h3>Performance individuelle</h3>
      <p>KDA: ${player.kills}/${player.deaths}/${player.assists}</p>
      <p>Gold: ${player.goldEarned}</p>
      <p>CS: ${player.totalMinionsKilled + player.neutralMinionsKilled}</p>
      <p>DPM: ${dpm}</p>
      <p>Vision Score: ${player.visionScore} (${visionPerMin}/min)</p>
    </div>

    <div class="panel">
      <h3>Comparaison avec l’adversaire (${opponent?.championName || "—"})</h3>
      <p>DPM adverse: ${opponent ? (opponent.totalDamageDealtToChampions / minutes).toFixed(1) : "—"}</p>
      <p>Vision adverse: ${opponent ? opponent.visionScore : "—"}</p>
    </div>

    <!-- 👉 Nouveau bloc coaching -->
<div class="panel">
  <h3>Stats avancées coaching</h3>
  <p>
    <strong>Kill Participation :</strong><br>
    Définition : Pourcentage des kills de l’équipe où le joueur a participé (kills + assists).<br>
    ➝ <span class="statValue">${killParticipation}%</span>
  </p>
  <p>
    <strong>Damage Share :</strong><br>
    Définition : Part des dégâts totaux de l’équipe infligés par le joueur.<br>
    ➝ <span class="statValue">${damageShare}%</span>
  </p>
  <p>
    <strong>Gold → Damage Efficiency :</strong><br>
    Définition : Ratio entre les dégâts infligés et l’or gagné (efficacité économique).<br>
    ➝ <span class="statValue">${goldEfficiency}</span>
  </p>
  <p>
    <strong>Temps moyen de survie en teamfight :</strong><br>
    Définition : Durée estimée pendant laquelle le joueur reste en vie après le début d’un teamfight.<br>
    ➝ <span class="statValue">${survivalPerFight} secondes</span>
  </p>  
</div>

<!-- 👉 Nouveau bloc timeline -->
<div class="panel">
  <h3>Timeline des achats</h3>
  <div class="timeline">
    ${itemEvents.map(e => `
      <div class="timeline-entry">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <span class="timeline-minute">Minute ${e.minute}</span>
          <img src="${e.icon}" alt="${e.name}" class="item-icon">
          <span class="timeline-name">${e.name}</span>
        </div>
      </div>
    `).join("")}
  </div>
</div>
  `;
}




// ====== ROW FACE-À-FACE ======
function renderFaceToFaceRow(leftP, rightP, leftMaxDmg, rightMaxDmg, teamTotalKillsBlue, teamTotalKillsRed, match) {
  const leftColor = "#3498db"; // bleu
  const rightColor = "#e74c3c"; // rouge

  // ⚠️ Correction : on passe bien match.metadata.matchId à renderPlayerCell
  const leftCell = leftP ? renderPlayerCell(leftP, match.metadata.matchId) : "<div class='playerCell'>—</div>";
  const rightCell = rightP ? renderPlayerCell(rightP, match.metadata.matchId) : "<div class='playerCell'>—</div>";

  // Stats classiques côté bleu
  const leftStats = leftP
    ? `
      <div><strong>KDA:</strong> ${formatKDA(leftP)}</div>
      <div><strong>Gold:</strong> ${formatGold(leftP)}</div>
      <div><strong>CS:</strong> ${formatCS(leftP)}</div>
      <div><strong>Vision Score:</strong> ${leftP.visionScore}</div>

      ${createDamageBar(leftP, leftMaxDmg, leftColor)}
      ${renderItems(leftP)}
    `
    : "<div>—</div>";

  // Stats classiques côté rouge
  const rightStats = rightP
    ? `
      <div><strong>KDA:</strong> ${formatKDA(rightP)}</div>
      <div><strong>Gold:</strong> ${formatGold(rightP)}</div>
      <div><strong>CS:</strong> ${formatCS(rightP)}</div>
      <div><strong>Vision Score:</strong> ${rightP.visionScore}</div>

      ${createDamageBar(rightP, rightMaxDmg, rightColor)}
      ${renderItems(rightP)}
    `
    : "<div>—</div>";

  // Retourne la ligne complète avec 7 colonnes
  return `
    <tr>
      <td>${renderAdvancedStats(leftP, match, teamTotalKillsBlue)}</td>
      <td>${leftCell}</td>
      <td>${leftStats}</td>
      <td class="vsCell">vs</td>
      <td>${rightStats}</td>
      <td>${rightCell}</td>
      <td>${renderAdvancedStats(rightP, match, teamTotalKillsRed)}</td>
    </tr>
  `;
}


// ====== MATCH RENDER (face à face) ======
function renderMatchFaceAFace(match) {
  const players = match.info.participants || [];
  const blue = players.filter(p => p.teamId === 100);
  const red = players.filter(p => p.teamId === 200);

  // max damage par équipe pour échelle des barres
  const leftMax = Math.max(...blue.map(p => p.totalDamageDealtToChampions), 0);
  const rightMax = Math.max(...red.map(p => p.totalDamageDealtToChampions), 0);

  // 👉 Calcul des kills totaux par équipe
  const teamTotalKillsBlue = blue.reduce((sum, p) => sum + p.kills, 0);
  const teamTotalKillsRed = red.reduce((sum, p) => sum + p.kills, 0);

  // Map rôle -> joueur
  const blueByRole = {};
  const redByRole = {};
  blue.forEach(p => {
    const role = normalizeRole(p.teamPosition);
    blueByRole[role] = p;
  });
  red.forEach(p => {
    const role = normalizeRole(p.teamPosition);
    redByRole[role] = p;
  });

  const durationMin = Math.floor((match.info.gameDuration || 0) / 60);
  const blueWin = (players.find(p => p.teamId === 100)?.win) === true;
  const redWin = (players.find(p => p.teamId === 200)?.win) === true;

  let rows = "";
  ROLE_ORDER.forEach(role => {
    const leftP = blueByRole[role];
    const rightP = redByRole[role];
    // ⚠️ Correction : on passe bien match.metadata.matchId à renderFaceToFaceRow
    rows += renderFaceToFaceRow(
      leftP,
      rightP,
      leftMax,
      rightMax,
      teamTotalKillsBlue,
      teamTotalKillsRed,
      match
    );
  });

  return `
    <div class="matchBlock">
      <h2 class="matchHeader">Partie — ${durationMin}m</h2>
      <div class="teamLabelRow">
        <div class="teamLabel ${blueWin ? "victory" : "defeat"}">
          Équipe bleue: ${blueWin ? "Victoire" : "Défaite"}
        </div>
        <div class="teamSpacer">vs</div>
        <div class="teamLabel ${redWin ? "victory" : "defeat"}">
          Équipe rouge: ${redWin ? "Victoire" : "Défaite"}
        </div>
      </div>
      <table class="matchTable">
        <colgroup>
          <col><col><col><col><col><col><col>
        </colgroup>
        <thead>
          <tr>
            <th>Stats avancées (bleu)</th>
            <th>Bleu (champion + pseudo + runes)</th>
            <th>Stats bleu</th>
            <th>vs</th>
            <th>Stats rouge</th>
            <th>Rouge (champion + pseudo + runes)</th>
            <th>Stats avancées (rouge)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}


// ====== HISTORIQUE ======
async function afficherHistorique(matches) {
  const container = document.getElementById("matchContainer");
  container.innerHTML = "";

  if (!matches.length) {
    container.innerHTML = "<p>Aucun match trouvé.</p>";
    return;
  }

  matches.forEach(match => {
    container.innerHTML += renderMatchFaceAFace(match);
  });
}

// ====== INIT ======
async function init() {
  let runesData = [];
  try {
    await chargerJSON("champions.json");
    window.itemData = await chargerJSON("item.json");
    runesData = await chargerJSON("runesReforged.json");
  } catch (e) {
    console.warn("Impossible de charger les assets locaux :", e);
  }

  try {
    runesData.forEach(style => {
      if (style.id && style.icon) {
        RUNE_ICON_MAP[style.id] = style.icon;
      }
      style.slots?.forEach(slot => {
        slot.runes?.forEach(rune => {
          if (rune.id && rune.icon) {
            RUNE_ICON_MAP[rune.id] = rune.icon;
          }
        });
      });
    });
  } catch (e) {
    console.warn("Erreur lors du mapping des runes :", e);
  }

  const matchContainer = document.getElementById("matchContainer");
  const importBtn = document.getElementById("importBtn");
  const importInput = document.getElementById("importInput");
  const importHistoryBtn = document.getElementById("importHistoryBtn");
  const importHistoryInput = document.getElementById("importHistoryInput");
  const searchInput = document.getElementById("championSearch");
  const searchBtn = document.getElementById("searchBtn");

  window.historyData = [];
  
  // Import d'une seule partie
  importBtn?.addEventListener("click", () => importInput.click());
  importInput?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
  reader.onload = async ev => {
  try {
    console.log("Match importé (brut) :", ev.target.result); // contenu texte du fichier
    const matchData = JSON.parse(ev.target.result);
    console.log("Match importé (objet JS) :", matchData); // objet après parse

    matchContainer.innerHTML = "";
    await afficherHistorique([matchData]);

    // 🔥 Correction : stocker le match importé
    window.importedMatch = matchData;
  } catch (err) {
    console.error("Erreur JSON :", err);
    matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
  }
};

    reader.readAsText(file);
  });

  // Import de l'historique
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
          matchContainer.innerHTML = "<p>✅ Historique chargé. Recherchez un champion ci-dessus.</p>";
        } else {
          throw new Error("Format JSON inattendu : attendu un tableau");
        }
      } catch {
        matchContainer.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });

  // Recherche par champion
  searchBtn?.addEventListener("click", () => {
    const champName = (searchInput.value || "").trim().toLowerCase();
    if (!historyData.length) {
      matchContainer.innerHTML = "<p style='color:red;'>⚠️ Aucun historique chargé !</p>";
      return;
    }
    const filteredMatches = historyData.filter(m =>
      (m.info?.participants || []).some(p => (p.championName || "").toLowerCase() === champName)
    );
    afficherHistorique(filteredMatches);
  });
}

init();

