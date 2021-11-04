// @dev. This script will deploy IDO NFT

const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account: ' + deployer.address)

  const NFT = await ethers.getContractFactory('OtterClamIDOExclusive')
  const nft = await NFT.deploy({nonce:12})
  console.log('Deploy tx: ' + nft.deployTransaction.hash)
  console.log('Deploy nonce: ' + nft.deployTransaction.nonce)
  await nft.deployTransaction.wait()
  console.log('NFT deployed at: ' + nft.address)
}

main()
