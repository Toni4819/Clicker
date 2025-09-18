// formatters.js
export function formatCompact(num) {
  if (!Number.isFinite(num)) return String(num);
  const abs = Math.abs(num);
  const units = [
    { value: 1e45, symbol: "QNT (10^45)" },
    { value: 1e42, symbol: "TT (10^42)" },
    { value: 1e39, symbol: "DD (10^39)" },
    { value: 1e36, symbol: "U (10^36)" },
    { value: 1e33, symbol: "D (10^33)" },
    { value: 1e30, symbol: "N (10^30)" },
    { value: 1e27, symbol: "OC (10^27)" },
    { value: 1e24, symbol: "SP (10^24)" },
    { value: 1e21, symbol: "SXT (10^21)" },
    { value: 1e18, symbol: "QT (10^18)" },
    { value: 1e15, symbol: "Q (10^15)" },
    { value: 1e12, symbol: "T (10^12)" },
    { value: 1e9,  symbol: "B (10^9)" },
    { value: 1e6,  symbol: "M (10^6)" },
    { value: 1e3,  symbol: "K (10^3)" }
  ];
  for (const u of units) {
    if (abs >= u.value) {
      return (num / u.value).toFixed(2) + " " + u.symbol;
    }
  }
  return num.toFixed(2);
}
