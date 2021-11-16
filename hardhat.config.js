require('@nomiclabs/hardhat-waffle')
require('@atixlabs/hardhat-time-n-mine')
require('@nomiclabs/hardhat-etherscan')

const { ethers } = require('ethers')
const fs = require('fs')
const dev = fs.readFileSync('.secret').toString().trim()
const deployer = fs.readFileSync('.secret.mainnet').toString().trim()
const etherscanApiKey = fs.readFileSync('.secret.etherscan').toString().trim()

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.4',
      },
      {
        version: '0.7.5',
      },
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.5.16',
      },
    ],
  },
  networks: {
    'polygon-mainnet': {
      url: 'https://polygon-rpc.com',
      accounts: [deployer],
      gasPrice: 35000000000,
      // gas: 20000000,
    },
    'polygon-mumbai': {
      url: 'https://polygon-mumbai.infura.io/v3/d7dae60b5e1d40b9b31767b0086aa75d',
      accounts: [dev],
      gas: 'auto',
      gasPrice: ethers.utils.parseUnits('1.2', 'gwei').toNumber(),
    },
    hardhat: {
      gas: 'auto',
      chainId: 137,
      forking: {
        url: 'https://polygon-rpc.com',
      },
    },
  },
  etherscan: {
    apiKey: etherscanApiKey,
  },
  mocha: {
    timeout: 5 * 60 * 10000,
  },
}
