{ ... }:

{
  imports = [
    ./directus
  ];

  virtualisation.docker = {
    enable = true;
  };
}
