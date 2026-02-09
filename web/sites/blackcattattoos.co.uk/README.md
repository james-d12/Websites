# Black Cat Tattoos

Website for [blackcattattoos.co.uk](https://blackcattattoos.co.uk). Built with [Astro](https://astro.build), [Solid.js](https://www.solidjs.com), and [Directus](https://directus.io) as the CMS.

## Getting Started

From the `web/` directory:

```sh
pnpm install
pnpm --filter blackcattattoos.co.uk dev
```

Copy `.env.template` to `.env` and fill in the values.

## CMS Data

By default, the site uses placeholder data instead of calling the Directus API. This keeps local development and CI builds fast and independent of the CMS.

To fetch real data from Directus, set `PUBLIC_ENABLE_CMS=true` in your `.env`:

```
DIRECTUS_URL=<cms_url>
PUBLIC_ENABLE_CMS=true
```

When `PUBLIC_ENABLE_CMS` is not set or set to `false`, all gallery, piercing, tattoo style, and shop data is replaced with placeholder content.
