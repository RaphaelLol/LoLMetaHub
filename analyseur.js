// ====== CONFIG ======
const DDRAGON_PATCH = "15.22.1"; // version du patch pour champions/items
let RUNE_ICON_MAP = {}; // id → chemin d’icône pour runes (runesReforged.json)

// ====== UTILS ASSETS ======
async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}


async function chargerItemData() {
  const patch = DDRAGON_PATCH || "15.22.1"; // adapte selon ton patch
  const url = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/fr_FR/item.json`;
  const res = await fetch(url);
  const data = await res.json();
  const itemFile = await chargerJSON("item.json");
  window.itemData = itemFile.data;
  console.log("Items chargés :", window.itemData);
}
// Fonction de démarrage
async function init() {
  await chargerItemData();
  // tu peux aussi mettre d’autres initialisations ici si besoin
}

// Lancer init quand la page est prête
document.addEventListener("DOMContentLoaded", init);

async function fetchTimeline(matchId) {
  const REGION = "europe"; // adapte selon ton serveur (americas, asia, europe)
  const API_KEY = "RGAPI-78c7a072-b216-416f-88f2-d8e948065852"; // ta clé API Riot

  const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
  const res = await fetch(url, {
    headers: { "X-Riot-Token": API_KEY }
  });
  if (!res.ok) throw new Error("Erreur API Riot: " + res.status);
  return await res.json();
}

function afficherTooltip(id, event) {
  const tooltip = document.getElementById("itemTooltip");
  if (!tooltip) return;

  let html = "";
  const item = window.itemData?.[id.toString()];
  if (item) {
    html = `<strong>${item.name}</strong><br>${item.plaintext || ""}<br><em>Coût: ${item.gold?.total}g</em>`;
  } else if (window.runeData?.[id]) {
    const rune = window.runeData[id];
    html = `<strong>${rune.name}</strong><br>${rune.shortDesc}`;
  } else {
    html = `ID ${id}`;
  }

  tooltip.innerHTML = html;
  tooltip.style.display = "block";
  tooltip.style.left = event.pageX + 12 + "px";
  tooltip.style.top = event.pageY + 12 + "px";
}

function cacherTooltip() {
  const tooltip = document.getElementById("itemTooltip");
  if (tooltip) tooltip.style.display = "none";
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
  14: "SummonerIgnite.png",
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
          return `<img class="runeIcon" src="${url}" alt=""
             onmouseover="afficherTooltip(${sel.perk}, event)"
             onmouseout="cacherTooltip()">`;
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
    if (id) {
      itemsHTML.push(`
        <img class="itemIcon" src="${getItemImage(id)}" alt=""
             onmouseover="afficherTooltip(${id}, event)"
             onmouseout="cacherTooltip()">
      `);
    }
  }
  return `<div class="itemsCell">${itemsHTML.join("")}</div>`;
}


// ====== FONCTION TIMELINE ======
function extractPurchasesForPlayer(timeline, puuid) {
  const achats = [];
  timeline.info.frames.forEach(frame => {
    frame.events.forEach(ev => {
      if (ev.type === "ITEM_PURCHASED") {
        const playerFrame = timeline.info.participants.find(p => p.participantId === ev.participantId);
        if (playerFrame && playerFrame.puuid === puuid) {
          achats.push({
            minute: Math.floor(ev.timestamp / 60000),
            itemId: ev.itemId
          });
        }
      }
    });
  });
  return achats;
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

function renderItemTimeline(achats) {
  const grouped = {};

  // Regrouper les items par minute
  achats.forEach(ev => {
    const min = ev.minute;
    if (!grouped[min]) grouped[min] = [];
    grouped[min].push(ev.itemId);
  });

  let html = "<div class='panel'><h3>Timeline des achats</h3><div class='timeline'>";

  Object.entries(grouped).forEach(([minute, itemIds]) => {
    html += `
      <div class="timeline-entry">
        <div class="timeline-header">[${minute} min]</div>
        <div class="timeline-items">
    `;

    itemIds.forEach(id => {
      const itemData = window.itemData?.[id.toString()];
      const itemName = itemData?.name || `Item ${id}`;
      const itemURL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_PATCH}/img/item/${id}.png`;

      html += `
        <div class="item-block">
          <img src="${itemURL}" class="item-icon" alt="${itemName}" 
           onmouseover="afficherTooltip(${id}, event)" 
           onmouseout="cacherTooltip()">
          <span class="item-name">${itemName}</span>
        </div>
      `;
    });

    html += "</div></div>";
  });

  html += "</div></div>";
  return html;
}

