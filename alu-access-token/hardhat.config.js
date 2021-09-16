/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('dotenv').config()
require('@nomiclabs/hardhat-ethers');

module.exports = {
  solidity: {
    version: '0.8.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  },
  defaultNetwork: 'localhost',
  networks: {
    rinkeby: {
      url: 'https://rinkeby-light.eth.linkpool.io/',
      accounts: { mnemonic: process.env.MNEMONIC },
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
