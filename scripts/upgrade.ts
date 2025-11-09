import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const network = (process.env.HARDHAT_NETWORK || "").trim() || (await ethers.provider.getNetwork()).name;
  const deploymentsDir = path.join(process.cwd(), "deployments");
  const file = path.join(deploymentsDir, `${network}.json`);

  if (!fs.existsSync(file)) {
    throw new Error(`deployments file not found: ${file}`);
  }

  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);

  let proxy: string =
    String(data.proxy || data.proxyAddress || data.address || "").trim();

  if (!proxy || !ethers.isAddress(proxy)) {
    throw new Error(`invalid proxy address in ${file}: "${proxy}"`);
  }

  const Impl = await ethers.getContractFactory("SafeBaseV2");
  const upgraded = await upgrades.upgradeProxy(proxy, Impl);
  await upgraded.waitForDeployment();

  const proxyAddr = await upgraded.getAddress();
  const implAddr = await upgrades.erc1967.getImplementationAddress(proxyAddr);

  const out = {
    proxy: proxyAddr,
    implementation: implAddr,
  };

  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n", "utf8");

  if ("initializeV2" in (upgraded as any)) {
    try {
      const tx = await (upgraded as any).initializeV2();
      await tx.wait();
    } catch {}
  }

  console.log(`proxy: ${proxyAddr}`);
  console.log(`implementation: ${implAddr}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
