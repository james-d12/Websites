import { defineCollection, z } from "astro:content";

export const collections = {
  project: defineCollection({
    schema: z.object({
      title: z.string(),
      github: z.string().optional(),
      publishDate: z.coerce.date(),
      skills: z.array(z.string()),
      img: z.string(),
      img_alt: z.string(),
    }),
  }),
};
