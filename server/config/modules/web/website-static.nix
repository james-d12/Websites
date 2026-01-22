{
  config,
  pkgs,
  lib,
  ...
}:

let
  defaultHeaders = ''
    Header always set Strict-Transport-Security "max-age=63072000; includeSubdomains;"
    Header always set Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self';"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Cross-Origin-Opener-Policy "same-origin"
    Header always set Cross-Origin-Embedder-Policy "unsafe-none"
    Header always set Cross-Origin-Resource-Policy "cross-origin"
    Header always set Permissions-Policy "accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), screen-wake-lock=(), ambient-light-sensor=(), bluetooth=(), vr=(), xr-spatial-tracking=()"
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
    services.httpd.extraModules = [
      "deflate"
      "headers"
      "rewrite"
      "expires"
    ];
    services.httpd.sslProtocols = "All -SSLv2 -SSLv3 -TLSv1 -TLSv1.1";
    services.httpd.sslCiphers = "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:!aNULL:!eNULL:!LOW:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS";

    services.httpd.virtualHosts = lib.mkMerge (
      map (
        site:
        let
          stagingHeader =
            if site.isStaging then ''Header always set X-Robots-Tag "noindex, nofollow"'' else "";
        in
        {
          "${site.name}" = {
            forceSSL = true;
            documentRoot = site.documentRoot;
            serverAliases = site.serverAliases;
            useACMEHost = site.name;
            extraConfig = lib.concatStringsSep "\n" [
              defaultHeaders
              (site.extraHeaders or "")
              stagingHeader
              ''
                  <Directory "${site.documentRoot}">
                    Options -Indexes
                    AllowOverride None
                    Require all granted
                  </Directory>

                  ErrorDocument 404 ${site.errorDocument or "/404.html"}

                  RewriteEngine On

                  # Redirect HTTP directly to HTTPS non-www
                  RewriteCond %{HTTPS} off
                  RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge
                  RewriteRule ^ https://${site.name}%{REQUEST_URI} [R=301,L]

                  # Redirect HTTPS www → HTTPS non-www
                  RewriteCond %{HTTPS} on
                  RewriteCond %{HTTP_HOST} ^www\.${site.name}$ [NC]
                  RewriteRule ^ https://${site.name}%{REQUEST_URI} [R=301,L]

                  SSLEngine on
                  SSLHonorCipherOrder on

                  <IfModule mod_deflate.c>
                     SetOutputFilter DEFLATE
                  </IfModule>

                  <IfModule mod_expires.c>
                      ExpiresActive on

                      ExpiresByType image/jpeg "access plus 1 month"
                      ExpiresByType image/gif "access plus 1 month"
                      ExpiresByType image/png "access plus 1 month"
                      ExpiresByType image/webp "access plus 1 month"
                      ExpiresByType image/avif "access plus 1 month"

                      ExpiresByType font/ttf "access plus 1 month"
                      ExpiresByType font/woff "access plus 1 month"
                      ExpiresByType font/woff2 "access plus 1 month"

                      ExpiresByType text/css "access plus 1 month"
                      ExpiresByType application/javascript "access plus 1 month"
                      ExpiresByType text/javascript "access plus 1 month"
                  </IfModule>
              ''
            ];
          };
        }
      ) config.websites.sites
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

    systemd.tmpfiles.rules = map (
      site: "d ${site.documentRoot} 0775 wwwrun wwwrun -"
    ) config.websites.sites;

    systemd.tmpfiles.settings = lib.mkMerge [
      (lib.listToAttrs (
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
      ))
      {
        "acme-challenges" = {
          "/var/lib/acme/.challenges" = {
            d = {
              user = "wwwrun";
              group = "wwwrun";
              mode = "0755";
            };
          };
        };
      }
      {
        "backup" = {
          "/var/www/backup" = {
            d = {
              user = "ci";
              group = "wwwrun";
              mode = "0755";
            };
          };
        };
      }
      {
        "acme-env" = {
          "/var/lib/acme/acme.env" = {
            f = {
              user = "wwwrun";
              group = "wwwrun";
              mode = "0755";
            };
          };
        };
      }
    ];
  };
}
