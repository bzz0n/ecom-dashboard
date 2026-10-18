// Erzeugt Beispiel-Bestellungen für einen fiktiven Onlineshop.
// Fester Startwert, damit bei jedem Laden dieselben Zahlen erscheinen.
// Später kann diese Datei durch echte Daten (z. B. aus einem CSV-Export) ersetzt werden.

function seededRandom(seed) {
  return function () {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const PRODUCTS = [
  { name: "Sneaker Urban", category: "Schuhe", price: 89 },
  { name: "Laufschuh Pro", category: "Schuhe", price: 129 },
  { name: "Sandale Sommer", category: "Schuhe", price: 49 },
  { name: "Hoodie Basic", category: "Bekleidung", price: 59 },
  { name: "T-Shirt Bio", category: "Bekleidung", price: 25 },
  { name: "Jeans Slim", category: "Bekleidung", price: 79 },
  { name: "Winterjacke", category: "Bekleidung", price: 189 },
  { name: "Rucksack City", category: "Accessoires", price: 69 },
  { name: "Cap Classic", category: "Accessoires", price: 22 },
  { name: "Sonnenbrille", category: "Accessoires", price: 45 },
  { name: "Smartwatch Fit", category: "Elektronik", price: 199 },
  { name: "Kopfhörer Air", category: "Elektronik", price: 99 },
];

const CHANNELS = ["Website", "Amazon", "Instagram", "Newsletter"];
const CHANNEL_WEIGHTS = [0.48, 0.27, 0.15, 0.10];

// Saisonfaktor pro Monat (Januar bis Dezember): Sommerdelle, starkes Q4
const SEASON = [0.8, 0.75, 0.9, 0.95, 1.0, 0.95, 0.9, 0.9, 1.0, 1.1, 1.45, 1.6];

function pickWeighted(rand, weights) {
  let r = rand(), acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return weights.length - 1;
}

function generateOrders() {
  const rand = seededRandom(42);
  const orders = [];
  const years = [2024, 2025];
  years.forEach((year, yi) => {
    const growth = yi === 0 ? 1 : 1.18; // ca. 18 % Wachstum im zweiten Jahr
    for (let month = 0; month < 12; month++) {
      const count = Math.round(260 * SEASON[month] * growth * (0.9 + rand() * 0.2));
      for (let i = 0; i < count; i++) {
        const p = PRODUCTS[Math.floor(rand() * PRODUCTS.length)];
        const qty = rand() < 0.8 ? 1 : 2;
        const discount = month >= 10 && rand() < 0.4 ? 0.8 : 1; // Black-Friday-Rabatte
        orders.push({
          date: new Date(year, month, 1 + Math.floor(rand() * 28)),
          product: p.name,
          category: p.category,
          channel: CHANNELS[pickWeighted(rand, CHANNEL_WEIGHTS)],
          qty,
          revenue: Math.round(p.price * qty * discount * 100) / 100,
          returned: rand() < (p.category === "Schuhe" ? 0.14 : 0.07),
        });
      }
    }
  });
  return orders;
}

const ORDERS = generateOrders();
