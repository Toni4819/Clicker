// formatters.js
let formatMode = "symbol"; // "symbol" ou "scientific"

export function toggleFormatMode() {
  formatMode = formatMode === "symbol" ? "scientific" : "symbol";
}

export function formatCompact(num) {
  if (!Number.isFinite(num)) return String(num);
  const abs = Math.abs(num);

  const units = [
    { value: 1e45, symbol: "QNT", exp: 45 },
    { value: 1e42, symbol: "TT",  exp: 42 },
    { value: 1e39, symbol: "DD",  exp: 39 },
    { value: 1e36, symbol: "U",   exp: 36 },
    { value: 1e33, symbol: "D",   exp: 33 },
    { value: 1e30, symbol: "N",   exp: 30 },
    { value: 1e27, symbol: "OC",  exp: 27 },
    { value: 1e24, symbol: "SP",  exp: 24 },
    { value: 1e21, symbol: "SXT", exp: 21 },
    { value: 1e18, symbol: "QT",  exp: 18 },
    { value: 1e15, symbol: "Q",   exp: 15 },
    { value: 1e12, symbol: "T",   exp: 12 },
    { value: 1e9,  symbol: "B",   exp: 9 },
    { value: 1e6,  symbol: "M",   exp: 6 },
    { value: 1e3,  symbol: "K",   exp: 3 }
  ];

  for (const u of units) {
    if (abs >= u.value) {
      if (formatMode === "symbol") {
        return (num / u.value).toFixed(2) + u.symbol;
      } else {
        return (num / u.value).toFixed(2) + ` (10^${u.exp})`;
      }
    }
  }
  return num.toFixed(2);
}
