{ config, pkgs, ... }:

{
  imports = [
    ./modules/hardware.nix
    ./modules/networking.nix
    ./modules/website.nix
    ./modules/disk-config.nix
  ];

  time.timeZone = "Europe/London";
  i18n.defaultLocale = "en_GB.UTF-8";

  users.users.james = {
    isNormalUser = true;
    extraGroups = [ "wheel" "networkmanager" ];
  };

  security.sudo.enable = true;

  services.openssh = {
    enable = true;
    ports = [ 51196 ];
    settings = {
        KbdInteractiveAuthentication = false;
        PermitRootLogin = "no";
        AllowUsers = [ "james" ];
    };
  };

  users.users.root.openssh.authorizedKeys.keys = [

  ];

  security.apparmor = {
    enable = true;
    killUnconfinedConfinables = true;
  };

  services.fail2ban.enable = true;

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
