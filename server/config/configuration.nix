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
        initialHashedPassword = "$y$j9T$mf3VWdk5RdB4Ix.q2JuTa0$rhnRoL4yzYGCOlaSePTW6cpq79T.LecCTC3EC6DqaS3";
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
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPgiJiaS9ydBTHyc7YBei0hEyH4rspbWWFJxy73JWfVI james@USER-PC"
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
    email = "james_d02@protonmail.com";

    sites = [
      {
        name = "blackcattattoos.co.uk";
        provider = "ionos";
        documentRoot = "/var/www/blackcattattoos.co.uk";
        serverAliases = [ "www.blackcattattoos.co.uk" "*.blackcattattoos.co.uk" ];
      }
    ];
  };
}
