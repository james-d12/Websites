{
  security.acme = {
    acceptTerms = true;
    defaults.email = "webmaster@jamesdurban.com";

    certs."jamesdurban.com" = {
      webroot = "/var/www/jamesdurban.com";
      group = "httpd";
    };
  };

  services.httpd = {
    enable = true;
    enablePerl = false;
    enablePHP = false;

    sslProtocols = "All -SSLv2 -SSLv3 -TLSv1 -TLSv1.1";
    sslCiphers = "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:!aNULL:!eNULL:!LOW:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS";

    virtualHosts."jamesdurban.com" = {
      forceSSL = true;
      documentRoot = "/var/www/jamesdurban.com";
      serverAliases = [ "www.jamesdurban.com" "*.jamesdurban.com" ];

      useACMEHost = "jamesdurban.com";

      extraConfig = ''
        Header always set Strict-Transport-Security "max-age=63072000; includeSubdomains;"
        Header set Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self';"
        Header set X-Frame-Options "DENY"
        Header set X-Content-Type-Options "nosniff"
        Header always set X-XSS-Protection "1; mode=block"
        Header always set Referrer-Policy "strict-origin-when-cross-origin"
        Header always set Cross-Origin-Opener-Policy "same-origin"
        Header always set Cross-Origin-Embedder-Policy "require-corp"
        Header always set Cross-Origin-Resource-Policy "same-origin"

        <Directory "/var/www/jamesdurban.com">
          Options -Indexes
          AllowOverride None
          Require all granted
        </Directory>

        SSLEngine on
        SSLHonorCipherOrder on
      '';
    };
  };
}
