{ config, pkgs, lib, ... }:

let
  defaultHeaders = ''
    Header always set Strict-Transport-Security "max-age=63072000; includeSubdomains;"
    Header set Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self';"
    Header set X-Frame-Options "DENY"
    Header set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Cross-Origin-Opener-Policy "same-origin"
    Header always set Cross-Origin-Embedder-Policy "require-corp"
    Header always set Cross-Origin-Resource-Policy "same-origin"
  '';
in

{
  options.websites = {
    enable = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Enable the websites module";
    };

    email = lib.mkOption {
      type = lib.types.str;
      description = "The email for the Lets Encrypt";
    };

    sites = lib.mkOption {
      type = lib.types.listOf lib.types.attrs;
      default = [ ];
      description = "List of sites to configure";
    };
  };

  config = lib.mkIf config.websites.enable {
    users.users.wwwrun.extraGroups = [ "acme" ];
    services.httpd.enable = true;
    services.httpd.sslProtocols = "All -SSLv2 -SSLv3 -TLSv1 -TLSv1.1";
    services.httpd.sslCiphers = "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:!aNULL:!eNULL:!LOW:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS";

    services.httpd.virtualHosts = lib.mkMerge (
      map (site: {
        "${site.name}" = {
          forceSSL = true;
          documentRoot = site.documentRoot;
          serverAliases = site.serverAliases;
          useACMEHost = site.name;
          extraConfig = lib.concatStringsSep "\n" [
            defaultHeaders
            ''
              <Directory "${site.documentRoot}">
                Options -Indexes
                AllowOverride None
                Require all granted
              </Directory>

              SSLEngine on
              SSLHonorCipherOrder on
            ''
          ];
        };
        "acmechallenge.${site.name}" = {
          serverAliases = site.serverAliases;
          documentRoot = "/var/lib/acme/.challenges";
          extraConfig = ''
            RewriteEngine On
            RewriteCond %{HTTPS} off
            RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge [NC]
            RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI} [R=301]'';
        };
      }) config.websites.sites
    );

    security.acme = {
      acceptTerms = true;
      defaults.email = config.websites.email;

      certs = lib.listToAttrs (
        map (site: {
          name = site.name;
          value = {
            dnsProvider = site.provider;
            group = "wwwrun";
            environmentFile = "/var/lib/acme/acme.env";
          };
        }) config.websites.sites
      );
    };

    systemd.tmpfiles.settings = lib.listToAttrs (
      map (site: {
        name = site.name;
        value = {
          ${site.documentRoot} = {
            d = {
              user = "wwwrun";
              group = "wwwrun";
              mode = "0755";
            };
          };
        };
      }) config.websites.sites
    );
  };
}

