async function chargerJSON(url) {
  console.log("Chargement de :", url);
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Erreur en chargeant", url, res.status);
    return null;
  }
  return await res.json();
}

async function init() {
  console.log("Initialisation de l'analyseur...");

  const match = await chargerJSON('mockMatch.json');
  const champions = await chargerJSON('champions.json');
  const itemsRaw = await chargerJSON('item.json');
  const runes = await chargerJSON('runesReforged.json');

  if (!match || !champions || !itemsRaw || !runes) {
    console.error("❌ Un des fichiers JSON n’a pas pu être chargé !");
    return;
  }

  const items = itemsRaw.data;
  const container = document.getElementById('matchContainer');

  match.players.forEach(player => {
    const champData = champions.data[player.champion];
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('playerCard');

    // --- Items ---
    const itemList = player.items.map(id => items[id]?.name || id).join(', ');

    // --- Runes ---
    const runeList = player.runes.map(id => {
      for (const tree of runes) {
        for (const slot of tree.slots) {
          const rune = slot.runes.find(r => r.id == id);
          if (rune) return rune.name;
        }
      }
      return id;
    }).join(', ');

    // --- Actions ---
    const actionsList = player.actions.map(a => {
      if (a.type === "skill") return `${a.time}s - ${a.type} Skill ${a.skillId} -> ${a.target}`;
      return `${a.time}s - ${a.type}`;
    }).join('<br>');

    playerDiv.innerHTML = `
      <h2>${player.name} - ${champData?.name || player.champion}</h2>
      <p>Items : ${itemList}</p>
      <p>Runes : ${runeList}</p>
      <p>Actions : <br>${actionsList}</p>
    `;

    container.appendChild(playerDiv);
  });
}

init();

