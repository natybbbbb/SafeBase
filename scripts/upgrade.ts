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

  const rawProxy = String(data.proxy || "").trim();
  if (!rawProxy) throw new Error(`proxy address missing in ${file}`);

  let proxyAddr: string;
  try { proxyAddr = getAddress(rawProxy); } catch { throw new Error(`invalid proxy address: ${rawProxy}`); }

  const implHint = data.implementation ? String(data.implementation).trim() : "";
  try {
    const implFromProxy = await upgrades.erc1967.getImplementationAddress(proxyAddr);
    if (implHint && getAddress(implHint) === getAddress(proxyAddr)) {
      throw new Error(`proxy address equals implementation in ${file}`);
    }
    if (implHint && getAddress(implHint) !== getAddress(implFromProxy)) {
      fs.writeFileSync(file, JSON.stringify({ proxy: proxyAddr, implementation: implFromProxy }, null, 2));
    }
  } catch {
    const ImplProbe = await ethers.getContractFactory("SafeBaseV2");
    await upgrades.forceImport(proxyAddr, ImplProbe, { kind: "uups" });
  }

  const Impl = await ethers.getContractFactory("SafeBaseV2");
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
