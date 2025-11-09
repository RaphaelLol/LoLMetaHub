async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

async function afficherMatch(match, champions, items, runes) {
  const container = document.getElementById('matchContainer');
  container.innerHTML = ""; // On vide le contenu

  if (!match.players || match.players.length === 0) {
    container.innerHTML = "<p>Aucun joueur trouvé dans ce match.</p>";
    return;
  }

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
          slot.runes.forEach(r => { if (r.id == id) runeFound = r.name; });
        });
      });
      return runeFound || id;
    }).join(', ');

    // Actions
    const actionsList = player.actions.map(a => {
      if (a.type === "skill") return `${a.time}s - ${a.type} Skill ${a.skillId} -> ${a.target}`;
      return `${a.time}s - ${a.type}`;
    }).join('<br>');

    playerDiv.innerHTML = `
      <h2>${player.name} - ${champData?.name || player.champion}</h2>
      <p><strong>Items :</strong> ${itemList}</p>
      <p><strong>Runes :</strong> ${runeList}</p>
      <p><strong>Actions :</strong><br>${actionsList}</p>
    `;

    container.appendChild(playerDiv);
  });
}

async function init() {
  const champions = await chargerJSON('champions.json');
  const items = await chargerJSON('item.json').then(d => d.data);
  const runes = await chargerJSON('runesReforged.json');

  const container = document.getElementById('matchContainer');
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');

  // Message initial
  container.innerHTML = "<p>Aucun match chargé pour le moment.</p>";

  // Clic sur le bouton → ouvre le sélecteur de fichiers
  importBtn.addEventListener('click', () => importInput.click());

  // Lecture du fichier sélectionné
  importInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const matchData = JSON.parse(e.target.result);
        await afficherMatch(matchData, champions, items, runes);
      } catch (err) {
        console.error("Erreur lors du chargement du fichier :", err);
        container.innerHTML = "<p style='color:red;'>Erreur : fichier JSON invalide.</p>";
      }
    };
    reader.readAsText(file);
  });
}

init();

init();
