import { ethers, upgrades, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  const balance = await ethers.provider.getBalance(deployer.address);
  const fee = await ethers.provider.getFeeData();
  const envMaxFee = process.env.MAX_FEE_PER_GAS_GWEI ? ethers.parseUnits(process.env.MAX_FEE_PER_GAS_GWEI, "gwei") : fee.maxFeePerGas ?? 0n;
  const envPriority = process.env.MAX_PRIORITY_FEE_PER_GAS_GWEI ? ethers.parseUnits(process.env.MAX_PRIORITY_FEE_PER_GAS_GWEI, "gwei") : fee.maxPriorityFeePerGas ?? 0n;

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Fee max: ${ethers.formatUnits(envMaxFee, "gwei")} gwei, priority: ${ethers.formatUnits(envPriority, "gwei")} gwei`);

  if (balance === 0n) {
    throw new Error("Deployer balance is 0. Fund the address with ETH on Base mainnet.");
  }

  const SafeBase = await ethers.getContractFactory("SafeBase");

  const proxy = await upgrades.deployProxy(
    SafeBase,
    [0, deployer.address],
    { kind: "uups", txOverrides: { maxFeePerGas: envMaxFee, maxPriorityFeePerGas: envPriority } as any }
  );

  await proxy.waitForDeployment();
  const deployTx = proxy.deploymentTransaction();
  if (deployTx) await deployTx.wait(2);

  const proxyAddress = await proxy.getAddress();

  let implAddress = "";
  let adminAddress = "";
  for (let i = 0; i < 10; i++) {
    try {
      implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
      adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
      if (implAddress && implAddress !== ethers.ZeroAddress) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!implAddress || implAddress === ethers.ZeroAddress) {
    throw new Error(`Implementation address is empty for proxy ${proxyAddress} after retries`);
  }

  const file = path.join("deployments", `${network.name}.json");
  const { chainId } = await ethers.provider.getNetwork();
  const record = {
    network: network.name,
    chainId: chainId.toString(),
    proxy: proxyAddress,
    implementation: implAddress,
    admin: adminAddress,
    deployedAt: new Date().toISOString()
  };
  fs.writeFileSync(file, JSON.stringify(record, null, 2));
  console.log(`Saved: ${file}`);
  console.log(`Proxy: ${proxyAddress}`);
  console.log(`Implementation: ${implAddress}`);
  console.log(`Admin: ${adminAddress}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
