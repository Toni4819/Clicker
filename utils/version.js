// utils/version.js
export async function fetchBuildVersion() {
  try {
    const res = await fetch("/version.json", { cache: "no-store" });
    if (!res.ok) throw new Error("no version file");
    const data = await res.json();
    return data.version || null;
  } catch {
    return null;
  }
}
