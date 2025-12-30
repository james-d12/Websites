{
  networking.hostName = "vps-server";
  networking.networkmanager.enable = true;

  networking.firewall = {
    enable = true;
    allowedTCPPorts = [
      51196
      80
      443
    ];
  };
}
