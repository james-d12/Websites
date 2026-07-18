import { UA, WP_API, WP_SUMMARY_API } from "./constants.ts";
import { sleep, withRetry } from "./async.ts";

export interface WpEntry {
  summary: string;
  article: string;
}

interface WpApiResponse {
  extract?: string;
}

interface WpLinksPage {
  links?: { title: string }[];
}
interface WpLinksResponse {
  continue?: { plcontinue: string };
  query: { pages: Record<string, WpLinksPage> };
}

interface WpPagePropsPage {
  pageprops?: { wikibase_item?: string };
}
interface WpPagePropsResponse {
  query: { pages: Record<string, WpPagePropsPage> };
}

/** SPARQL fragment binding ?item to its English Wikipedia article title, if any. */
export const WP_OPTIONAL = `
  OPTIONAL {
    ?art schema:about ?item; schema:inLanguage "en"; schema:name ?wpTitle.
    FILTER(STRSTARTS(str(?art), "https://en.wikipedia.org/wiki/"))
  }`;

async function wpApiGet<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(WP_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return withRetry(async () => {
    const res = await fetch(url.toString(), { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
    return (await res.json()) as T;
  });
}

/** All article titles linked from the given Wikipedia list-style page (paginated). */
export async function fetchLinkedTitles(pageTitle: string): Promise<string[]> {
  const titles: string[] = [];
  let plcontinue: string | undefined;
  do {
    const data = await wpApiGet<WpLinksResponse>({
      titles: pageTitle,
      prop: "links",
      plnamespace: "0",
      pllimit: "500",
      ...(plcontinue ? { plcontinue } : {}),
    });
    for (const page of Object.values(data.query.pages)) {
      for (const link of page.links ?? []) titles.push(link.title);
    }
    plcontinue = data.continue?.plcontinue;
  } while (plcontinue);
  return titles;
}

/** Resolves Wikipedia article titles to their Wikidata QIDs (follows redirects). */
export async function resolveTitlesToQids(titles: string[]): Promise<string[]> {
  const qids = new Set<string>();
  const BATCH = 50;
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const data = await wpApiGet<WpPagePropsResponse>({
      titles: batch.join("|"),
      prop: "pageprops",
      ppprop: "wikibase_item",
      redirects: "1",
    });
    for (const page of Object.values(data.query.pages)) {
      const qid = page.pageprops?.wikibase_item;
      if (qid) qids.add(qid);
    }
    if (i + BATCH < titles.length) await sleep(300);
  }
  return [...qids];
}

export async function fetchWpSummary(title: string): Promise<WpEntry | null> {
  try {
    const res = await fetch(
      `${WP_SUMMARY_API}/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as WpApiResponse;
    const extract = data.extract ?? "";
    const sentences = extract.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
    const summary =
      sentences.slice(0, 2).join("").trim() || extract.slice(0, 200);
    return { summary, article: extract };
  } catch {
    return null;
  }
}
