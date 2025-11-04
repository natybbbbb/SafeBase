import { ethers, upgrades, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const SafeBase = await ethers.getContractFactory("SafeBase");
  const initialValue = 0;
  const owner = await deployer.getAddress();

  console.log("Deploying UUPS proxy...");
  const proxy = await upgrades.deployProxy(SafeBase, [initialValue, owner], {
    kind: "uups",
  });
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log(`Proxy deployed at: ${proxyAddress}`);

  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`Implementation at: ${implAddress}`);

  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
  console.log(`ERC1967 Admin (not used directly by UUPS): ${adminAddress}`);

  // Save deployments file
  const file = path.join("deployments", `${network.name}.json`);
  const record = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    proxy: proxyAddress,
    implementation: implAddress,
    admin: adminAddress,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(file, JSON.stringify(record, null, 2));
  console.log(`Saved: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});