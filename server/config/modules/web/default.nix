{
  imports = [
    ./website-static.nix
    ./website-proxy.nix
  ];

  websites = {
    enable = true;
    email = "james_d02@protonmail.com";

    sites = [
      {
        name = "blackcattattoos.co.uk";
        provider = "cloudflare";
        documentRoot = "/var/www/blackcattattoos.co.uk";
        serverAliases = [
          "www.blackcattattoos.co.uk"
          "blackcattattoos.co.uk"
        ];
        isStaging = false;
        errorDocument = "/404.html";
      }
      {
        name = "staging.blackcattattoos.co.uk";
        provider = "cloudflare";
        documentRoot = "/var/www/staging.blackcattattoos.co.uk";
        serverAliases = [
          "staging.blackcattattoos.co.uk"
        ];
        isStaging = true;
        errorDocument = "/404.html";
      }
      {
        name = "stcatherinesgroup.com";
        provider = "cloudflare";
        documentRoot = "/var/www/stcatherinesgroup.com";
        serverAliases = [
          "www.stcatherinesgroup.com"
          "stcatherinesgroup.com"
        ];
        isStaging = false;
      }
      {
        name = "staging.stcatherinesgroup.com";
        provider = "cloudflare";
        documentRoot = "/var/www/staging.stcatherinesgroup.com";
        serverAliases = [
          "staging.stcatherinesgroup.com"
        ];
        isStaging = true;
      }
      {
        name = "thecontourclinicrichmond.co.uk";
        provider = "cloudflare";
        documentRoot = "/var/www/thecontourclinicrichmond.co.uk";
        serverAliases = [
          "www.thecontourclinicrichmond.co.uk"
          "thecontourclinicrichmond.co.uk"
        ];
        isStaging = false;
      }
      {
        name = "staging.thecontourclinicrichmond.co.uk";
        provider = "cloudflare";
        documentRoot = "/var/www/staging.thecontourclinicrichmond.co.uk";
        serverAliases = [
          "staging.thecontourclinicrichmond.co.uk"
        ];
        isStaging = true;
      }
      {
        name = "jamesdurban.com";
        provider = "cloudflare";
        documentRoot = "/var/www/jamesdurban.com";
        serverAliases = [
          "www.jamesdurban.com"
          "jamesdurban.com"
        ];
        isStaging = false;
      }
      {
        name = "staging.jamesdurban.com";
        provider = "cloudflare";
        documentRoot = "/var/www/staging.jamesdurban.com";
        serverAliases = [
          "staging.jamesdurban.com"
        ];
        isStaging = true;
      }
      {
        name = "orchitect.net";
        provider = "cloudflare";
        documentRoot = "/var/www/orchitect.com";
        serverAliases = [
          "www.orchitect.com"
          "orchitect.com"
        ];
        isStaging = false;
      }
      {
        name = "staging.orchitect.net";
        provider = "cloudflare";
        documentRoot = "/var/www/staging.orchitect.net";
        serverAliases = [
          "staging.orchitect.net"
        ];
        isStaging = true;
      }
    ];
  };

  websitesProxy = {
    enable = true;
    email = "james_d02@protonmail.com";

    sites = [
      {
        name = "cms.blackcattattoos.co.uk";
        provider = "cloudflare";
        proxyTo = "http://127.0.0.1:8055/";
      }
    ];
  };
}
