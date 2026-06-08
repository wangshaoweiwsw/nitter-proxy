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

  // Try syndication API first (Twitter's own CDN)
  try {
    const syndResp = await fetch(
      `https://cdn.syndication.twimg.com/timeline/profile?screen_name=${username}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) }
    );
    if (syndResp.ok) {
      const data = await syndResp.json();
      if (data && data.body) {
        return new Response(JSON.stringify({ source: "syndication", data }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }
  } catch (e) {
    // continue
  }

  // Try Nitter instances
  for (const base of NITTER_INSTANCES) {
    try {
      const rssUrl = `${base}/${username}/rss`;
      const resp = await fetch(rssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NitterProxy/1.0)",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (resp.ok) {
        const text = await resp.text();
        if (text.includes("<?xml") && text.includes("<rss")) {
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
      // next instance
    }
  }

  return new Response(JSON.stringify({ error: "all failed" }), {
    status: 502,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
