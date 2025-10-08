{
  description = "My NixOS configuration for VPS";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
  };

  outputs = { self, nixpkgs, ... }:
    let
      system = "x86_64-linux";
    in
    {
      nixosConfigurations.myhost = nixpkgs.lib.nixosSystem {
        inherit system;

        modules = [
          ./configuration.nix
        ];
      };

      devShells.default = nixpkgs.mkShell {
        buildInputs = [ nixpkgs.git nixpkgs.curl nixpkgs.alejandra ];
      };
    };
}
