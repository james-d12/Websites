# Server

This folder contains the NixOS configuration for the server hosted on Hetzner.

<!-- TOC -->
* [Server](#server)
  * [Getting Started](#getting-started)
    * [Bootstrapping a new VPS](#bootstrapping-a-new-vps)
      * [Hetzner](#hetzner)
    * [Making Changes to existing VPS](#making-changes-to-existing-vps)
    * [Updating Flake](#updating-flake)
    * [Formatting Nix Files](#formatting-nix-files)
    * [Updating Secret with Agenix](#updating-secret-with-agenix)
    * [Common Nix OS Commands To Resolve Issues](#common-nix-os-commands-to-resolve-issues)
  * [Health Checks](#health-checks)
  * [Useful Links](#useful-links)
<!-- TOC -->

## Getting Started

### Bootstrapping a new VPS

#### Hetzner

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Create an .env file and populate based on the ```.env.template```.
4. Reset the Root Password on Hetzner and save the new password to be used in next step.
5. Run ```docker compose run --rm vps-bootstrap``` for bootstrapping a new VPS, you will be prompted for a root
   password.
6. You will be prompted for the root password, put in the one you saved in step 4.
7. You can then ssh onto the vps: ```ssh <user>@<vps-ip-address> -p <ssh_port>```
8. Populate IONOS API Key from password manager in the ```/var/lib/acme/acme.env file.``` file.

### Making Changes to existing VPS

1. Install Docker on your system.
2. Copy the Signing Key from the Password Manager to the server/config folder.
3. Navigate to the ```server``` folder.
4. Run ```docker compose run --rm vps-build```.
5. Changes should have been applied.

### Updating Flake

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Run ```docker compose run --rm nix```.
4. Then run ```nix flake update``` and commit the changes.

### Formatting Nix Files

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Run ```docker compose run --rm nix```.
4. Within the docker container, now run ```nix fmt .```.

### Updating Secret with Agenix

1. Install Docker on your system.
2. Navigate to the ```server``` folder.
3. Run ```docker compose run --rm nix```.
4. Run ``cd secrets``
5. Run any relevant agenix commands.
6. Commit the changes.

### Common Nix OS Commands To Resolve Issues

- Check Integrity of Nix Store: ```sudo nix store verify --all```
- Check and Repair Nix Store: ```sudo nix-store --repair --verify --check-contents --verbose```
- Check Generations: ```sudo nix-env --list-generations --profile /nix/var/nix/profiles/system```
- Delete Generation (8 for example)" ```sudo nix-env --profile /nix/var/nix/profiles/system --delete-generations 8```

## Health Checks

Run the script in ```server/scripts/check-domains,sh``` to check the health of each provided url, it will check SSL,
http and https redirects as well as www is also having a correct certificate.

## Useful Links

Just some links to useful things I used to help get this working:

- https://crystalwobsite.gay/posts/2025-02-09-deploying_nixos
- https://www.youtube.com/watch?v=Tbc1KB0wIWg