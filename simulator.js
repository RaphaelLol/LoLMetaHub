// Sélection des menus
let selectMoi = document.getElementById('championMoi');
let selectAdversaire = document.getElementById('championAdversaire');

// Charger les champions depuis champions.json
fetch('champions.json')
  .then(response => response.json())
  .then(data => {
      data.forEach(champ => {
          let option1 = document.createElement('option');
          option1.value = champ.id;
          option1.textContent = champ.name;
          selectMoi.appendChild(option1);

          let option2 = document.createElement('option');
          option2.value = champ.id;
          option2.textContent = champ.name;
          selectAdversaire.appendChild(option2);
      });
  });

// Fonction de simulation
function simulerMatchup() {
    let championMoi = selectMoi.value;
    let championAdv = selectAdversaire.value;
    let resultat = document.getElementById('resultat');
    resultat.textContent = `Matchup : ${championMoi} vs ${championAdv}`;
}

