import { ethers, upgrades } from "hardhat";
import { getAddress } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
  const network = (process.env.HARDHAT_NETWORK || "").trim() || (await ethers.provider.getNetwork()).name;
  const deploymentsDir = path.join(process.cwd(), "deployments");
  const file = path.join(deploymentsDir, `${network}.json`);

  if (!fs.existsSync(file)) throw new Error(`deployments file not found: ${file}`);
  const raw = fs.readFileSync(file, "utf8").trim();
  const data = JSON.parse(raw);

  let proxy = String(data.proxy || data.address || "").trim().replace(/^"+|"+$/g, "");
  if (proxy.startsWith('"') && proxy.endsWith('"')) proxy = proxy.slice(1, -1);

  let proxyAddr;
  try {
    proxyAddr = getAddress(proxy);
  } catch {
    throw new Error(`invalid proxy address: ${proxy}`);
  }

  const Impl = await ethers.getContractFactory("SafeBaseV2");
  const upgraded = await upgrades.upgradeProxy(proxyAddr, Impl);
  await upgraded.waitForDeployment();

  const implAddr = await upgrades.erc1967.getImplementationAddress(proxyAddr);
  fs.writeFileSync(file, JSON.stringify({ proxy: proxyAddr, implementation: implAddr }, null, 2));

  if ("initializeV2" in (upgraded as any)) {
    try {
      const tx = await (upgraded as any).initializeV2();
      await tx.wait();
    } catch {}
  }

  console.log(`Proxy: ${proxyAddr}`);
  console.log(`Implementation: ${implAddr}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
