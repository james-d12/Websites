import { createDirectus, rest } from "@directus/sdk";

export type DirectusImage = {
  id: string;
  width: number;
  height: number;
};

export type Tattoo = {
  Title: string;
  Style: string;
  Image: DirectusImage;
};

export type TattooStyle = {
  Style: string;
  Image: DirectusImage;
};

export type Piercing = {
  Title: string;
  Style: string;
  Image: DirectusImage;
};

export type Shop = {
  Title: string;
  Image: DirectusImage;
};

type Schema = {
  Tattoos: Tattoo[];
  TattooStyles: TattooStyle[];
  Piercings: Piercing[];
  Shop: Shop[];
};

const directus = createDirectus<Schema>(import.meta.env.DIRECTUS_URL).with(
  rest({
    onRequest: (options) => {
      options.headers = {
        ...options.headers,
        "x-cloudflare-build-secret": import.meta.env.DIRECTUS_BUILD_SECRET,
      };
      return options;
    },
  }),
);

export default directus;
