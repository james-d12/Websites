{
  networking.hostName = "vps-server";
  networking.networkmanager.enable = true;

  networking.firewall = {
      enable = true;
      allowedTCPPorts = [ 22 80 443 ];
  };
}