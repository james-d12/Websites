FROM nixos/nix:latest@sha256:d5cce2440bda1f966357732c06d86cb92368069fb52dfb6b2bae8725eea488a5

ENV NIX_CONFIG="experimental-features = nix-command flakes"
ENV EDITOR="nano"

RUN nix-env -iA nixpkgs.nano

RUN nix-channel --add https://github.com/ryantm/agenix/archive/main.tar.gz agenix \
 && nix-channel --update \
 && nix-env -iA agenix.agenix