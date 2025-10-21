const MARKETS_URL = `https://api.coinlore.net/api/coin/markets/?id=90`;
const URL_COINS = `https://api.coinlore.net/api/tickers/`;

let exchangesData = [], coinsData = [], chartCoins, chartExchanges;
const el = (id) => document.getElementById(id);

// FORMATEO USD
const fmtUSD = (n) => {
    if (!n) return "—";
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(2) + "K";
    return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// COLORES PARA GRAFICOS
const getColorPalette = (count) => {
    const base = ["#06d6a0","#4cc9f0","#f72585","#ffd166","#48bfe3","#8338ec","#ff7b00","#80ed99","#00f5d4","#a2d2ff","#ef476f","#06b6d4","#22c55e","#f59e0b","#38bdf8"];
    return Array.from({length: count}, (_, i) => base[i % base.length]);
};

// REFRESH DE DATOS
let refresh = async () => {
    // Coins
    try {
        const resCoins = await axios.get(URL_COINS);
        coinsData = resCoins.data.data || [];
    } catch (err) {
        console.error("Error fetching coins:", err);
        coinsData = [];
    }

    // Exchanges
    try {
        const resEx = await axios.get(MARKETS_URL);
        exchangesData = resEx.data || [];
    } catch (err) {
        console.error("Error fetching exchanges:", err);
        exchangesData = [];
    }

    // Info superior
    renderInfoTop();

    // Graficos
    renderCoinChart(coinsData.slice(0,10));
    renderExchangesChart(exchangesData.slice(0,10));

    // Tablas
    renderCoinsTable(coinsData);
    renderExchangesTable(exchangesData);
};

// INFO SUPERIOR
function renderInfoTop() {
    const totalExchanges = exchangesData.length;
    const meanPrice = coinsData.length 
        ? coinsData.reduce((sum, c) => sum + parseFloat(c.price_usd || 0), 0) / coinsData.length 
        : 0;

    // Top Coin = la primera moneda según el orden de la API
    const topCoin = coinsData.length ? coinsData[0] : null;

    const infoDiv = el("infoTop");
    infoDiv.innerHTML = `
        <div class="col-12 col-md-4"><div class="card p-2 text-center">Total Exchanges: <b>${totalExchanges}</b></div></div>
        <div class="col-12 col-md-4"><div class="card p-2 text-center">Mean Price: <b>${fmtUSD(meanPrice)}</b></div></div>
        <div class="col-12 col-md-4"><div class="card p-2 text-center">Top Coin: <b>${topCoin ? topCoin.name : "—"}</b></div></div>
    `;
}

// GRAFICOS
function renderCoinChart(data) {
    const ctx = el("chartCoin").getContext("2d");
    const labels = data.map(c => c.name);
    const prices = data.map(c => parseFloat(c.price_usd));
    const colors = getColorPalette(labels.length);

    if(chartCoins) chartCoins.destroy();
    chartCoins = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets:[{ label:"Price USD", data:prices, backgroundColor:colors.map(c => c+"cc"), borderColor:colors, borderWidth:1.5 }] },
        options: { responsive:true, maintainAspectRatio:false }
    });
}

function renderExchangesChart(data) {
    const ctx = el("chartExchanges").getContext("2d");
    const labels = data.map(e => e.name);
    const volumes = data.map(e => parseFloat(e.volume_usd || 0));
    const colors = getColorPalette(labels.length);

    if(chartExchanges) chartExchanges.destroy();
    chartExchanges = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets:[{ label:"Volume USD", data:volumes, backgroundColor:colors.map(c => c+"cc"), borderColor:colors, borderWidth:1.5 }] },
        options: { responsive:true, maintainAspectRatio:false }
    });
}

// TABLAS (Rank según orden API)
function renderCoinsTable(data) {
    const table = el("coinsTableBody");
    table.innerHTML = "";
    data.forEach((c, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${idx + 1}</td> <!-- Rank según API -->
            <td>${c.name || "—"}</td>
            <td>${c.symbol || "—"}</td>
            <td>${c.price_usd ? fmtUSD(parseFloat(c.price_usd)) : "—"}</td>
            <td>${c.market_cap_usd ? fmtUSD(parseFloat(c.market_cap_usd)) : "—"}</td>
        `;
        table.appendChild(tr);
    });
}

function renderExchangesTable(data) {
    const table = el("exchangesTableBody");
    table.innerHTML = "";
    data.forEach((e, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${idx + 1}</td> <!-- Rank según API -->
            <td>${e.name || "—"}</td>
            <td>${e.base || "—"}</td>
            <td>${e.quote || "—"}</td>
            <td>${e.volume_usd ? fmtUSD(parseFloat(e.volume_usd)) : "—"}</td>
        `;
        table.appendChild(tr);
    });
}

// BUSCADORES
el("searchCoins").addEventListener("input", e => {
    const term = e.target.value.toLowerCase();
    renderCoinsTable(coinsData.filter(c => (c.name && c.name.toLowerCase().includes(term)) || (c.symbol && c.symbol.toLowerCase().includes(term))));
});

el("searchExchanges").addEventListener("input", e => {
    const term = e.target.value.toLowerCase();
    renderExchangesTable(exchangesData.filter(e => e.name && e.name.toLowerCase().includes(term)));
});

// DOM READY
document.addEventListener("DOMContentLoaded", () => {
    refresh();
    el("btnReload").addEventListener("click", refresh);
});
