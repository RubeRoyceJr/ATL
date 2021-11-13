const { ethers } = require('hardhat')

function toClamAmount(value) {
  return ethers.utils.parseUnits(String(value), 9)
}

module.exports = {
  toClamAmount
}
