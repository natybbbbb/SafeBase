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

  let proxy = String(data.proxy || "").trim().replace(/^"+|"+$/g, "");
  let implHint = String(data.implementation || "").trim().replace(/^"+|"+$/g, "");

  let proxyAddr: string | null = null;
  let implAddrHint: string | null = null;

  try { proxyAddr = getAddress(proxy); } catch { throw new Error(`invalid proxy address: ${proxy}`); }
  try { implAddrHint = implHint ? getAddress(implHint) : null; } catch { implAddrHint = null; }

  if (implAddrHint && proxyAddr.toLowerCase() === implAddrHint.toLowerCase()) {
    throw new Error(`proxy address equals implementation address: ${proxyAddr}`);
  }

  const Impl = await ethers.getContractFactory("SafeBaseV2");

  let needsImport = false;
  try {
    await upgrades.erc1967.getImplementationAddress(proxyAddr);
  } catch {
    needsImport = true;
  }
  if (needsImport) {
    await upgrades.forceImport(proxyAddr, Impl, { kind: "uups" });
  }

  const upgraded = await upgrades.upgradeProxy(proxyAddr, Impl);
  await upgraded.waitForDeployment();

  const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddr);
  fs.writeFileSync(file, JSON.stringify({ proxy: proxyAddr, implementation: newImpl }, null, 2));

  if ("initializeV2" in (upgraded as any)) {
    try {
      const tx = await (upgraded as any).initializeV2();
      await tx.wait();
    } catch {}
  }

  console.log(`Proxy: ${proxyAddr}`);
  console.log(`Implementation: ${newImpl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
