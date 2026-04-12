FROM nixos/nix:latest@sha256:e2fe74e96e965653c7b8f16ac64d1e56581c63c84d7fa07fb0692fd055cd06b0

ENV NIX_CONFIG="experimental-features = nix-command flakes"
ENV EDITOR="nano"

RUN nix-env -iA nixpkgs.nano

RUN nix-channel --add https://github.com/ryantm/agenix/archive/main.tar.gz agenix \
 && nix-channel --update \
 && nix-env -iA agenix.agenix