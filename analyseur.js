// Fonction pour charger un JSON local
async function chargerJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur de chargement : " + url);
  return await res.json();
}

// Fonction pour traduire les IDs d'objets en noms
function getItemNames(itemIds, items) {
  return itemIds
    .filter(id => id !== 0) // ignore les slots vides
    .map(id => items[id]?.name || id)
    .join(', ');
}

// Fonction pour traduire les runes en noms
function getRuneNames(runeIds, runes) {
  return runeIds
    .map(id => {
      let runeFound = null;
      runes.forEach(tree => {
        tree.slots.forEach(slot => {
          slot.runes.forEach(r => {
            if (r.id == id) runeFound = r.name;
          });
        });
      });
      return runeFound || id;
    })
    .join(', ');
}

// Fonction pour afficher un match
async function afficherMatch(matchData, champions, items, runes) {
  const container = document.getElementById('matchContainer');
  container.innerHTML = ''; // vide le container

  matchData.info.participants.forEach(player => {
    const div = document.createElement('div');
    div.classList.add('playerCard');

    const itemList = getItemNames([
      player.item0,
      player.item1,
      player.item2,
      player.item3,
      player.item4,
      player.item5,
      player.item6
    ], items);

    const runeList = player.perks.styles[0].selections.map(r => r.perk).join(', ');

    div.innerHTML = `
      <h2>${player.summonerName} - ${player.championName}</h2>
      <p><strong>KDA :</strong> ${player.kills}/${player.deaths}/${player.assists}</p>
      <p><strong>CS :</strong> ${player.totalMinionsKilled + player.neutralMinionsKilled}</p>
      <p><strong>Gold :</strong> ${player.goldEarned}</p>
      <p><strong>Objets :</strong> ${itemList}</p>
      <p><strong>Runes principales :</strong> ${runeList}</p>
    `;

    container.appendChild(div);
  });
}

// Initialisation de l'analyseur
async function init() {
  console.log("Initialisation de l'analyseur... ✅");

  const champions = await chargerJSON('champions.json');
  const items = await chargerJSON('item.json').then(d => d.data);
  const runes = await chargerJSON('runesReforged.json');

  const container = document.getElementById('matchContainer');
  container.innerHTML = "<p>Aucun match chargé pour le moment.</p>";

  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');

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

// Lancement
init();

