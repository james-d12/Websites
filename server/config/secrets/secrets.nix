let
  user = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHKyFc65RVloYLcrMGYgZ2lEuIUFxMimLnbXBHIExKKo";
  users = [ user];
in
{
  "ionos.age" = {
    publicKeys = [ user ];
    armor = true;
  };
}