import { WP_OPTIONAL } from "../lib/wikipedia.ts";

export const DIVISION_LIST_PAGE = "List of German divisions in World War II";

export function divisionsQuery(qids: string[]): string {
  return `
    SELECT DISTINCT ?item ?itemLabel ?typeLabel ?branchLabel ?inception ?dissolved ?wpTitle WHERE {
      VALUES ?item { ${qids.map((q) => `wd:${q}`).join(" ")} }
      OPTIONAL { ?item wdt:P31 ?type.     }
      OPTIONAL { ?item wdt:P361 ?branch.  }
      OPTIONAL { ?item wdt:P571 ?inception. }
      OPTIONAL { ?item wdt:P576 ?dissolved. }
      ${WP_OPTIONAL}
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`;
}
