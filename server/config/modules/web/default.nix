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
        provider = "ionos";
        documentRoot = "/var/www/blackcattattoos.co.uk";
        serverAliases = [
          "www.blackcattattoos.co.uk"
          "blackcattattoos.co.uk"
        ];
        isStaging = false;
        errorDocument = "404.html";
      }
      {
        name = "staging.blackcattattoos.co.uk";
        provider = "ionos";
        documentRoot = "/var/www/staging.blackcattattoos.co.uk";
        serverAliases = [
          "www.staging.blackcattattoos.co.uk"
          "staging.blackcattattoos.co.uk"
        ];
        isStaging = true;
        errorDocument = "404.html";
      }
      {
        name = "stcatherinesgroup.com";
        provider = "ionos";
        documentRoot = "/var/www/stcatherinesgroup.com";
        serverAliases = [
          "www.stcatherinesgroup.com"
          "stcatherinesgroup.com"
        ];
        isStaging = false;
      }
      {
        name = "staging.stcatherinesgroup.com";
        provider = "ionos";
        documentRoot = "/var/www/staging.stcatherinesgroup.com";
        serverAliases = [
          "www.staging.stcatherinesgroup.com"
          "staging.stcatherinesgroup.com"
        ];
        isStaging = true;
      }
      {
        name = "thecontourclinicrichmond.co.uk";
        provider = "ionos";
        documentRoot = "/var/www/thecontourclinicrichmond.co.uk";
        serverAliases = [
          "www.thecontourclinicrichmond.co.uk"
          "thecontourclinicrichmond.co.uk"
        ];
        isStaging = false;
      }
      {
        name = "staging.thecontourclinicrichmond.co.uk";
        provider = "ionos";
        documentRoot = "/var/www/staging.thecontourclinicrichmond.co.uk";
        serverAliases = [
          "www.staging.thecontourclinicrichmond.co.uk"
          "staging.thecontourclinicrichmond.co.uk"
        ];
        isStaging = true;
      }
      {
        name = "jamesdurban.com";
        provider = "ionos";
        documentRoot = "/var/www/jamesdurban.com";
        serverAliases = [
          "www.jamesdurban.com"
          "jamesdurban.com"
        ];
        isStaging = false;
      }
      {
        name = "staging.jamesdurban.com";
        provider = "ionos";
        documentRoot = "/var/www/staging.jamesdurban.com";
        serverAliases = [
          "www.staging.jamesdurban.com"
          "staging.jamesdurban.com"
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
        provider = "ionos";
        proxyTo = "http://127.0.0.1:8055/";
      }
    ];
  };
}
