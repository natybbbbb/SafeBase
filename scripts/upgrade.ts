import { ethers, upgrades, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const file = path.join("deployments", network.name + ".json");
  if (!fs.existsSync(file)) {
    throw new Error("Deployments file not found: " + file);
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const proxy = data.proxy as string;
  if (!proxy) {
    throw new Error("Proxy address is missing in " + file);
  }

  const Factory = await ethers.getContractFactory("SafeBaseV2");
  const nextImpl = await upgrades.prepareUpgrade(proxy, Factory, { kind: "uups" });

  const implTx = await upgrades.upgradeProxy(proxy, Factory, { kind: "uups" });
  await implTx.waitForDeployment();

  const implAddr = await upgrades.erc1967.getImplementationAddress(proxy);

  const record = {
    ...data,
    implementation: implAddr,
    upgradedAt: new Date().toISOString()
  };
  fs.writeFileSync(file, JSON.stringify(record, null, 2));

  const v2 = await ethers.getContractAt("SafeBaseV2", proxy);
  try {
    const tx = await v2.initializeV2();
    await tx.wait(1);
  } catch {}

  console.log("Proxy:", proxy);
  console.log("Implementation:", implAddr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
