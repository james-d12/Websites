# Web

This folder contains the source code for the websites. Most if not all are built using Astro.js. I use pnpm workspace
to help manage shared dependencies across all sites.

<!-- TOC -->

- [Web](#web)
  - [Website Status](#website-status)
  - [Getting Started](#getting-started)
  _ [Creating a New Site](#creating-a-new-site)
  _ [List of Sites](#list-of-sites)
  <!-- TOC -->

## Website Status

- [![Build & Deploy James Durban Website](https://github.com/james-d12/Websites/actions/workflows/web-jamesdurban.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-jamesdurban.yml)
- [![Build & Deploy The Contour Clinic Richmond Website](https://github.com/james-d12/Websites/actions/workflows/web-thecontourclinicrichmond.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-thecontourclinicrichmond.yml)
- [![Build & Deploy Black Cat Tattoos Website](https://github.com/james-d12/Websites/actions/workflows/web-blackcattattoos.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-blackcattattoos.yml)
- [![Build & Deploy St Catherine's Group Website](https://github.com/james-d12/Websites/actions/workflows/web-stcatherinesgroup.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-stcatherinesgroup.yml)
- [![Build & Deploy Orchitect Website](https://github.com/james-d12/Websites/actions/workflows/web-orchitect.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-orchitect.yml)

## Getting Started

Inside the web folder is where all the client websites are stored. It is currently split into two sub folders; lib and
sites. Lib contains any shared libraries, whilst sites contain the actual websites.

1. Ensure you have pnpm installed and Node.js on your machine.
2. Navigate to the `web` folder.
3. Run `pnpm install` to install all the dependencies.
4. Run `pnpm --filter <site_name> run dev` to start the site.

### Creating a New Site

1. Navigate to the `web` folder.
2. Run `pnpm create astro@latest` to create a new site.
3. Follow the prompts.

### List of Sites

- [jamesdurban.com](https://jamesdurban.com)
- [thecontourclinicrichmond.co.uk](https://thecontourclinicrichmond.co.uk)
- [blackcattattoos.co.uk](https://blackcattattoos.co.uk)
- [stcatherinesgroup.com](https://stcatherinesgroup.com)
- [orchitect.net](https://orchitect.net)
