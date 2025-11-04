import { network, run } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const file = path.join("deployments", `${network.name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Deployment file not found: ${file}`);
  }
  const { implementation } = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!implementation) throw new Error("No implementation address in deployment file.");

  console.log(`Verifying implementation on ${network.name}: ${implementation}`);
  await run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });
  console.log("Verification submitted.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});