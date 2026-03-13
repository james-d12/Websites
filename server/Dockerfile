FROM nixos/nix:latest@sha256:1d59121e0c361076b4f23c158d236702f2f045b3b477b51075b81ceb6188d34a

ENV NIX_CONFIG="experimental-features = nix-command flakes"
ENV EDITOR="nano"

RUN nix-env -iA nixpkgs.nano

RUN nix-channel --add https://github.com/ryantm/agenix/archive/main.tar.gz agenix \
 && nix-channel --update \
 && nix-env -iA agenix.agenix