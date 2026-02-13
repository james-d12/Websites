FROM nixos/nix:latest@sha256:37eafc36261a1efaf9b17f3e0cfb450be00893087e3797bd1e3be4df68dfe6fe

ENV NIX_CONFIG="experimental-features = nix-command flakes"
ENV EDITOR="nano"

RUN nix-env -iA nixpkgs.nano

RUN nix-channel --add https://github.com/ryantm/agenix/archive/main.tar.gz agenix \
 && nix-channel --update \
 && nix-env -iA agenix.agenix