import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

describe("SafeBase upgrade flow", function () {
  it("deploys and upgrades proxy", async () => {
    const [owner] = await ethers.getSigners();
    const V1 = await ethers.getContractFactory("SafeBase");
    const proxy = await upgrades.deployProxy(V1, [0, owner.address], { kind: "uups" });
    await proxy.waitForDeployment();

    const V2 = await ethers.getContractFactory("SafeBaseV2");
    const upgraded = await upgrades.upgradeProxy(await proxy.getAddress(), V2, { kind: "uups" });

    const v2 = V2.attach(await upgraded.getAddress());
    await (await v2.initializeV2()).wait();

    const value = await v2.getValue();
    expect(value).to.equal(1n);
  });
});
