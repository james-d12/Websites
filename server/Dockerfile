FROM nixos/nix:latest@sha256:c6ebd12d96b3374ee15e3986c15aa43f5e49310634f17afcaaf4dafe4f6732b2

ENV NIX_CONFIG="experimental-features = nix-command flakes"
ENV EDITOR="nano"

RUN nix-env -iA nixpkgs.nano

RUN nix-channel --add https://github.com/ryantm/agenix/archive/main.tar.gz agenix \
 && nix-channel --update \
 && nix-env -iA agenix.agenix