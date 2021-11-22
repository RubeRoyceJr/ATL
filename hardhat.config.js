require('@nomiclabs/hardhat-waffle')
require('@atixlabs/hardhat-time-n-mine')
require('@nomiclabs/hardhat-etherscan')
require('dotenv').config()

const { ethers } = require('ethers')
const dev = process.env.DEV_PRIVATE_KEY
const deployer = process.env.DEPLOYER_PRIVATE_KEY
const etherscanApiKey = process.env.ETHERSCAN_API_KEY
const polygonMainnetRPC = process.env.POLYGON_MAINNET_RPC
const polygonMumbaiRPC = process.env.POLYGON_MUMBAI_RPC

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
    ],
  },
  networks: {
    'polygon-mainnet': {
      url: 'https://polygon-rpc.com',
      accounts: [deployer],
      gasPrice: 35000000000,
    },
    'polygon-mumbai': {
      url: polygonMumbaiRPC,
      accounts: [dev],
      gas: 'auto',
      gasPrice: ethers.utils.parseUnits('1.2', 'gwei').toNumber(),
    },
    hardhat: {
      gas: 'auto',
      forking:
        process.env.NODE_ENV === 'test'
          ? undefined
          : {
              url: polygonMainnetRPC,
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
