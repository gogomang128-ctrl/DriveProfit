const SOURCE = "https://www.petroleum.gov.eg/ar-eg/Pages/HomePage.aspx";
export function parsePrices(html) {
  const prices = {};
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = Array.from(
      match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi),
      (m) =>
        m[1]
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
          .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
          .replace(/\s+/g, " ")
          .trim(),
    );
    const i = cells.findIndex((c) => /^بنزين\s*(80|92|95)$/.test(c));
    if (i < 0 || !/^جنيه\s*\/\s*لتر$/.test(cells[i + 2] || "")) continue;
    const g = cells[i].match(/\d+/)[0],
      text = cells[i + 1].replace(/[٫,]/g, ".");
    if (
      !/^\d{1,3}(\.\d{1,3})?$/.test(text) ||
      +text <= 0 ||
      (prices[g] !== undefined && prices[g] !== +text)
    )
      throw Error("invalid row");
    prices[g] = +text;
  }
  if (![80, 92, 95].every((g) => prices[g] > 0)) throw Error("incomplete");
  return prices;
}
let cached = null,
  until = 0,
  pending = null;
async function refresh() {
  try {
    const r = await fetch(SOURCE, { signal: AbortSignal.timeout(6500) });
    if (!r.ok) throw Error();
    const prices = parsePrices(await r.text()),
      checkedAt = new Date().toISOString();
    cached = {
      source: SOURCE,
      currency: "EGP",
      asOf: checkedAt.slice(0, 10),
      checkedAt,
      prices,
    };
  } catch {
    cached = null;
  } finally {
    until = Date.now() + 60000;
  }
}
if (typeof Deno !== "undefined")
  Deno.serve(async (req) => {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers });
    if (req.method !== "GET")
      return new Response(null, { status: 405, headers });
    if (Date.now() >= until) {
      pending ??= refresh().finally(() => (pending = null));
      await pending;
    }
    return new Response(
      JSON.stringify(cached || { error: "official_source_unavailable" }),
      { status: cached ? 200 : 503, headers },
    );
  });
