import { SPARQL_ENDPOINT, UA } from "./constants.ts";
import { sleep, withRetry } from "./async.ts";

export interface SparqlValue {
  type: "uri" | "literal" | "bnode";
  value: string;
  datatype?: string;
}

interface SparqlResponse<B> {
  results: { bindings: B[] };
}

/** Runs a SPARQL SELECT query against Wikidata and returns its result bindings. */
export async function sparql<B>(label: string, query: string): Promise<B[]> {
  return withRetry(async () => {
    const url = new URL(SPARQL_ENDPOINT);
    url.searchParams.set("query", query.trim());
    url.searchParams.set("format", "json");
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/sparql-results+json", "User-Agent": UA },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`SPARQL [${label}] ${res.status}: ${body.slice(0, 300)}`);
    }
    return ((await res.json()) as SparqlResponse<B>).results.bindings;
  });
}

/** Pulls the given QIDs through Wikidata in URL-length-safe chunks. */
export async function fetchRowsByQid<B>(
  label: string,
  qids: string[],
  buildQuery: (chunk: string[]) => string,
  chunkSize = 80,
  delayMs = 500,
): Promise<B[]> {
  const rows: B[] = [];
  for (let i = 0; i < qids.length; i += chunkSize) {
    const chunk = qids.slice(i, i + chunkSize);
    rows.push(...(await sparql<B>(label, buildQuery(chunk))));
    if (i + chunkSize < qids.length) await sleep(delayMs);
  }
  return rows;
}
