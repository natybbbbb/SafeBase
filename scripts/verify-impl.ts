import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const file = path.join("deployments", `${hre.network.name}.json`);
  const { implementation } = JSON.parse(fs.readFileSync(file, "utf8"));
  await hre.run("verify:verify", { address: implementation, constructorArguments: [] });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
