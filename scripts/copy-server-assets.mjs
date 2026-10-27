import { cp } from "node:fs/promises";
import { URL } from "node:url";

for (const asset of ["clients.json", "avatars"]) {
  await cp(
    new URL(`../server/${asset}`, import.meta.url),
    new URL(`../build/server/${asset}`, import.meta.url),
    { recursive: true },
  );
}
