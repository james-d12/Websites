{ config, pkgs, ... }:

{
  imports = [
    ./modules/networking.nix
    ./modules/web-server.nix
  ];

  # Bootloader
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Locale & time
  time.timeZone = "Europe/London";
  i18n.defaultLocale = "en_US.UTF-8";

  users.users.yourname = {
    isNormalUser = true;
    extraGroups = [ "wheel" "networkmanager" ];
  };

  security.sudo.enable = true;
  services.openssh.enable = true;

  environment.systemPackages = with pkgs; [
    git
    apacheHttpd
  ];

  system.stateVersion = "25.05";
  # nix.settings.experimental-features = [ "nix-command" "flakes" ];
}
