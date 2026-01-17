import { createDirectus, rest } from "@directus/sdk";

export type Tattoo = {
  Title: string;
  Style: string;
  Image: string;
  Caption?: string | null;
};

export type TattooStyle = {
  Style: string;
  Image: string;
};

export type Piercing = {
  Title: string;
  Style: string;
  Image: string;
};

export type Shop = {
  Title: string;
  Image: string;
  Caption?: string | null;
};

type Schema = {
  Tattoos: Tattoo[];
  TattooStyles: TattooStyle[];
  Piercings: Piercing[];
  Shop: Shop[];
};

const directus = createDirectus<Schema>(import.meta.env.DIRECTUS_URL).with(
  rest(),
);

export default directus;
