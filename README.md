[![Build Server](https://github.com/james-d12/Websites/actions/workflows/server-build.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/server-build.yml)
[![Build Web](https://github.com/james-d12/Websites/actions/workflows/web-build.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-build.yml)

# Overview

This repository contains the source code for websites managed by myself. It also includes my NixOS configuration that
I use for my VPS that hosts my sites.

# Website Status

- [![Build & Deploy James Durban Website](https://github.com/james-d12/Websites/actions/workflows/web-jamesdurban.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-jamesdurban.yml)
- [![Build & Deploy The Contour Clinic Richmond Website](https://github.com/james-d12/Websites/actions/workflows/web-thecontourclinicrichmond.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-thecontourclinicrichmond.yml)
- [![Build & Deploy Black Cat Tattoos Website](https://github.com/james-d12/Websites/actions/workflows/web-blackcattattoos.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-blackcattattoos.yml)
- [![Build & Deploy St Catherine's Group Website](https://github.com/james-d12/Websites/actions/workflows/web-stcatherinesgroup.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/web-stcatherinesgroup.yml)

# Getting Started

<details>

<summary>Server Config</summary>

### Bootstrapping a new VPS

### Hetzner

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Create an .env file and populate based on the ```.env.template```.
4. Reset the Root Password on Hetzner and save the new password to be used in next step.
5. Run ```docker compose run --rm vps-bootstrap``` for bootstrapping a new VPS, you will be prompted for a root
   password.
6. You will be prompted for the root password, put in the one you saved in step 4.
7. You can then ssh onto the vps: ```ssh <user>@<vps-ip-address> -p <ssh_port>```

### Making Changes to existing VPS

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Run ```docker compose run --rm vps-update```.
4. Changes should have been applied.

### Updating Flake

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Run ```docker compose run --rm nix```.
4. Then run ```nix flake update``` and commit the changes.

### Updating Secret with Agenix

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Run ```docker compose run --rm nix```.
4. Run ``cd secrets``
5. Run any relevant agenix commands.
6. Commit the changes.

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

### Creating a New Site

1. Navigate to the ```web``` folder.
2. Run ```pnpm create astro@latest``` to create a new site.
3. Follow the prompts.

### List of Sites

- [jamesdurban.com](https://jamesdurban.com)
- [thecontourclinicrichmond.co.uk](https://thecontourclinicrichmond.co.uk)
- [blackcattattoos.co.uk](https://blackcattattoos.co.uk)
- [stcatherinesgroup.com](https://stcatherinesgroup.com)

</details>