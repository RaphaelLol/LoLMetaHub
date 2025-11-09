async function chargerJSON(url) {
  const res = await fetch(url);
  return await res.json();
}

async function init() {
  const match = await chargerJSON('data/mockMatch.json');
  const champions = await chargerJSON('data/champions.json');
  const items = await chargerJSON('data/item.json').then(data => data.data);
  const runes = await chargerJSON('data/runesReforged.json');

  const container = document.getElementById('matchContainer');

  match.players.forEach(player => {
    const champData = champions.data[player.champion];
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('playerCard');

    // Items
    const itemList = player.items.map(id => items[id]?.name || id).join(', ');

    // Runes
    const runeList = player.runes.map(id => {
      let runeFound = null;
      runes.forEach(tree => {
        tree.slots.forEach(slot => {
          slot.runes.forEach(r => { if(r.id == id) runeFound = r.name; });
        });
      });
      return runeFound || id;
    }).join(', ');

    // Actions
    const actionsList = player.actions.map(a => {
      if(a.type === "skill") return `${a.time}s - ${a.type} Skill ${a.skillId} -> ${a.target}`;
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
