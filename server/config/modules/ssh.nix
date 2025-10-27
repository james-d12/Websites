{
  services.openssh = {
    enable = true;
    ports = [ 51196 ];
    allowSFTP = false;
    settings = {
        KbdInteractiveAuthentication = false;
        PermitRootLogin = "no";
        UsePAM = false;
        StrictModes = true;
        PasswordAuthentication = false;
        AllowUsers = [ "james" ];
        X11Forwarding = false;
    };
    extraConfig = ''
          MaxSessions 2
          ClientAliveInterval 300
          ClientAliveCountMax 0
          AllowTcpForwarding yes
          AllowAgentForwarding no
          AllowStreamLocalForwarding no
          AuthenticationMethods publickey
    '';
  };

  users.users.james.openssh.authorizedKeys.keys = [
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPgiJiaS9ydBTHyc7YBei0hEyH4rspbWWFJxy73JWfVI james@USER-PC"
  ];
}