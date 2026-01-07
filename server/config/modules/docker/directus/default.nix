{ pkgs, ... }:

{
  users.users.docker-directus = {
    isSystemUser = true;
    group = "docker-directus";
    home = "/var/lib/directus";
    createHome = true;
    description = "Docker user for Directus";
    extraGroups = [ "docker" ];
  };

  users.groups.docker-directus = { };

  systemd.services.directus = {
    description = "Directus CMS";
    after = [
      "network.target"
      "docker.service"
    ];
    wants = [ "docker.service" ];

    serviceConfig = {
      Type = "simple";
      WorkingDirectory = "/var/lib/directus";
      ExecStart = "${pkgs.docker}/bin/docker compose -f docker-compose.yml up --force-recreate";
      ExecStop = "${pkgs.docker}/bin/docker compose -f docker-compose.yml down";
      Restart = "always";
      RestartSec = 5;
    };

    wantedBy = [ "multi-user.target" ];
  };

  systemd.tmpfiles.settings = {
    "directus" = {
      "/var/lib/directus" = {
        d = {
          user = "docker-directus";
          group = "docker-directus";
          mode = "0755";
        };
      };
      "/var/lib/directus/uploads" = {
        d = {
          user = "docker-directus";
          group = "docker-directus";
          mode = "0777";
        };
      };
      "/var/lib/directus/extensions" = {
        d = {
          user = "docker-directus";
          group = "docker-directus";
          mode = "0777";
        };
      };
      "/var/lib/directus/database" = {
        d = {
          user = "docker-directus";
          group = "docker-directus";
          mode = "0777";
        };
      };
      "/var/lib/directus/docker-compose.yml" = {
        "L+" = {
          user = "docker-directus";
          group = "docker-directus";
          mode = "0644";
          argument = "${./docker-compose.yml}";
        };
      };
    };
  };
}
