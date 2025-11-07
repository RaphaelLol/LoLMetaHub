const builds = {
  Ahri: {
    items: ["Luden Tempest", "Shadowflame", "Zhonya’s Hourglass", "Rabadon’s Deathcap", "Void Staff"],
    runes: ["Electrocute", "Taste of Blood", "Eyeball Collection", "Ultimate Hunter"],
    tips: "Ahri brille sur les picks rapides. Abuse de sa mobilité pour punir les carries fragiles."
  },
  Yasuo: {
    items: ["Infinity Edge", "Statikk Shiv", "Bloodthirster", "Death’s Dance", "Immortal Shieldbow"],
    runes: ["Conqueror", "Triumph", "Legend: Alacrity", "Last Stand"],
    tips: "Essaye de stack ton passif avant chaque combat et utilise ton mur contre les mages."
  },
  Lux: {
    items: ["Luden Tempest", "Shadowflame", "Rabadon’s Deathcap", "Zhonya’s Hourglass", "Morellonomicon"],
    runes: ["Arcane Comet", "Manaflow Band", "Transcendence", "Scorch"],
    tips: "Joue autour de ta portée et garde ton Q pour contrer les engage."
  },
  LeeSin: {
    items: ["Goredrinker", "Black Cleaver", "Death’s Dance", "Maw of Malmortius", "Guardian Angel"],
    runes: ["Conqueror", "Triumph", "Legend: Tenacity", "Last Stand"],
    tips: "Utilise tes wards intelligemment pour des insec plays. Priorise la vision."
  },
  Jinx: {
    items: ["Kraken Slayer", "Infinity Edge", "Runaan’s Hurricane", "Bloodthirster", "Lord Dominik’s Regards"],
    runes: ["Lethal Tempo", "Presence of Mind", "Legend: Bloodline", "Coup de Grace"],
    tips: "Reste derrière ton frontlane et profite de ta portée pour clean les fights."
  }
};

const select = document.getElementById("championSelect");
const buildContainer = document.getElementById("buildContainer");

select.addEventListener("change", () => {
  const champ = select.value;
  if (!champ) {
    buildContainer.innerHTML = "";
    return;
  }

  const build = builds[champ];
  buildContainer.innerHTML = `
    <h2>${champ}</h2>
    <h3>🛡️ Items :</h3>
    <ul>${build.items.map(item => `<li>${item}</li>`).join("")}</ul>
    <h3>🔮 Runes :</h3>
    <ul>${build.runes.map(rune => `<li>${rune}</li>`).join("")}</ul>
    <p><strong>💡 Astuce :</strong> ${build.tips}</p>
  `;
});

