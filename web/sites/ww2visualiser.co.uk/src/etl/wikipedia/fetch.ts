import { UA, WP_API } from "../lib/constants.ts";
import { withRetry } from "../lib/async.ts";

interface WpParseResponse {
  parse: { wikitext: { "*": string } };
}

/** Fetches the raw wikitext of a Wikipedia article via the parse API. */
export async function fetchWikitext(pageTitle: string): Promise<string> {
  const url = new URL(WP_API);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", pageTitle);
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("format", "json");
  return withRetry(async () => {
    const res = await fetch(url.toString(), { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`Wikipedia parse API ${res.status}`);
    const data = (await res.json()) as WpParseResponse;
    return data.parse.wikitext["*"];
  });
}
