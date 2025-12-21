{ pkgs, ... }:

{
  systemd.services.strapi = {
    description = "Strapi CMS (rootless Docker)";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];

    serviceConfig = {
      User = "docker-strapi";
      Group = "docker-strapi";

      WorkingDirectory = "/var/lib/strapi/app";

      ExecStart =
        "${pkgs.docker}/bin/docker compose up --force-recreate";
      ExecStop =
        "${pkgs.docker}/bin/docker compose down";

      Restart = "always";
      RestartSec = 5;

      NoNewPrivileges = true;
      PrivateTmp = true;
      ProtectSystem = "strict";
      ProtectHome = false;
    };
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
