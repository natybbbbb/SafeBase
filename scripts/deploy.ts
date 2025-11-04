import { ethers, upgrades, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const SafeBase = await ethers.getContractFactory("SafeBase");
  const proxy = await upgrades.deployProxy(SafeBase, [0, deployer.address], { kind: "uups" });
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
