FROM nixos/nix:latest@sha256:22c0a3a816eb3d315eb6720d2a58a3c3b622c9717c578f3c80b687668c6da277

ENV NIX_CONFIG="experimental-features = nix-command flakes"
ENV EDITOR="nano"

RUN nix-env -iA nixpkgs.nano

RUN nix-channel --add https://github.com/ryantm/agenix/archive/main.tar.gz agenix \
 && nix-channel --update \
 && nix-env -iA agenix.agenix