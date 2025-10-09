{ config, pkgs, ... }:

{
  imports = [
    ./modules/hardware.nix
    ./modules/networking.nix
    ./modules/website.nix
    ./modules/disk-config.nix
  ];

  hardware.cpu.intel.updateMicrocode = true;
  hardware.cpu.amd.updateMicrocode = true;

  boot.loader.grub = {
    enable = true;
    efiSupport = true;
    efiInstallAsRemovable = true;
  };

  time.timeZone = "Europe/London";
  i18n.defaultLocale = "en_GB.UTF-8";

  users = {
    mutableUsers = true;
    users.james = {
        home = "/home/james";
        isNormalUser = true;
        extraGroups = [ "wheel" "networkmanager" ];
    };
  };

  security.sudo.enable = true;

  services.openssh = {
    enable = true;
    ports = [ 51196 ];
    settings = {
        KbdInteractiveAuthentication = false;
        PermitRootLogin = "no";
        UsePAM = false;
        PasswordAuthentication = true;
        AllowUsers = [ "james" ];
    };
    extraConfig = "MaxSessions 2\nClientAliveInterval 300\nClientAliveCountMax 0\n";
  };

  users.users.james.openssh.authorizedKeys.keys = [
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO6MxYCqtmUbTMYzHsvQAnmPmWYHFRn4r77oQOEX+iEJ james@USER-PC"
  ];

  security.apparmor = {
    enable = true;
    killUnconfinedConfinables = true;
  };

  services.fail2ban.enable = true;

  environment.systemPackages = with pkgs; [
    apacheHttpd
  ];

  system.stateVersion = "25.05";

  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  websites = {
    enable = true;
    email = "webmaster@jamesdurban.com";

    sites = [
      {
        name = "jamesdurban.com";
        provider = "ionos";
        documentRoot = "/var/www/jamesdurban.com";
        serverAliases = [ "www.jamesdurban.com" "*.jamesdurban.com" ];
      }
      {
        name = "thecontourclinicrichmond.co.uk";
        provider = "ionos";
        documentRoot = "/var/www/thecontourclinicrichmond.co.uk";
        serverAliases = [ "www.thecontourclinicrichmond.co.uk" "*.thecontourclinicrichmond.co.uk" ];
      }
    ];
  };
}
