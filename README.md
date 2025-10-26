[![Build & Deploy James Durban Website](https://github.com/james-d12/Websites/actions/workflows/site-jamesdurban.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/site-jamesdurban.yml)
[![Build & Deploy The Contour Clinic Richmond Website](https://github.com/james-d12/Websites/actions/workflows/site-thecontourclinicrichmond.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/site-thecontourclinicrichmond.yml)
[![Build Server](https://github.com/james-d12/Websites/actions/workflows/server.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/server.yml)

# Overview

This repository contains the source code for websites managed by myself. It also includes my NixOS configuration that
I use for my VPS that hosts my sites.

# Getting Started

<details>

<summary>Server Config</summary>

### Bootstrapping a new VPS

### Hetzner

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Create an .env file and populate based on the ```.env.template```.
4. Reset the Root Password on Hetzner and save the new password to be used in next step.
5. Run ```docker compose run --rm nixos-fts``` for bootstrapping a new VPS, you will be prompted for a root password.
6. You will be prompted for the root password, put in the one you saved in step 4.
7. You can then ssh onto the vps: ```ssh <user>@<vps-ip-address> -p <ssh_port>```

### Making Changes to existing VPS

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Run ```docker compose run --rm nixos-rebuild```.
4. Changes should have been applied.

</details>

<details>

<summary>Website Config</summary>

## Websites

Inside the web folder, is where all the client websites are stored. It is currently split into two sub folders; lib and
sites. Lib contains any shared libraries, whilst sites contain the actual websites.

### Getting Started

1. Ensure you have pnpm installed and Node.js on your machine.
2. Navigate to the ```web``` folder.
3. Run ```pnpm install``` to install all the dependencies.
4. Run ```pnpm --filter <site_name> run dev``` to start the site.

### List of Sites

- [jamesdurban.com](https://jamesdurban.com)
- [thecontourclinicrichmond.co.uk](https://thecontourclinicrichmond.co.uk)
- [blackcattattoos.co.uk](https://blackcattattoos.co.uk)
- [stcatherinesgroup.com](https://stcatherinesgroup.com)

</details>