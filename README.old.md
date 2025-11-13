# SafeBase

SafeBase is an **upgradeable escrow protocol** deployed on **Base** network with multi-condition logic for fund release and refund.  
It uses UUPS proxies, GitHub Actions automation, and public deployments for transparent on-chain traceability.

---

## 🧩 Key Features
- Escrow with multiple exit conditions (hashlock, timeout, owner arbitration)
- UUPS upgradeable architecture via GitHub Actions
- Automatic deployments to **Base Mainnet** and **Base Sepolia**
- Base Pay and Base Account integration-ready

---

## 🌐 Networks

| Network | Chain ID | Proxy | Implementation |
|----------|----------|-------|----------------|
| Base Mainnet | 8453 | 0xf21DBb14FEa9F721ea9078580De653d68023465d | 0xAe91524fe801a69084d7328D279606F8f8Fe9949 |
| Base Sepolia | 84532 | 0x8CaD85b2460B6C1aA77347c3e0203f9Bc243A3b | 0xCd0B0E96455F7d73dc3FEfCEefD8A9F7d5A52548 |

> Verified on [BaseScan](https://basescan.org).

---

## ⚙️ Workflows

| Action | Description |
|--------|-------------|
| **Deploy** | Manual deploy to Base or Base Sepolia |
| **Upgrade Proxy** | Deploy new implementation and upgrade proxy |
| **Release** | Publish artifacts (`abi/`, `deployments/`) on tag push |

All operations are performed on-chain and logged in this repository for full transparency.

---

## 🔑 Environment Variables

See `.env.example`:

PRIVATE_KEY=
RPC_URL_BASE=
RPC_URL_BASE_SEPOLIA=
ETHERSCAN_API_KEY=
BASE_PAY_API_KEY=
BASE_PAY_API_ENDPOINT=
MAX_FEE_PER_GAS_GWEI=
MAX_PRIORITY_FEE_PER_GAS_GWEI=

Secrets must be added in **Settings → Secrets → Actions** before using workflows.

---

## 🧠 Tech Stack
- Solidity (UUPS pattern)
- OpenZeppelin Upgradeable Contracts
- Base RPC & BaseScan API
- GitHub Actions CI/CD

---

## 🗺️ Roadmap
- **v0.2.0:** Escrow V2 upgrade (hashlock + timeout logic) on Base Sepolia  
- **v0.3.0:** Mainnet upgrade and release  
- **v0.4.0:** Base Pay + Base Account SDK integration  
- **v0.5.0:** UI dashboard for on-chain operations  

---

## 📄 License
MIT