// ====== FONCTION VUE COACH ======
function ouvrirVueCoach(matchId, puuid, teamId, role) {
  const match =
    (window.historyData || []).find(m => m.metadata?.matchId === matchId) ||
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

  // Fond champion
  const champName = player.championName;
  const splashURL = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champName}_0.jpg`;
  const bg = document.getElementById("coachBackground");
  if (bg) bg.style.backgroundImage = `url('${splashURL}')`;

  // Afficher la vue coach
  const container = document.getElementById("matchContainer");
  const coachView = document.getElementById("coachView");
  if (container && coachView) {
    container.style.display = "none";
    coachView.style.display = "block";
  }

  renderCoachHeader(player, match);
  renderCoachContent(player, opponent, match);
}

// ====== FERMER VUE COACH ======
function fermerCoachView() {
  const coachView = document.getElementById("coachView");
  const container = document.getElementById("matchContainer");
  if (coachView && container) {
    coachView.style.display = "none";
    container.style.display = "block";
  }
}

// ====== RENDU HEADER ======
function renderCoachHeader(player, match) {
  const win = player.win ? "Victoire" : "Défaite";
  const durationMin = Math.round(match.info.gameDuration / 60);
  const header = document.getElementById("coachHeader");
  if (!header) return;
  header.innerHTML = `
    <h2>${player.championName} joué par ${playerDisplayName(player)}</h2>
    <p><strong>Résultat:</strong> ${win} | <strong>Durée:</strong> ${durationMin} min</p>
  `;
}

// ====== RENDU CONTENU ======
async function renderCoachContent(player, opponent, match) {
  const minutes = Math.max(1, Math.round(match.info.gameDuration / 60));
  const visionPerMin = (player.visionScore / minutes).toFixed(2);
  const dpm = (player.totalDamageDealtToChampions / minutes).toFixed(1);

  const teamTotalKills = match.info.participants
    .filter(p => p.teamId === player.teamId)
    .reduce((sum, p) => sum + p.kills, 0);

  const killParticipation = teamTotalKills > 0
    ? (((player.kills + player.assists) / teamTotalKills) * 100).toFixed(1)
    : "0.0";

  const teamTotalDamage = match.info.participants
    .filter(p => p.teamId === player.teamId)
    .reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0);

  const damageShare = teamTotalDamage > 0
    ? ((player.totalDamageDealtToChampions / teamTotalDamage) * 100).toFixed(1)
    : "0.0";

  const goldEfficiency = player.goldEarned > 0
    ? (player.totalDamageDealtToChampions / player.goldEarned).toFixed(2)
    : "0.00";

  const estimatedTeamfights = Math.max(1, Math.round(teamTotalKills / 4));
  const deathTimeTotal = player.totalTimeDead || (player.deaths * 30);
  const survivalTimeTotal = Math.max(0, match.info.gameDuration - deathTimeTotal);
  const survivalPerFight = (survivalTimeTotal / estimatedTeamfights).toFixed(1);

  const content = document.getElementById("coachContent");
  if (!content) return;

  content.innerHTML = `
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

    <div class="panel">
      <h3>Stats avancées coaching</h3>
      <p><strong>Kill Participation :</strong><br>➝ <span class="statValue">${killParticipation}%</span></p>
      <p><strong>Damage Share :</strong><br>➝ <span class="statValue">${damageShare}%</span></p>
      <p><strong>Gold → Damage Efficiency :</strong><br>➝ <span class="statValue">${goldEfficiency}</span></p>
      <p><strong>Temps moyen de survie en teamfight :</strong><br>➝ <span class="statValue">${survivalPerFight} secondes</span></p>
    </div>
  `;
 // ➕ Ajout du bloc timeline
  try {
    const timeline = await fetchTimeline(match.metadata.matchId);
    const achats = extractPurchasesForPlayer(timeline, player.puuid);
    content.innerHTML += renderItemTimeline(achats);
  } catch (err) {
    console.error("Impossible de récupérer la timeline :", err);
    content.innerHTML += "<p style='color:red;'>Timeline indisponible.</p>";
  }
}

// ====== ROW FACE-À-FACE ======
function renderFaceToFaceRow(leftP, rightP, leftMaxDmg, rightMaxDmg, teamTotalKillsBlue, teamTotalKillsRed, match) {
  const leftColor = "#3498db";
  const rightColor = "#e74c3c";

  const leftCell = leftP ? renderPlayerCell(leftP, match.metadata.matchId) : "<div class='playerCell'>—</div>";
  const rightCell = rightP ? renderPlayerCell(rightP, match.metadata.matchId) : "<div class='playerCell'>—</div>";

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

  const leftMax = Math.max(...blue.map(p => p.totalDamageDealtToChampions), 0);
  const rightMax = Math.max(...red.map(p => p.totalDamageDealtToChampions), 0);

  const teamTotalKillsBlue = blue.reduce((sum, p) => sum + p.kills, 0);
  const teamTotalKillsRed = red.reduce((sum, p) => sum + p.kills, 0);

  const blueByRole = {};
  const redByRole = {};
  blue.forEach(p => { blueByRole[normalizeRole(p.teamPosition)] = p; });
  red.forEach(p => { redByRole[normalizeRole(p.teamPosition)] = p; });

  const durationMin = Math.floor((match.info.gameDuration || 0) / 60);
  const blueWin = (players.find(p => p.teamId === 100)?.win) === true;
  const redWin = (players.find(p => p.teamId === 200)?.win) === true;

  let rows = "";
  ROLE_ORDER.forEach(role => {
    rows += renderFaceToFaceRow(
      blueByRole[role],
      redByRole[role],
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
        <div class="teamLabel ${blueWin ? "victory" : "defeat"}">Équipe bleue: ${blueWin ? "Victoire" : "Défaite"}</div>
        <div class="teamSpacer">vs</div>
        <div class="teamLabel ${redWin ? "victory" : "defeat"}">Équipe rouge: ${redWin ? "Victoire" : "Défaite"}</div>
      </div>
      <table class="matchTable">
        <colgroup><col><col><col><col><col><col><col></colgroup>
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
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ====== HISTORIQUE ======
async function afficherHistorique(matches) {
  const container = document.getElementById("matchContainer");
  if (!container) {
    console.error("matchContainer introuvable dans le DOM.");
    return;
  }
  container.innerHTML = "";

  if (!matches?.length) {
    container.innerHTML = "<p>Aucun match trouvé.</p>";
    return;
  }

  matches.forEach(match => {
    if (!match?.info?.participants || !match?.metadata?.matchId) {
      container.innerHTML += "<p style='color:red;'>Match invalide (info/metadata manquants).</p>";
      return;
    }
    container.innerHTML += renderMatchFaceAFace(match);
  });
}

// ====== INIT ======
async function init() {
  let runesData = [];
  try {
    // Si assets hébergés sur GitHub Pages, tu peux mettre des URLs absolues ici si besoin.
    await chargerJSON("champions.json");
    const itemFile = await chargerJSON("item.json");
    window.itemData = itemFile.data;
    runesData = await chargerJSON("runesReforged.json");
  } catch (e) {
    console.warn("Impossible de charger les assets locaux :", e);
  }

  try {
    runesData.forEach(style => {
      if (style.id && style.icon) RUNE_ICON_MAP[style.id] = style.icon;
      style.slots?.forEach(slot => {
        slot.runes?.forEach(rune => {
          if (rune.id && rune.icon) RUNE_ICON_MAP[rune.id] = rune.icon;
        });
      });
    });
  } catch (e) {
    console.warn("Erreur lors du mapping des runes :", e);
  }

  // ➕ AJOUTE ICI ton window.runeData
  window.runeData = {};
  runesData.forEach(style => {
    window.runeData[style.id] = { name: style.name, shortDesc: style.shortDesc || "" };
    style.slots?.forEach(slot => {
      slot.runes?.forEach(rune => {
        window.runeData[rune.id] = { name: rune.name, shortDesc: rune.shortDesc || "" };
      });
    });
  });

  const matchContainer = document.getElementById("matchContainer");
  const importBtn = document.getElementById("importBtn");
  const importInput = document.getElementById("importInput");
  const importHistoryBtn = document.getElementById("importHistoryBtn");
  const importHistoryInput = document.getElementById("importHistoryInput");
  const searchInput = document.getElementById("championSearch");
  const searchBtn = document.getElementById("searchBtn");

  window.historyData = [];

  // Import d'une seule partie
  if (importBtn && importInput) {
    importBtn.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async ev => {
        try {
          const text = ev.target.result;
          let matchData;
          try {
            matchData = JSON.parse(text);
          } catch {
            throw new Error("Le fichier n’est pas un JSON valide.");
          }
          if (!matchData.info || !matchData.metadata) {
            throw new Error("Format inattendu : champs info/metadata absents.");
          }
          matchContainer.innerHTML = "";
          await afficherHistorique([matchData]);
          window.importedMatch = matchData;
        } catch (err) {
          console.error("Erreur d’import :", err);
          matchContainer.innerHTML = `<p style='color:red;'>Erreur : ${err.message}</p>`;
        }
      };
      reader.readAsText(file);
    });
  } else {
    console.warn("Bouton ou input d'import de match introuvable (#importBtn, #importInput).");
  }

  // Import de l'historique
  if (importHistoryBtn && importHistoryInput) {
    importHistoryBtn.addEventListener("click", () => importHistoryInput.click());
    importHistoryInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (Array.isArray(parsed)) {
            window.historyData = parsed; // correction
            matchContainer.innerHTML = "<p>✅ Historique chargé. Recherchez un champion ci-dessus.</p>";
          } else {
            throw new Error("Format JSON inattendu : attendu un tableau.");
          }
        } catch (err) {
          matchContainer.innerHTML = `<p style='color:red;'>Erreur : ${err.message}</p>`;
        }
      };
      reader.readAsText(file);
    });
  } else {
    console.warn("Bouton ou input d'import d'historique introuvable (#importHistoryBtn, #importHistoryInput).");
  }

  // Recherche par champion
  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      const champName = (searchInput.value || "").trim().toLowerCase();
      if (!window.historyData.length) {
        matchContainer.innerHTML = "<p style='color:red;'>⚠️ Aucun historique chargé !</p>";
        return;
      }
      const filteredMatches = window.historyData.filter(m =>
        (m.info?.participants || []).some(p => (p.championName || "").toLowerCase() === champName)
      );
      afficherHistorique(filteredMatches);
    });
  }
}

init();
