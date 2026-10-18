// Berechnet Kennzahlen aus ORDERS (siehe data.js) und zeichnet das Dashboard.

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("de-DE");
const pct = new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 1 });

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const palette = () => ["--c1", "--c2", "--c3", "--c4", "--c5"].map(css);

const yearSel = document.getElementById("year");
const catSel = document.getElementById("category");

const years = [...new Set(ORDERS.map((o) => o.date.getFullYear()))].sort((a, b) => b - a);
years.forEach((y) => yearSel.add(new Option(y, y)));
catSel.add(new Option("Alle Kategorien", ""));
[...new Set(ORDERS.map((o) => o.category))].sort().forEach((c) => catSel.add(new Option(c, c)));

function filterOrders(year, category) {
  return ORDERS.filter((o) => o.date.getFullYear() === year && (!category || o.category === category));
}

function stats(orders) {
  const revenue = orders.reduce((s, o) => s + o.revenue, 0);
  const returned = orders.filter((o) => o.returned).length;
  return {
    revenue,
    orders: orders.length,
    aov: orders.length ? revenue / orders.length : 0,
    returnRate: orders.length ? returned / orders.length : 0,
  };
}

function sumBy(orders, key) {
  const map = {};
  orders.forEach((o) => { map[o[key]] = (map[o[key]] || 0) + o.revenue; });
  return map;
}

function setDelta(id, now, prev, lowerIsBetter = false) {
  const el = document.getElementById(id);
  if (!prev) { el.textContent = "kein Vorjahr"; el.className = "delta"; return; }
  const change = (now - prev) / prev;
  const good = lowerIsBetter ? change < 0 : change > 0;
  el.textContent = (change > 0 ? "▲ " : "▼ ") + pct.format(Math.abs(change)) + " zum Vorjahr";
  el.className = "delta " + (good ? "up" : "down");
}

const charts = {};
function drawChart(id, config) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), config);
}

function render() {
  const year = Number(yearSel.value);
  const category = catSel.value;
  const current = filterOrders(year, category);
  const previous = filterOrders(year - 1, category);
  const s = stats(current), p = stats(previous);

  document.getElementById("k-rev").textContent = eur.format(s.revenue);
  document.getElementById("k-ord").textContent = num.format(s.orders);
  document.getElementById("k-aov").textContent = eur.format(s.aov);
  document.getElementById("k-ret").textContent = pct.format(s.returnRate);
  setDelta("d-rev", s.revenue, p.revenue);
  setDelta("d-ord", s.orders, p.orders);
  setDelta("d-aov", s.aov, p.aov);
  setDelta("d-ret", s.returnRate, p.returnRate, true);

  const colors = palette();
  Chart.defaults.color = css("--muted");
  Chart.defaults.borderColor = css("--border");
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";

  const byMonth = (orders) => MONTHS.map((_, m) =>
    orders.filter((o) => o.date.getMonth() === m).reduce((sum, o) => sum + o.revenue, 0));

  const monthSets = [{ label: String(year), data: byMonth(current), borderColor: colors[0], backgroundColor: colors[0], tension: 0.3 }];
  if (previous.length) {
    monthSets.push({ label: String(year - 1), data: byMonth(previous), borderColor: css("--muted"), backgroundColor: css("--muted"), borderDash: [4, 4], tension: 0.3 });
  }
  drawChart("c-month", {
    type: "line",
    data: { labels: MONTHS, datasets: monthSets },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${eur.format(c.raw)}` } } },
      scales: { y: { ticks: { callback: (v) => eur.format(v) } } },
    },
  });

  const channels = sumBy(current, "channel");
  drawChart("c-channel", {
    type: "doughnut",
    data: { labels: Object.keys(channels), datasets: [{ data: Object.values(channels), backgroundColor: colors, borderColor: css("--card") }] },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${eur.format(c.raw)}` } },
      },
    },
  });

  const cats = Object.entries(sumBy(current, "category")).sort((a, b) => b[1] - a[1]);
  drawChart("c-cat", {
    type: "bar",
    data: { labels: cats.map((c) => c[0]), datasets: [{ data: cats.map((c) => c[1]), backgroundColor: colors[1], borderRadius: 6 }] },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => eur.format(c.raw) } } },
      scales: { x: { ticks: { callback: (v) => eur.format(v) } } },
    },
  });

  const products = {};
  current.forEach((o) => {
    products[o.product] = products[o.product] || { qty: 0, revenue: 0 };
    products[o.product].qty += o.qty;
    products[o.product].revenue += o.revenue;
  });
  document.getElementById("top").innerHTML = Object.entries(products)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8)
    .map(([name, v]) => `<tr><td>${name}</td><td class="num">${num.format(v.qty)}</td><td class="num">${eur.format(v.revenue)}</td></tr>`)
    .join("");
}

yearSel.addEventListener("change", render);
catSel.addEventListener("change", render);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
render();
