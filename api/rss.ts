export const config = {
  runtime: "edge",
};

const NITTER_INSTANCES = [
  "https://nitter.net",
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://xcancel.com",
  "https://nitter.catsarch.com",
  "https://nitter.tiekoetter.com",
  "https://nitter.lucabased.xyz",
  "https://nitter.1d4.us",
  "https://twiiit.com",
];

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const username = url.searchParams.get("user") || "aleabitoreddit";

  let lastError = "";

  for (const base of NITTER_INSTANCES) {
    const rssUrl = `${base}/${username}/rss`;
    try {
      const resp = await fetch(rssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NitterProxy/1.0)",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (resp.ok) {
        const text = await resp.text();
        if (text.startsWith("<?xml") || text.includes("<rss")) {
          return new Response(text, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=120",
              "X-Nitter-Instance": base,
            },
          });
        }
      }
    } catch (e) {
      lastError = `${base}: ${e}`;
    }
  }

  return new Response(JSON.stringify({ error: "all instances failed", detail: lastError }), {
    status: 502,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
