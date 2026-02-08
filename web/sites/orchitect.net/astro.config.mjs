// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Orchitect',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/james-d12/Orchitect',
				},
			],
			customCss: ['./src/styles/starlight.css'],
			sidebar: [
				{
					label: 'Guides',
					autogenerate: { directory: 'docs/guides' },
				},
				{
					label: 'References',
					autogenerate: { directory: 'docs/references' },
				},
			],
		}),
	],
});
