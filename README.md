# Overview

This repository contains the source code for websites managed by myself. It also includes my NixOS configuration that
I use for my VPS that hosts my sites.

# CI Status

[![James Durban Website](https://github.com/james-d12/Websites/actions/workflows/site-jamesdurban.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/site-jamesdurban.yml)
[![The Contour Clinic Richmond Website](https://github.com/james-d12/Websites/actions/workflows/site-thecontourclinicrichmond.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/site-thecontourclinicrichmond.yml)
[![Re-roof and Build Surrey Website](https://github.com/james-d12/Websites/actions/workflows/site-reroofandbuildsurrey.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/site-reroofandbuildsurrey.yml)
[![Server Configuration](https://github.com/james-d12/Websites/actions/workflows/server.yml/badge.svg)](https://github.com/james-d12/Websites/actions/workflows/server.yml)

# Getting Started

## NixOS Server Config

### Bootstrapping a new VPS

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Create an .env file and populate based on the ```.env.template```.
4. Run ```docker compose run --rm nixos-fts``` for bootstrapping a new VPS, you will be prompted for a root password.

### Making Changes to existing VPS

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Run ```docker compose run --rm nixos-rebuild```.
4. Changes should have been applied.
