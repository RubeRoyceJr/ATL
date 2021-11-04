// @dev. This script will deploy IDO and whitelist it

const { ethers } = require('hardhat')
const { BigNumber } = ethers

const fs = require('fs')
const path = require('path')

const zeroAddress = '0x0000000000000000000000000000000000000000'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account: ' + deployer.address)

  const IDO = await ethers.getContractFactory('OtterClamIDO')
  // const ido = await IDO.deploy(
  //   '0x4d6A30EFBE2e9D7A9C143Fce1C5Bb30d9312A465', // CLAM
  //   '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1', // MAI
  //   '0xab328Ca61599974b0f577d1F8AB0129f2842d765', // Treasury
  //   '0xcF2A11937A906e09EbCb8B638309Ae8612850dBf', // Staking
  //   '0x8094f4C9a4C8AD1FF4c6688d07Bd90f996C7CA21' // CLAM-MAI LP
  // )
  // console.log('Deploy tx: ' + ido.deployTransaction.hash)
  // console.log('Deploy nonce: ' + ido.deployTransaction.nonce)
  // await ido.deployTransaction.wait()
  // console.log('IDO deployed at: ' + ido.address)

  const ido = IDO.attach('0x7f637Ea843405Dff10592f894292A8f1188166F9')
  // await ido.initialize(
  //   BigNumber.from(200000).mul(BigNumber.from(10).pow(9)),
  //   BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
  //   48 * 60 * 60, // 48 hours
  //   1635724800 // 2021-11-1 0:00 UTC
  // )

  const Treasury = await ethers.getContractFactory('OtterTreasury')
  const treasury = Treasury.attach('0xab328Ca61599974b0f577d1F8AB0129f2842d765')

  // let whitelist = fs
  //   .readFileSync(path.resolve(__dirname, './whitelist.txt'))
  //   .toString()
  //   .split('\n')
  //   .filter(Boolean)
  // console.log('before listing: ' + whitelist.length)
  // const listMap = {}
  // for (let w of whitelist) {
  //   if (listMap[w.toLowerCase()]) {
  //     console.log('duplicate address: ' + w)
  //   }
  //   listMap[w.toLowerCase()] = true
  // }
  // console.log('white listing: ' + whitelist.length)
  // await (await ido.whiteListBuyers(whitelist, { nonce: 68 })).wait()

  // await treasury.toggle('0', ido.address, zeroAddress)
  await treasury.toggle('4', ido.address, zeroAddress)
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
