{ config, pkgs, ... }:

{
  imports = [
    ./modules/hardware.nix
    ./modules/networking.nix
    ./modules/website.nix
    ./modules/disk-config.nix
    ./modules/ssh.nix
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
        initialHashedPassword = "$y$j9T$mf3VWdk5RdB4Ix.q2JuTa0$rhnRoL4yzYGCOlaSePTW6cpq79T.LecCTC3EC6DqaS3";
        home = "/home/james";
        isNormalUser = true;
        extraGroups = [ "wheel" "networkmanager" ];
    };
    users.ci = {
        name = "ci";
        home = "/home/ci";
        description = "Account used for CI operations";
        createHome = true;
        isNormalUser = true;
        initialHashedPassword = "$y$j9T$mf3VWdk5RdB4Ix.q2JuTa0$rhnRoL4yzYGCOlaSePTW6cpq79T.LecCTC3EC6DqaS3";
        extraGroups = [ "wwwrun" ];
    };
  };

  security.sudo.enable = true;
  security.sudo.execWheelOnly = true;

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

  age.secrets.ionos.file = ../secrets/ionos.age;

  websites = {
    enable = true;
    email = "james_d02@protonmail.com";

    sites = [
      {
        name = "blackcattattoos.co.uk";
        provider = "ionos";
        documentRoot = "/var/www/blackcattattoos.co.uk";
        serverAliases = [ "www.blackcattattoos.co.uk" "blackcattattoos.co.uk" ];
      }
      {
        name = "staging.blackcattattoos.co.uk";
        provider = "ionos";
        documentRoot = "/var/www/staging.blackcattattoos.co.uk";
        serverAliases = [ "www.staging.blackcattattoos.co.uk" "staging.blackcattattoos.co.uk" ];
      }
      {
        name = "stcatherinesgroup.com";
        provider = "ionos";
        documentRoot = "/var/www/stcatherinesgroup.com";
        serverAliases = [ "www.stcatherinesgroup.com" "stcatherinesgroup.com" ];
      }
      {
        name = "staging.stcatherinesgroup.com";
        provider = "ionos";
        documentRoot = "/var/www/staging.stcatherinesgroup.com";
        serverAliases = [ "www.staging.stcatherinesgroup.com" "staging.stcatherinesgroup.com" ];
      }
    ];
  };
}
