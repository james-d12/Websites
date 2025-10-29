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
        AllowUsers = [ "james" "ci" ];
        X11Forwarding = false;
    };
    extraConfig = ''
          MaxSessions 3
          MaxAuthTries 6
          LoginGraceTime 20
          ClientAliveInterval 300
          ClientAliveCountMax 0
          AllowTcpForwarding no
          AllowAgentForwarding no
          AllowStreamLocalForwarding no
          AuthenticationMethods publickey
          PermitEmptyPasswords no
    '';
  };

  users.users = {
    james.openssh.authorizedKeys.keys = [
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPgiJiaS9ydBTHyc7YBei0hEyH4rspbWWFJxy73JWfVI james@USER-PC"
    ];
    ci.openssh.authorizedKeys.keys = [
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIxSfuVkLwOIIwyJHkIry+fNXDBtJICHnZc0ej6l6kX3 james@USER-PC"
    ];
  };
}