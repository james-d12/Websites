{ config, pkgs, ... }:

{
  imports = [
    ./modules/hardware.nix
    ./modules/networking.nix
    ./modules/disk-config.nix
    ./modules/ssh.nix
    ./modules/docker
    ./modules/web
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

  nix.settings = {
    trusted-public-keys = [
        cache.vps-1:0B8t1aU6u7uabuiApQzUa0AcKwvn0nbq3lzoc2lCE50=
    ];
    experimental-features = [ "nix-command" "flakes" ];
  };
}
