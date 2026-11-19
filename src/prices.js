export function validFeed(feed, since = "2026-11-19") {
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
  const endpoint =
    import.meta.env.VITE_FUEL_FEED_URL ||
    "https://dwxsofojrfmbmmqluesq.supabase.co/functions/v1/egypt-fuel-prices";
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw Error();
    const feed = await res.json();
    if (!validFeed(feed, since) || !freshCheck(feed)) throw Error();
    return feed;
  } finally {
    clearTimeout(timeout);
  }
}

export function freshCheck(feed, now = Date.now()) {
  const t = Date.parse(feed?.checkedAt);
  return (
    Number.isFinite(t) &&
    t <= now + 60000 &&
    now - t <= 300000 &&
    feed.asOf === new Date(t).toISOString().slice(0, 10)
  );
}
