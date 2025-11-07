const itemURL = "https://ddragon.leagueoflegends.com/cdn/15.22.1/data/en_US/item.json";
const buildURL = "championsBuilds.json"; // ton petit fichier de builds

let itemsData = {};
let buildsData = {};

async function loadItems() {
  const res = await fetch(itemURL);
  const data = await res.json();
  itemsData = data.data;
}

async function loadBuilds() {
  const res = await fetch(buildURL);
  buildsData = await res.json();
}

function displayBuild(champion) {
  const container = document.getElementById("buildContainer");
  container.innerHTML = "";

  const build = buildsData[champion];
  if (!build) {
    container.innerHTML = `<p>Aucun build trouvé pour "${champion}"</p>`;
    return;
  }

  build.forEach(id => {
    const item = itemsData[id];
    const div = document.createElement("div");
    div.classList.add("item");
    div.innerHTML = `
      <img src="https://ddragon.leagueoflegends.com/cdn/15.22.1/img/item/${id}.png" alt="${item.name}">
      <p>${item.name}</p>
      <small>${item.gold.total} gold</small>
    `;
    container.appendChild(div);
  });
}

document.getElementById("loadBuild").addEventListener("click", async () => {
  const champ = document.getElementById("championSearch").value.trim();
  await loadItems();
  await loadBuilds();
  displayBuild(champ);
});
