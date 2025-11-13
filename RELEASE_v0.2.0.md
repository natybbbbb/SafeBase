# SafeBase v0.2.0 - Enhanced Escrow Protocol

## 🚀 Major Upgrade: SafeBaseV3

This release brings significant improvements to the SafeBase escrow protocol with multi-token support, fee management, and enhanced security features.

---

## ✨ New Features

### Multi-Token Escrow
- **ETH Support:** Native ETH escrow (existing)
- **ERC-20 Support:** Support for any ERC-20 token (USDC, WETH, etc.)
- Separate functions: `createDealETH()` and `createDealERC20()`

### Fee Management System
- Platform fee: 1% default (configurable)
- Maximum fee cap: 5%
- Owner-controlled fee rate updates
- Fee collection and withdrawal mechanism

### User Activity Tracking
- Track deal count per user
- Historical deal records per address
- Easy query of user's escrow history

### Dispute Resolution
- Payer can raise disputes
- Owner arbitration for disputed deals
- Enhanced deal status tracking (None, Funded, Released, Refunded, Disputed)

### Gas Optimization
- Custom errors instead of revert strings
- ~30% gas savings on failed transactions
- Optimized storage patterns

### Security Enhancements
- OpenZeppelin ReentrancyGuard on all state-changing functions
- Enhanced access control with custom modifiers
- SafeERC20 for token transfers

---

## 📦 Deployments

| Network | Proxy Address | Status |
|---------|---------------|--------|
| Base Mainnet | `0xf21DBb14FEa9F721ea9078580De653d68023465d` | ✅ Upgraded |
| Base Sepolia | `0x8CaD852b460b6C1aA77347cC3e0203f9Bc24A3Ab` | ✅ Upgraded |

---

## 🔧 API Changes

### New Functions

```solidity
// ERC-20 escrow creation
function createDealERC20(
    bytes32 dealId,
    address payee,
    uint256 amount,
    uint64 deadline,
    bytes32 hashlock,
    address token
) external

// User tracking
function getUserDeals(address user) external view returns (bytes32[])
function userDealCount(address user) external view returns (uint256)

// Dispute management
function disputeDeal(bytes32 dealId) external

// Fee management (owner only)
function setFeeRate(uint256 newFeeRate) external
function withdrawFees() external
```

### Modified Functions

```solidity
// Now called createDealETH (renamed from createDeal)
function createDealETH(
    bytes32 dealId,
    address payee,
    uint64 deadline,
    bytes32 hashlock
) external payable
```

---

## 🧪 Testing

- **Test Coverage:** 13 comprehensive tests
- All tests passing ✅
- Test categories:
  - ETH escrow operations
  - ERC-20 escrow operations
  - Fee management
  - User tracking
  - Security & access control

Run tests:
```bash
npm test
```

---

## 📖 Documentation

- Updated README with full API documentation
- Added COMMIT_GUIDE for contributors
- Enhanced DEPLOYS.md with version history

---

## 🔒 Security

- OpenZeppelin v5.1.0 upgradeable contracts
- ReentrancyGuard on all critical functions
- Custom errors for gas efficiency
- Comprehensive access control
- SafeERC20 for token interactions

**Audit Status:** Community review (professional audit planned for v0.4.0)

---

## ⚙️ Technical Details

- **Solidity Version:** 0.8.26
- **Upgrade Pattern:** UUPS (Universal Upgradeable Proxy Standard)
- **Dependencies:** OpenZeppelin Contracts Upgradeable v5.1.0
- **Build Tool:** Hardhat 2.22.5
- **Network:** Base (L2)

---

## 📝 Migration Guide

### For Existing Users

If you were using `createDeal()`:
```solidity
// Old (v2)
createDeal(dealId, payee, deadline, hashlock) { value: amount }

// New (v3)
createDealETH(dealId, payee, deadline, hashlock) { value: amount }
```

### For Developers

1. Update contract interface to SafeBaseV3
2. Use `createDealETH()` for ETH escrow
3. Use `createDealERC20()` for token escrow
4. Handle new `FeeCollected` event
5. Account for 1% platform fee in payouts

---

## 🗓️ Roadmap

### v0.3.0 (Day 2)
- Base Pay integration
- Base Account SDK (Account Abstraction)
- ERC-721 NFT escrow
- Gasless transactions via Paymaster

### v0.4.0 (Day 3)
- Web UI dashboard
- Base DeFi integrations
- Batch operations
- Professional security audit

---

## 🙏 Acknowledgments

Built on Base blockchain for maximum efficiency and low fees.

Powered by:
- OpenZeppelin secure smart contract libraries
- Base L2 infrastructure
- Hardhat development framework

---

## 📄 License

MIT License

---

## 🔗 Links

- **Repository:** https://github.com/natalya-bbr/SafeBase
- **Base Mainnet Proxy:** https://basescan.org/address/0xf21DBb14FEa9F721ea9078580De653d68023465d
- **Base Sepolia Proxy:** https://sepolia.basescan.org/address/0x8CaD852b460b6C1aA77347cC3e0203f9Bc24A3Ab
- **Documentation:** See README.md

---

**For questions or issues, please open a GitHub issue.**

Made with ❤️ for the Base ecosystem
