let
  user = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHKyFc65RVloYLcrMGYgZ2lEuIUFxMimLnbXBHIExKKo";
  users = [ user];
in
{
  "secret1.age".publicKeys = [ user1 system1 ];
  "secret2.age".publicKeys = users ++ systems;
  "armored-secret.age" = {
    publicKeys = [ user1 ];
    armor = true;
  };
}