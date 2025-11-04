import { ethers, upgrades, network } from "hardhat";
import fs from "fs";
import path from "path";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const [deployer] = await ethers.getSigners();

  const balance = await ethers.provider.getBalance(deployer.address);
  const fee = await ethers.provider.getFeeData();

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(
    `Fee max: ${fee.maxFeePerGas ? ethers.formatUnits(fee.maxFeePerGas, "gwei") : "n/a"} gwei, ` +
    `priority: ${fee.maxPriorityFeePerGas ? ethers.formatUnits(fee.maxPriorityFeePerGas, "gwei") : "n/a"} gwei`
  );

  if (balance === 0n) {
    throw new Error("Deployer balance is 0. Fund the address with ETH on the target network.");
  }

  const SafeBase = await ethers.getContractFactory("SafeBase");
  const proxy = await upgrades.deployProxy(SafeBase, [0, deployer.address], { kind: "uups" });
  await proxy.waitForDeployment();

  const deployTx = proxy.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(2);
  }

  const proxyAddress = await proxy.getAddress();

  let implAddress = "";
  let adminAddress = "";
  for (let i = 0; i < 10; i++) {
    try {
      implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
      adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
      if (implAddress && implAddress !== ethers.ZeroAddress) break;
    } catch {}
    await sleep(2000);
  }

  if (!implAddress || implAddress === ethers.ZeroAddress) {
    throw new Error(`Implementation address is empty for proxy ${proxyAddress} after retries`);
  }

  const file = path.join("deployments", `${network.name}.json`);
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
