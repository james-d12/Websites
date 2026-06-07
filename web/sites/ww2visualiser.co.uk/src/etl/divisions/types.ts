import type { SparqlValue } from "../lib/sparql.ts";

export interface DivisionBinding {
  item: SparqlValue;
  itemLabel: SparqlValue;
  typeLabel?: SparqlValue;
  branchLabel?: SparqlValue;
  inception?: SparqlValue;
  dissolved?: SparqlValue;
  wpTitle?: SparqlValue;
}

export interface ParsedDivision {
  qid: string;
  label: string;
  type?: string;
  branch?: string;
  formed?: string;
  disbanded?: string;
  wpTitle?: string;
}
