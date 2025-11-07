const itemURL = "https://ddragon.leagueoflegends.com/cdn/15.22.1/data/en_US/item.json";

async function loadItems() {
  const response = await fetch(itemURL);
  const data = await response.json();
  return data.data; // contient tous les items
}

function displayItems(items) {
  const container = document.getElementById("buildContainer");
  container.innerHTML = "";

  for (const key in items) {
    const item = items[key];

    // ignorer les objets consommables, boots, etc. si besoin
    if (item.gold.total < 900) continue;

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("item");

    itemDiv.innerHTML = `
      <img src="https://ddragon.leagueoflegends.com/cdn/15.22.1/img/item/${key}.png" alt="${item.name}">
      <p>${item.name}</p>
      <small>${item.gold.total} gold</small>
    `;

    container.appendChild(itemDiv);
  }
}

document.getElementById("loadBuild").addEventListener("click", async () => {
  const items = await loadItems();
  displayItems(items);
});
