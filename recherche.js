// recherche.js

document.getElementById("searchButton").addEventListener("click", async () => {
  const playerName = document.getElementById("playerName").value.trim();
  const championName = document.getElementById("championName").value.trim();

  if (!playerName || !championName) {
    alert("Veuillez entrer un nom de joueur et un champion !");
    return;
  }

  try {
    // Exemple de récupération depuis ton backend ou API (à adapter)
    const response = await fetch(`https://api.example.com/matches?player=${playerName}&champion=${championName}`);
    if (!response.ok) throw new Error("Erreur de chargement des données");

    const matches = await response.json();

    // Afficher les résultats
    afficherResultatsRecherche(matches);

  } catch (err) {
    console.error(err);
    alert("Impossible de récupérer les matchs.");
  }
});

function afficherResultatsRecherche(matches) {
  const container = document.getElementById("matchContainer");
  container.innerHTML = `<h2>Résultats pour ${matches.length} match(s)</h2>`;

  matches.forEach(match => {
    const div = document.createElement("div");
    div.className = "playerCard";
    div.innerHTML = `
      <h3>${match.champion} — ${match.player}</h3>
      <p><b>KDA :</b> ${match.kills}/${match.deaths}/${match.assists}</p>
      <p><b>CS :</b> ${match.cs}</p>
      <p><b>Durée :</b> ${match.duration}</p>
    `;
    container.appendChild(div);
  });
}

