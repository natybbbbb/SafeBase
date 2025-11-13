# SafeBase Protocol

**SafeBase** is an advanced **upgradeable escrow protocol** deployed on **Base** blockchain with multi-condition logic, fee management, and ERC-20 token support.

Built with UUPS proxies, automated GitHub Actions, and designed for maximum on-chain activity tracking.

---

## 🚀 Features

### Core Escrow Functions
- ✅ **Multi-condition escrow** (hashlock, deadline, owner arbitration)
- ✅ **ETH & ERC-20 token support** (USDC, WETH, any ERC-20)
- ✅ **Fee management system** (configurable up to 5%)
- ✅ **Dispute resolution** by contract owner
- ✅ **User activity tracking** (deal count, deal history)
- ✅ **Reentrancy protection** with OpenZeppelin guards

### Technical Architecture
- ✅ **UUPS upgradeable** pattern
- ✅ **Gas-optimized** custom errors
- ✅ **Event-driven** architecture for indexing
- ✅ **Comprehensive test coverage**
- ✅ **GitHub Actions CI/CD**

### Base Ecosystem Integration
- ✅ **Base Mainnet** deployment
- ✅ **Base Sepolia** testnet deployment
- 🔄 **Base Pay** integration (coming v0.4.0)
- 🔄 **Base Account SDK** (coming v0.4.0)
- 🔄 **Base DeFi protocols** (Uniswap, Aero)

---

## 🌐 Deployments

| Network | Chain ID | Proxy | Implementation | Version |
|---------|----------|-------|----------------|---------|
| **Base Mainnet** | 8453 | `0xf21DBb14FEa9F721ea9078580De653d68023465d` | `0xAe91524fe801a69084d7328D279606F8f8Fe9949` | v3 |
| **Base Sepolia** | 84532 | `0x8CaD85b2460B6C1aA77347c3e0203f9Bc243A3b` | `0xCd0B0E96455F7d73dc3FEfCEefD8A9F7d5A52548` | v3 |

> ✅ Verified on [BaseScan](https://basescan.org) & [Sepolia BaseScan](https://sepolia.basescan.org)

---

## 📖 How It Works

### 1. Create Escrow Deal (ETH)

```solidity
bytes32 dealId = keccak256("unique-deal-id");
bytes32 hashlock = keccak256("my-secret");
uint64 deadline = block.timestamp + 7 days;

createDealETH{value: 1 ether}(
    dealId,
    payeeAddress,
    deadline,
    hashlock
);
```

### 2. Create Escrow Deal (ERC-20)

```solidity
IERC20(usdcAddress).approve(proxyAddress, amount);

createDealERC20(
    dealId,
    payeeAddress,
    amount,
    deadline,
    hashlock,
    usdcAddress
);
```

### 3. Release Funds (Reveal Secret)

```solidity
reveal(dealId, "my-secret");
```

### 4. Refund After Deadline

```solidity
refund(dealId);
```

### 5. Dispute & Owner Resolution

```solidity
disputeDeal(dealId);

resolveByOwner(dealId, beneficiaryAddress);
```

---

## 🛠️ Development

### Prerequisites

- Node.js 20+
- npm or yarn
- Base RPC access
- BaseScan API key

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Deploy to Base Sepolia

```bash
npm run deploy:base-sepolia
```

### Upgrade to V3

```bash
npm run upgrade-v3:base
npm run upgrade-v3:base-sepolia
```

---

## ⚙️ Environment Variables

Create `.env` file:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
RPC_URL_BASE=https://mainnet.base.org
RPC_URL_BASE_SEPOLIA=https://sepolia.base.org
ETHERSCAN_API_KEY=YOUR_BASESCAN_API_KEY
```

For GitHub Actions, add secrets in **Settings → Secrets → Actions**

---

## 🤖 GitHub Actions Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **CI** | Push/PR | Build & test contracts |
| **Deploy** | Manual | Deploy new proxy |
| **Upgrade** | Manual | Upgrade existing proxy |
| **Release** | Tag push | Publish artifacts |

---

## 📊 Contract Architecture

### SafeBaseV3 Components

#### Storage
- `mapping(bytes32 => Deal) _deals` - All escrow deals
- `mapping(address => uint256) userDealCount` - User activity
- `mapping(address => bytes32[]) userDeals` - User deal history
- `uint256 feeRate` - Platform fee (1% default, max 5%)

#### Structs
```solidity
struct Deal {
    address payer;
    address payee;
    uint256 amount;
    uint64 deadline;
    bytes32 hashlock;
    Status status;
    TokenType tokenType;
    address token;
    uint256 createdAt;
}
```

#### Events
- `DealCreated` - New escrow created
- `DealRevealed` - Funds released via secret
- `DealRefunded` - Funds returned to payer
- `DealResolved` - Owner arbitration
- `DealDisputed` - Dispute raised
- `FeeCollected` - Platform fee collected
- `FeeRateUpdated` - Fee rate changed

#### Custom Errors (Gas Optimized)
- `DealAlreadyExists()`
- `InvalidPayee()`
- `InvalidAmount()`
- `InvalidDeadline()`
- `InvalidHashlock()`
- `DeadlineNotReached()`
- `TransferFailed()`

---

## 🧪 Test Coverage

- ✅ ETH escrow creation
- ✅ ERC-20 escrow creation
- ✅ Secret reveal & fund release
- ✅ Deadline refunds
- ✅ Owner arbitration
- ✅ Fee collection & withdrawal
- ✅ User tracking
- ✅ Security (reentrancy, access control)
- ✅ Error handling

---

## 🗺️ Roadmap

### v0.2.0 ✅ (Current)
- Multi-token escrow (ETH + ERC-20)
- Fee management system
- Enhanced security & gas optimization
- User activity tracking

### v0.3.0 (Day 2)
- Base Pay integration
- Base Account SDK (Account Abstraction)
- ERC-721 NFT escrow support
- Gasless transactions via Paymaster

### v0.4.0 (Day 3)
- Web UI dashboard
- Base DeFi integrations (Uniswap, Aero)
- Batch operations
- Advanced analytics

### v0.5.0 (Future)
- Cross-chain escrow (Base ↔ Ethereum)
- Oracle price feeds
- Automated market maker integration
- Mobile SDK

---

## 🔒 Security

- ✅ OpenZeppelin battle-tested contracts
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Custom errors for gas savings
- ✅ Access control modifiers
- ✅ Comprehensive test suite
- ✅ UUPS upgrade pattern with owner-only authorization

### Audit Status
- 🔄 Community review (ongoing)
- 🔄 Professional audit (planned for v0.4.0)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📞 Support

- GitHub Issues: [Issues](https://github.com/yourusername/safebase/issues)
- Documentation: [Wiki](https://github.com/yourusername/safebase/wiki)

---

## 🏆 Built on Base

SafeBase is built exclusively for the **Base** ecosystem, leveraging:
- Base L2 for low gas fees
- Base native protocols
- Coinbase infrastructure
- Base Pay for payments
- Base Account for account abstraction

**Optimized for Base Airdrop Eligibility** 🎯

---

**Made with ❤️ for the Base ecosystem**
