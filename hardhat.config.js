require('@nomicfoundation/hardhat-toolbox');
require('@nomicfoundation/hardhat-web3-v4');
require("@nomiclabs/hardhat-solhint");
const dotenv = require('dotenv');

dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  allowUnlimitedContractSize: true,
  networks: {
    bnb_testnet: {
      url: process.env.RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY
  }
}
