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
  "SummonerBoost.png": "Supprime tous les effets de contrôle et réduit les effets futurs pendant quelques secondes.",
  "SummonerExhaust.png": "Réduit la vitesse de déplacement et les dégâts infligés par la cible.",
  "SummonerFlash.png": "Téléporte votre champion sur une courte distance.",
  "SummonerHaste.png": "Augmente fortement la vitesse de déplacement pendant un court instant.",
  "SummonerHeal.png": "Soigne votre champion et un allié proche, tout en augmentant la vitesse de déplacement.",
  "SummonerSmite.png": "Inflige des dégâts aux monstres et sbires. Nécessaire pour la jungle.",
  "SummonerTeleport.png": "Téléporte votre champion vers une tourelle, un sbire ou un allié.",
  "SummonerMana.png": "Restaure du mana à votre champion et aux alliés proches.",
  "SummonerIgnite.png": "Inflige des dégâts sur la durée et réduit les soins reçus par la cible.",
  "SummonerBarrier.png": "Crée un bouclier temporaire qui absorbe les dégâts.",
};


// ====== DAMAGE BAR (par joueur) ======
function createDamageBar(player, maxDamage, color) {
  const pct = maxDamage ? Math.round((player.totalDamageDealtToChampions / maxDamage) * 100) : 0;
  return `
    <div class="damageBar" title="${player.totalDamageDealtToChampions.toLocaleString()}">
      <div class="bar" style="width:${pct}%; background:${color};"></div>
      <span>${player.totalDamageDealtToChampions.toLocaleString()}</span>
    </div>
  `;
}

// ====== PLAYER CELL (côté gauche/droit) ======
// Fonction pour afficher un joueur
function renderPlayerCell(p) {
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
    </div>
  `;
}

// ====== ROW FACE-À-FACE ======
function renderFaceToFaceRow(leftP, rightP, leftMaxDmg, rightMaxDmg) {
  const leftColor = "#3498db"; // bleu
  const rightColor = "#e74c3c"; // rouge

  // Si un côté est manquant (parties normales ont 5v5 mais on sécurise)
  const leftCell = leftP ? renderPlayerCell(leftP) : "<div class='playerCell'>—</div>";
  const rightCell = rightP ? renderPlayerCell(rightP) : "<div class='playerCell'>—</div>";

  const leftStats = leftP
  ? `
    <div><strong>KDA:</strong> ${formatKDA(leftP)}</div>
    <div><strong>Gold:</strong> ${formatGold(leftP)}</div>
    <div><strong>CS:</strong> ${formatCS(leftP)}</div>
    <div><strong>Wards:</strong> ${leftP.wardsPlaced}</div>

    <!-- 🔥 Stats avancées -->
    <div><strong>DPM:</strong> ${(leftP.totalDamageDealtToChampions / (match.info.gameDuration/60)).toFixed(1)}</div>
    <div><strong>KP:</strong> ${(((leftP.kills + leftP.assists) / teamTotalKillsBlue) * 100).toFixed(1)}%</div>
    <div><strong>Vision/min:</strong> ${(leftP.visionScore / (match.info.gameDuration/60)).toFixed(2)}</div>
    <div><strong>Gold→Damage:</strong> ${(leftP.totalDamageDealtToChampions / leftP.goldEarned).toFixed(2)}</div>

    ${createDamageBar(leftP, leftMaxDmg, leftColor)}
    ${renderItems(leftP)}
  `
  : "<div>—</div>";


  const rightStats = rightP
    ? `
      <div><strong>KDA:</strong> ${formatKDA(rightP)}</div>
      <div><strong>Gold:</strong> ${formatGold(rightP)}</div>
      <div><strong>CS:</strong> ${formatCS(rightP)}</div>
      <div><strong>Wards:</strong> ${rightP.wardsPlaced}</div>
      ${createDamageBar(rightP, rightMaxDmg, rightColor)}
      ${renderItems(rightP)}
    `
    : "<div>—</div>";

  return `
    <tr>
      <td>${leftCell}</td>
      <td>${leftStats}</td>
      <td class="vsCell">vs</td>
      <td>${rightStats}</td>
      <td>${rightCell}</td>
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

  // 👉 C’est ici que tu ajoutes le calcul des kills totaux
  const teamTotalKillsBlue = blue.reduce((sum, p) => sum + p.kills, 0);
  const teamTotalKillsRed = red.reduce((sum, p) => sum + p.kills, 0);

  <div><strong>KP:</strong> ${(((leftP.kills + leftP.assists) / teamTotalKillsBlue) * 100).toFixed(1)}%</div>
  <div><strong>KP:</strong> ${(((rightP.kills + rightP.assists) / teamTotalKillsRed) * 100).toFixed(1)}%</div>


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
    rows += renderFaceToFaceRow(leftP, rightP, leftMax, rightMax);
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
        <thead>
          <tr>
            <th>Bleu (champion + pseudo + runes)</th>
            <th>Stats bleu</th>
            <th>vs</th>
            <th>Stats rouge</th>
            <th>Rouge (champion + pseudo + runes)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// ====== HISTORIQUE (plusieurs parties) ======
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
    // charges locales en amont si tu les utilises (optionnel mais garde la logique)
    await chargerJSON("champions.json");
    await chargerJSON("item.json");
    runesData = await chargerJSON("runesReforged.json");
  } catch (e) {
    console.warn("Impossible de charger les assets locaux :", e);
  }

  // Construire le mapping des runes
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

  let historyData = [];

  // Import d'une seule partie
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

  

  // Import de l'historique (plusieurs parties)
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

  // Recherche par champion (filtrage de l'historique)
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
