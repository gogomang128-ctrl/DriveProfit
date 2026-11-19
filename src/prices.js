export function validFeed(feed, since = "2026-11-17") {
  if (
    !feed ||
    feed.currency !== "EGP" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(feed.asOf) ||
    feed.asOf < since
  )
    return false;
  const time = Date.parse(feed.asOf);
  if (
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== feed.asOf ||
    time > Date.now() + 86400000
  )
    return false;
  try {
    if (new URL(feed.source).protocol !== "https:") return false;
  } catch {
    return false;
  }
  return [80, 92, 95].every(
    (g) =>
      Number.isFinite(feed.prices?.[g]) &&
      feed.prices[g] > 0 &&
      feed.prices[g] <= 1000,
  );
}
export async function fetchPrices(since) {
  const endpoint = import.meta.env.VITE_FUEL_FEED_URL || "/data/fuel-eg.json";
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw Error();
    const feed = await res.json();
    if (!validFeed(feed, since)) throw Error();
    return feed;
  } finally {
    clearTimeout(timeout);
  }
}
