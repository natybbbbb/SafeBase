# SafeBase

**SafeBase** — Escrow smart-contract system with multi-conditional refund logic built on **Base**.

## Overview
SafeBase provides secure escrow functionality for conditional transactions.  
It integrates **Base Pay** and **Base Account SDK** for on-chain verifications.

## Structure
- contracts/ — smart contracts (UUPS upgradeable)
- scripts/ — deploy, upgrade, and verify scripts
- deployments/ — on-chain deployment records
- test/ — unit and integration tests
- _github/workflows/ — CI/CD automation (Base mainnet & Sepolia)

## Networks
| Network | Chain ID | Proxy | Implementation | Admin |
|------------------|-------|--------------------------------------------|--------------------------------------------|--------------------------------------------|
| **Base Mainnet** | 8453  | 0xf21DBb14FEa9F721ea9078580De653d68023465d | 0xAe91524fe801a69084d7328D279606F8f8Fe9949 | 0x0000000000000000000000000000000000000000 |
| **Base Sepolia** | 84532 | 0x8CaD85b2460B6C1aA77347c3e0203f9Bc243A3b  | 0xCd0B0E96455F7d73dc3FEfCEefD8A9F7d5A52548 | 0x0000000000000000000000000000000000000000 |

## License
MIT © SafeBase
