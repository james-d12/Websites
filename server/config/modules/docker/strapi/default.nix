{ pkgs, ... }:

{
  systemd.services.strapi = {
    description = "Strapi CMS (Docker as root)";
    after = [
      "network.target"
      "docker.service"
    ];
    wants = [ "docker.service" ];

    serviceConfig = {
      Type = "simple";
      WorkingDirectory = "/var/lib/strapi/app";
      ExecStart = "${pkgs.docker}/bin/docker compose -f docker-compose.yml up --force-recreate";
      ExecStop  = "${pkgs.docker}/bin/docker compose -f docker-compose.yml down";
      Restart = "always";
      RestartSec = 5;
    };

    wantedBy = [ "multi-user.target" ];
  };

  systemd.tmpfiles.settings = {
    "strapi-app" = {
      "/var/lib/strapi/app" = {
        d = {
            user = "docker-strapi";
            group = "docker-strapi";
            mode = "0755";
        };
      };
    };

    "strapi-data" = {
      "/var/lib/strapi/data" = {
        d = {
            user = "docker-strapi";
            group = "docker-strapi";
            mode = "0755";
        };
      };
    };
  };
}
