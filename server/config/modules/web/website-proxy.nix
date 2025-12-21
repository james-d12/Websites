{ config, pkgs, lib, ... }:

{
  options.websitesProxy = {
    enable = lib.mkEnableOption "Reverse-proxied websites";

    email = lib.mkOption {
      type = lib.types.str;
      description = "Email for Let's Encrypt";
    };

    sites = lib.mkOption {
      type = lib.types.listOf lib.types.attrs;
      default = [];
      description = "Proxy sites";
    };
  };

  config = lib.mkIf config.websitesProxy.enable {

    users.users.wwwrun.extraGroups = [ "acme" ];

    services.httpd = {
      enable = true;

      extraModules = [
        "proxy"
        "proxy_http"
        "proxy_wstunnel"
        "headers"
        "rewrite"
        "ssl"
      ];
    };

    services.httpd.virtualHosts = lib.mkMerge (
      map (site: {
        "${site.name}" = {
          forceSSL = true;
          documentRoot = "/var/empty";
          serverAliases = site.serverAliases or [];
          useACMEHost = site.name;

          extraConfig = ''
            ProxyPreserveHost On
            ProxyRequests Off

            <Proxy *>
              Require all granted
            </Proxy>

            ProxyPass        / ${site.proxyTo}/ retry=0 timeout=300
            ProxyPassReverse / ${site.proxyTo}/

            RewriteEngine On
            RewriteCond %{HTTP:Upgrade} =websocket [NC]
            RewriteRule /(.*) ws://${lib.removePrefix "http://" site.proxyTo}/$1 [P,L]
            RewriteCond %{HTTP:Upgrade} !=websocket [NC]
            RewriteRule /(.*) ${site.proxyTo}/$1 [P,L]

            RequestHeader set X-Forwarded-Proto "https"
            RequestHeader set X-Forwarded-Ssl on

            SSLEngine on
            SSLHonorCipherOrder on
          '';
        };
      }) config.websitesProxy.sites
    );

    security.acme = {
      acceptTerms = true;
      defaults.email = config.websitesProxy.email;

      certs = lib.listToAttrs (
        map (site: {
          name = site.name;
          value = {
            dnsProvider = site.provider;
            group = "wwwrun";
            environmentFile = "/var/lib/acme/acme.env";
          };
        }) config.websitesProxy.sites
      );
    };
  };
}
