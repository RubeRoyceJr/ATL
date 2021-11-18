const { ethers } = require('hardhat')

const address = {
  sCLAM_ADDRESS: '0xAAc144Dc08cE39Ed92182dd85ded60E5000C9e67',
  CLAM_ADDRESS: '0xC250e9987A032ACAC293d838726C511E6E1C029d',
  OLD_CLAM_ADDRESS: '0x4d6A30EFBE2e9D7A9C143Fce1C5Bb30d9312A465',
  OLD_SCLAM_ADDRESS: '0x3949F058238563803b5971711Ad19551930C8209',
  MAI_ADDRESS: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
  TREASURY_ADDRESS: '0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C',
  CLAM_BONDING_CALC_ADDRESS: '0x651125e097D7e691f3Df5F9e5224f0181E3A4a0E',
  STAKING_ADDRESS: '0xC8B0243F350AA5F8B979b228fAe522DAFC61221a',
  OLD_STAKING_ADDRESS: '0xcF2A11937A906e09EbCb8B638309Ae8612850dBf',
  STAKING_HELPER_ADDRESS: '0x76B38319483b570B4BCFeD2D35d191d3c9E01691',
  MIGRATOR: '0xDaa1f5036eC158fca9E5ce791ab3e213cD1c41df',
  RESERVES: {
    MAI: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
    OLD_MAI_CLAM: '0x8094f4C9a4C8AD1FF4c6688d07Bd90f996C7CA21',
    MAI_CLAM: '0x1581802317f32A2665005109444233ca6E3e2D68',
  },
  BONDS: {
    OLD_MAI: '0x28077992bFA9609Ae27458A766470b03D43dEe8A',
    MAI: '0x603A74Fd527b85E0A1e205517c1f24aC71f5C263',
    OLD_MAI_CLAM: '0x64c766f9A4936c3a4b51C55Ea5C4854E19766035',
    MAI_CLAM: '0x706587BD39322A6a78ddD5491cDbb783F8FD983E',
  },
  CLAM_CIRCULATING_SUPPLY: '0x99ee91871cf39A44E3Fc842541274d7eA05AE4b3',
}

const stakingDistributor = '0x0Dd015889df6F50d39e9D7A52711D0B86E43FC62'
const stakingWarmup = '0x8b2943667957ec2ce851fd449b7a870f253ca1e7'
const daoAddr = '0x929A27c46041196e1a49C7B459d63eC9A20cd879'
const firstEpochNumber = '49'
const firstEpochEndTime = 1637280000 // 2021-11-19 00:00 UTC
const epochLengthInSeconds = 86400 / 3
  const zeroAddress = '0x0000000000000000000000000000000000000000'

async function main() {
  const deployer = await ethers.getSigner()
  await verify(address.CLAM_BONDING_CALC_ADDRESS,[address.CLAM_ADDRESS])
  // await verify(newClam.address, [])
  // await verify(address.sCLAM_ADDRESS, [])
  // await verify(address.CLAM_CIRCULATING_SUPPLY, [deployer.address])
  // await verify(address.TREASURY_ADDRESS, [
  //   address.CLAM_ADDRESS,
  //   address.MAI_ADDRESS,
  //   address.RESERVES.MAI_CLAM,
  //   address.CLAM_BONDING_CALC_ADDRESS,
  //   '43200',
  // ])
  // await verify(stakingDistributor, [
  //   address.TREASURY_ADDRESS,
  //   address.CLAM_ADDRESS,
  //   epochLengthInSeconds,
  //   firstEpochEndTime,
  // ])
  // await verify(address.STAKING_ADDRESS, [
  //   address.CLAM_ADDRESS,
  //   address.sCLAM_ADDRESS,
  //   epochLengthInSeconds,
  //   firstEpochNumber,
  //   firstEpochEndTime,
  // ])
  await verify(stakingWarmup, [address.STAKING_ADDRESS, address.sCLAM_ADDRESS])
  // await verify(address.STAKING_HELPER_ADDRESS, [
  //   address.STAKING_ADDRESS,
  //   address.CLAM_ADDRESS,
  // ])
  // await verify(address.BONDS.MAI, [
  //   address.CLAM_ADDRESS,
  //   address.MAI_ADDRESS,
  //   address.TREASURY_ADDRESS,
  //   daoAddr,
  //   zeroAddress,
  // ])
  // await verify(address.BONDS.MAI_CLAM, [
  //   address.CLAM_ADDRESS,
  //   address.RESERVES.MAI_CLAM,
  //   address.TREASURY_ADDRESS,
  //   daoAddr,
  //   address.CLAM_BONDING_CALC_ADDRESS,
  // ])
  // await verify(address.MIGRATOR, [
  //   '0x4d6A30EFBE2e9D7A9C143Fce1C5Bb30d9312A465',
  //   '0xab328Ca61599974b0f577d1F8AB0129f2842d765',
  //   '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  //   '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
  //   address.CLAM_ADDRESS,
  //   address.TREASURY_ADDRESS,
  //   address.MAI_ADDRESS,
  // ])
}

async function verify(address, constructorArguments) {
  try {
    await hre.run('verify:verify', {
      address,
      constructorArguments,
    })
  } catch (err) {
    console.warn(`verify failed: ${address} ${err.message}`)
  }
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
