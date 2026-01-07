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
  options.websitesProxy = {
    enable = lib.mkEnableOption "Reverse-proxied websites";

    email = lib.mkOption {
      type = lib.types.str;
      description = "Email for Let's Encrypt";
    };

    sites = lib.mkOption {
      type = lib.types.listOf lib.types.attrs;
      default = [ ];
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

      sslProtocols = "All -SSLv2 -SSLv3 -TLSv1 -TLSv1.1";
      sslCiphers = "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:!aNULL:!eNULL:!LOW:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS";
    };

    services.httpd.virtualHosts = lib.mkMerge (
      map (site: {
        "${site.name}" = {
          forceSSL = true;
          documentRoot = "/var/empty";
          serverAliases = site.serverAliases or [ ];
          useACMEHost = site.name;

          extraConfig = lib.concatStringsSep "\n" [
            defaultHeaders
            (site.extraHeaders or "")
            ''
              ProxyPreserveHost On
              ProxyRequests Off

              ProxyPass        / ${site.proxyTo} retry=0 timeout=300
              ProxyPassReverse / ${site.proxyTo}

              RequestHeader set X-Forwarded-Proto "https"
              RequestHeader set X-Forwarded-Host "%{HTTP_HOST}s"
              RequestHeader set X-Forwarded-Port "443"
              RequestHeader set X-Forwarded-Ssl on
            ''
          ];
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
