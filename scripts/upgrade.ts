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
  try { 
    proxyAddr = getAddress(rawProxy); 
  } catch { 
    throw new Error(`invalid proxy address: ${rawProxy}`); 
  }

  console.log(`\n🚀 Upgrading proxy on ${network}...`);
  console.log(`Proxy address: ${proxyAddr}`);

  let implFromProxy = "";
  try {
    implFromProxy = await upgrades.erc1967.getImplementationAddress(proxyAddr);
    console.log(`Current implementation: ${implFromProxy}`);
  } catch (e) {
    console.log(`⚠️  Could not read implementation from proxy`);
  }

  const SafeBaseV3 = await ethers.getContractFactory("SafeBaseV3");

  console.log(`\n🔧 Force importing existing proxy...`);
  try {
    await upgrades.forceImport(proxyAddr, SafeBaseV3, { kind: "uups" });
    console.log(`✅ Proxy imported successfully`);
  } catch (e: any) {
    console.log(`ℹ️  Force import: ${e.message}`);
  }

  console.log(`\n📦 Deploying new implementation...`);
  
  const upgraded = await upgrades.upgradeProxy(proxyAddr, SafeBaseV3, { kind: "uups" });
  await upgraded.waitForDeployment();

  const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddr);
  console.log(`✅ New implementation deployed: ${newImpl}`);

  const record = {
    network: network,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    proxy: proxyAddr,
    implementation: newImpl,
    upgradedAt: new Date().toISOString(),
    version: "v3"
  };

  fs.writeFileSync(file, JSON.stringify(record, null, 2));
  console.log(`\n📝 Deployment file updated: ${file}`);

  let feeRate = 0n;
  try {
    console.log(`\n🔧 Calling initializeV3()...`);
    const tx = await (upgraded as any).initializeV3();
    await tx.wait();
    console.log(`✅ InitializeV3 completed`);
    feeRate = await (upgraded as any).feeRate();
  } catch (e: any) {
    if (e.message && e.message.includes("already initialized")) {
      console.log(`ℹ️  Contract already initialized (this is normal)`);
    } else {
      console.log(`⚠️  InitializeV3 may have failed, but upgrade was successful`);
      console.log(`   Error: ${e.message || e}`);
    }
    try {
      feeRate = await (upgraded as any).feeRate();
    } catch {}
  }
  if (feeRate > 0n) {
    console.log(`\n📊 Contract state:`);
    console.log(`   Fee rate: ${feeRate.toString()} (${Number(feeRate) / 100}%)`);
    console.log(`   Max fee rate: 500 (5%)`);
  }

  console.log(`\n✅ Upgrade completed successfully!`);
  console.log(`\n🔗 Verify on BaseScan:`);
  if (network === "base") {
    console.log(`   https://basescan.org/address/${proxyAddr}`);
  } else if (network === "base_sepolia") {
    console.log(`   https://sepolia.basescan.org/address/${proxyAddr}`);
  }
}

main().catch((e) => {
  console.error(`\n❌ Upgrade failed:`, e);
  process.exit(1);
});
