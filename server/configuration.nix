{ config, pkgs, ... }:

{
  imports = [
    ./modules/hardware.nix
    ./modules/networking.nix
    ./modules/website.nix
  ];

  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

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
    nixfmt-rfc-style
  ];

  system.stateVersion = "25.05";

  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  websites = {
    enable = true;
    email = "webmaster@jamesdurban.com";

    sites = [
      {
        name = "jamesdurban.com";
        documentRoot = "/var/www/jamesdurban.com";
        serverAliases = [ "www.jamesdurban.com" "*.jamesdurban.com" ];
        acmeGroup = "wwwrun";
      }
      {
        name = "thecontourclinicrichmond.co.uk";
        documentRoot = "/var/www/thecontourclinicrichmond.co.uk";
        serverAliases = [ "www.thecontourclinicrichmond.co.uk" "*.thecontourclinicrichmond.co.uk" ];
        acmeGroup = "wwwrun";
      }
    ];
  };
}
