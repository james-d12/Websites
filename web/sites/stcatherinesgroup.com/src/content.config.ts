import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    hero: z.object({
      eyebrow: z.string(),
      heading: z.string(),
      subheading: z.string(),
    }),
  }),
});

export const SECTION_ICONS = [
  "heart",
  "shield",
  "clipboard",
  "people",
] as const;
export const CALLOUT_ICONS = [...SECTION_ICONS, "star"] as const;

const serviceSection = z.object({
  title: z.string(),
  icon: z.enum(SECTION_ICONS),
  body: z.string(),
  items: z.array(z.string()).optional(),
  bodyOutro: z.string().optional(),
});

export type ServiceSection = z.infer<typeof serviceSection>;

const serviceCallout = z.object({
  eyebrow: z.string(),
  text: z.string(),
  icon: z.enum(CALLOUT_ICONS),
});

export type ServiceCallout = z.infer<typeof serviceCallout>;

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: ({ image }) =>
    z.object({
      listing: z.object({
        image: image(),
        order: z.number().int(),
      }),
      meta: z.object({
        title: z.string(),
        description: z.string(),
      }),
      hero: z.object({
        label: z.string(),
        title: z.string(),
        description: z.string(),
        imageAlt: z.string(),
      }),
      about: z.object({
        title: z.string(),
        subTitle: z.string(),
        sections: z.array(serviceSection),
        callout: serviceCallout.optional(),
      }),
      story: z.object({ title: z.string(), content: z.string() }).optional(),
      testimonials: z.array(
        z.object({
          quote: z.string(),
          name: z.string(),
          relationship: z.string(),
          service: z.string(),
        }),
      ),
      testimonialsBackground: z.string().default("bg-white"),
      ctaBackground: z.string().default("bg-warm-50"),
    }),
});

const nurseFeatureCard = z.object({
  title: z.string(),
  icon: z.string(),
  body: z.string(),
  items: z.array(z.string()),
});

export type NurseFeatureCard = z.infer<typeof nurseFeatureCard>;

const nurseFeatures = z.object({
  eyebrow: z.string(),
  title: z.string(),
  description: z.string(),
  cards: z.array(nurseFeatureCard),
});

export type NurseFeatures = z.infer<typeof nurseFeatures>;

const nurseTeam = z.object({
  eyebrow: z.string(),
  title: z.string(),
  paragraphs: z.array(z.string()),
  checklistTitle: z.string(),
  checklistItems: z.array(
    z.object({
      label: z.string(),
      text: z.string(),
    }),
  ),
});

export type NurseTeam = z.infer<typeof nurseTeam>;

const nurses = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/nurses" }),
  schema: z.object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
    }),
    hero: z.object({
      label: z.string(),
      title: z.string(),
      description: z.string(),
      imageAlt: z.string(),
    }),
    features: nurseFeatures,
    team: nurseTeam,
    testimonials: z.array(
      z.object({
        quote: z.string(),
        name: z.string(),
        relationship: z.string(),
        service: z.string(),
      }),
    ),
    testimonialsBackground: z.string().default("bg-white"),
    ctaBackground: z.string().default("bg-warm-50"),
  }),
});

export const collections = { pages, services, nurses };
