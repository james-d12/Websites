import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        hero: z.object({
            eyebrow: z.string(),
            heading: z.string(),
            subheading: z.string(),
        }),
        pullQuote: z.string().optional(),
        stats: z.array(z.object({
            value: z.string(),
            label: z.string(),
        })).optional(),
    }),
});

export const collections = { pages };
