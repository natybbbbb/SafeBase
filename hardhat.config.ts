import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = (process.env.PRIVATE_KEY || "").replace(/^0x/, "");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    base: {
      url: process.env.RPC_URL_BASE || "https://mainnet.base.org",
      accounts: PRIVATE_KEY ? ["0x" + PRIVATE_KEY] : [],
      chainId: 8453
    },
    base_sepolia: {
      url: process.env.RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org",
      accounts: PRIVATE_KEY ? ["0x" + PRIVATE_KEY] : [],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  }
};

export default config;
