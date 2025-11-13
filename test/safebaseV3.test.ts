import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SafeBaseV3 - Enhanced Escrow", function () {
  let safeBase: any;
  let owner: any;
  let payer: any;
  let payee: any;
  let arbiter: any;

  const DEAL_ID = ethers.keccak256(ethers.toUtf8Bytes("deal1"));
  const SECRET = ethers.toUtf8Bytes("secret123");
  const HASHLOCK = ethers.keccak256(SECRET);

  beforeEach(async function () {
    [owner, payer, payee, arbiter] = await ethers.getSigners();

    const SafeBaseV1 = await ethers.getContractFactory("SafeBase");
    const proxy = await upgrades.deployProxy(SafeBaseV1, [0, owner.address], { kind: "uups" });
    await proxy.waitForDeployment();

    const SafeBaseV3 = await ethers.getContractFactory("SafeBaseV3");
    const upgraded = await upgrades.upgradeProxy(await proxy.getAddress(), SafeBaseV3);
    safeBase = SafeBaseV3.attach(await upgraded.getAddress());

    await safeBase.initializeV3();
  });

  describe("ETH Escrow", function () {
    it("should create ETH deal successfully", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      await expect(
        safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount })
      )
        .to.emit(safeBase, "DealCreated")
        .withArgs(DEAL_ID, payer.address, payee.address, amount, deadline, HASHLOCK, 0, ethers.ZeroAddress);

      const deal = await safeBase.getDeal(DEAL_ID);
      expect(deal.payer).to.equal(payer.address);
      expect(deal.payee).to.equal(payee.address);
      expect(deal.amount).to.equal(amount);
      expect(deal.status).to.equal(1);
    });

    it("should reveal and release funds with fee deduction", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      await safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount });

      const payeeBalanceBefore = await ethers.provider.getBalance(payee.address);

      await expect(safeBase.connect(payee).reveal(DEAL_ID, SECRET))
        .to.emit(safeBase, "DealRevealed");

      const payeeBalanceAfter = await ethers.provider.getBalance(payee.address);
      const feeRate = await safeBase.feeRate();
      const expectedPayout = amount - (amount * feeRate / 10000n);

      expect(payeeBalanceAfter).to.be.gt(payeeBalanceBefore);
    });

    it("should refund after deadline", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      await safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount });

      await time.increaseTo(deadline + 1);

      const payerBalanceBefore = await ethers.provider.getBalance(payer.address);

      await expect(safeBase.connect(payer).refund(DEAL_ID))
        .to.emit(safeBase, "DealRefunded")
        .withArgs(DEAL_ID, payer.address, amount);

      const payerBalanceAfter = await ethers.provider.getBalance(payer.address);
      expect(payerBalanceAfter).to.be.gt(payerBalanceBefore);
    });

    it("should not refund before deadline", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      await safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount });

      await expect(safeBase.connect(payer).refund(DEAL_ID))
        .to.be.revertedWithCustomError(safeBase, "DeadlineNotReached");
    });

    it("should allow owner to resolve dispute", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      await safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount });

      await safeBase.connect(payer).disputeDeal(DEAL_ID);

      await expect(safeBase.connect(owner).resolveByOwner(DEAL_ID, payee.address))
        .to.emit(safeBase, "DealResolved")
        .withArgs(DEAL_ID, payee.address, amount);
    });
  });

  describe("Fee Management", function () {
    it("should update fee rate", async function () {
      const newFeeRate = 200;

      await expect(safeBase.connect(owner).setFeeRate(newFeeRate))
        .to.emit(safeBase, "FeeRateUpdated")
        .withArgs(100, newFeeRate);

      expect(await safeBase.feeRate()).to.equal(newFeeRate);
    });

    it("should not allow fee rate above maximum", async function () {
      await expect(safeBase.connect(owner).setFeeRate(600))
        .to.be.revertedWithCustomError(safeBase, "InvalidFeeRate");
    });

    it("should collect and withdraw fees", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      await safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount });
      await safeBase.connect(payee).reveal(DEAL_ID, SECRET);

      const totalFees = await safeBase.totalFeesCollected();
      expect(totalFees).to.be.gt(0);

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await safeBase.connect(owner).withdrawFees();
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });
  });

  describe("User Tracking", function () {
    it("should track user deal count", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      expect(await safeBase.userDealCount(payer.address)).to.equal(0);

      await safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount });

      expect(await safeBase.userDealCount(payer.address)).to.equal(1);

      const userDeals = await safeBase.getUserDeals(payer.address);
      expect(userDeals.length).to.equal(1);
      expect(userDeals[0]).to.equal(DEAL_ID);
    });
  });

  describe("Security", function () {
    it("should prevent duplicate deal creation", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      await safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount });

      await expect(
        safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount })
      ).to.be.revertedWithCustomError(safeBase, "DealAlreadyExists");
    });

    it("should prevent reveal with wrong secret", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      await safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount });

      const wrongSecret = ethers.toUtf8Bytes("wrongsecret");

      await expect(safeBase.connect(payee).reveal(DEAL_ID, wrongSecret))
        .to.be.revertedWithCustomError(safeBase, "InvalidHashlock");
    });

    it("should only allow payer to dispute", async function () {
      const amount = ethers.parseEther("1");
      const deadline = (await time.latest()) + 3600;

      await safeBase.connect(payer).createDealETH(DEAL_ID, payee.address, deadline, HASHLOCK, { value: amount });

      await expect(safeBase.connect(payee).disputeDeal(DEAL_ID))
        .to.be.revertedWithCustomError(safeBase, "InvalidRecipient");
    });
  });
});
