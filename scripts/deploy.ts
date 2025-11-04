import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const SafeBase = await hre.ethers.getContractFactory("SafeBase");
  const proxy = await hre.upgrades.deployProxy(SafeBase, [0, deployer.address], { kind: "uups" });
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  const implAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);
  const adminAddress = await hre.upgrades.erc1967.getAdminAddress(proxyAddress);
  const file = path.join("deployments", `${hre.network.name}.json`);
  const record = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
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
