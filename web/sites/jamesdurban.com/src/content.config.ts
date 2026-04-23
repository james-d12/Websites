import {defineCollection} from "astro:content";
import {glob} from "astro/loaders";
import {z} from "astro/zod"

const projects = defineCollection({
    loader: glob({pattern: "**/*.md", base: "./src/content/projects"}),
    schema: z.object({
        title: z.string(),
        github: z.string().optional(),
        publishDate: z.coerce.date(),
        skills: z.array(z.string()),
        img_alt: z.string(),
        type: z.enum(["website", "professional", "hobbyist"]),
    }),
});

export const collections = {projects};
