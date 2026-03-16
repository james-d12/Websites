import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    github: z.string().optional(),
    publishDate: z.coerce.date(),
    skills: z.array(z.string()),
    img_alt: z.string(),
    type: z.enum(["hobbyist", "professional"]),
  }),
});

export const collections = { projects };
