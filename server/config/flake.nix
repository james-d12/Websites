{
  description = "NixOS Configuration for my VPS";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    disko.url = "github:nix-community/disko";
    disko.inputs.nixpkgs.follows = "nixpkgs";
    nixos-facter-modules.url = "github:numtide/nixos-facter-modules";
    agenix.url = "github:ryantm/agenix";
  };

  outputs = { self, nixpkgs, disko, nixos-facter-modules, agenix, ... }:
    {
        nixosConfigurations = {
            vps = nixpkgs.lib.nixosSystem {
                system = "x86_64-linux";
                modules = [
                    disko.nixosModules.disko
                    ./configuration.nix
                    agenix.nixosModules.default
                ];
            };
        };
    };
}
