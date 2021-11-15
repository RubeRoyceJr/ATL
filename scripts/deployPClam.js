// @dev. This script will deploy pCLAM contracts

const { BigNumber } = require('@ethersproject/bignumber')
const { ethers } = require('hardhat')

const POLYGON_MAINNET = {
  sCLAM_ADDRESS: '0x3949F058238563803b5971711Ad19551930C8209',
  CLAM_ADDRESS: '0x4d6A30EFBE2e9D7A9C143Fce1C5Bb30d9312A465',
  MAI_ADDRESS: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
  TREASURY_ADDRESS: '0xab328Ca61599974b0f577d1F8AB0129f2842d765',
  CLAM_BONDING_CALC_ADDRESS: '0x47655e27667E5B4EC9EB70799f281524d031381c',
  STAKING_ADDRESS: '0xcF2A11937A906e09EbCb8B638309Ae8612850dBf',
  STAKING_HELPER_ADDRESS: '0xe7bcBE1fB4F0EAe667feB64b007176Ac790675f2',
  RESERVES: {
    MAI: '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1',
    MAI_CLAM: '0x8094f4C9a4C8AD1FF4c6688d07Bd90f996C7CA21',
  },
  BONDS: {
    MAI: '0x28077992bFA9609Ae27458A766470b03D43dEe8A',
    MAI_CLAM: '0x79B47c03B02019Af78Ee0de9B0b3Ac0786338a0d',
  },
  IDO: '0xa5e71701699152de933bc57e89EeCD3e446458Ee',
}

const POLYGON_MUMBAI = {
  sCLAM_ADDRESS: '0xb8eaA6Bd059489504929A40760C0e24a27396B19',
  CLAM_ADDRESS: '0xB03D1C816dA5b5eac742B0e4E8C25063726252Cc',
  MAI_ADDRESS: '0x19907af68A173080c3e05bb53932B0ED541f6d20',
  TREASURY_ADDRESS: '0x5C68dC5623765Bbf21dCFf86c90644917e429eCD',
  CLAM_BONDING_CALC_ADDRESS: '0x2827bDC83582065940DBa57C469a6Ac2d49Be21C',
  STAKING_ADDRESS: '0xC40818207157a33124120284BF9628C14B151900',
  STAKING_HELPER_ADDRESS: '0x5E9247e51632Adc9b292cae46EA760a4Ff6BB0d6',
  RESERVES: {
    MAI: '0x19907af68A173080c3e05bb53932B0ED541f6d20',
    MAI_CLAM: '0xCf580A3E5A1041E8d46a9D0F88ca17d6360aaC9a',
  },
  BONDS: {
    MAI: '0xD10065210320B7f1ec4b287755196bD5Fa8b6916',
    MAI_CLAM: '0xf61e6c40c18B66851767Be7774a42123E8149F1D',
  },
  IDO: '0x034E51B2bC52A178c83c703Ad3Db97C71d9B3335',
}

async function main() {
  const [deployer] = await ethers.getSigners()

  const addresses =
    deployer.provider.chainId === 80001 ? POLYGON_MUMBAI : POLYGON_MAINNET

  const daoAddr = '0x929A27c46041196e1a49C7B459d63eC9A20cd879'
  console.log('Deploying contracts with the account: ' + deployer.address)

  const ClamCirculatingSupply = await ethers.getContractFactory( 'ClamCirculatingSupply')
  // const clamCirculatingSupply = await ClamCirculatingSupply.deploy(
  //   deployer.address
  // )
  const clamCirculatingSupply = ClamCirculatingSupply.attach(
    '0x44E02675b5ED5b5dF43C04c38F550605949B68c4'
  )
  // await clamCirculatingSupply.deployTransaction.wait()
  // await clamCirculatingSupply.initialize(addresses.CLAM_ADDRESS)
  console.log(
    'clamCirculatingSupply deployed at: ' + clamCirculatingSupply.address
  )
  // await (
  //   await clamCirculatingSupply.setNonCirculatingCLAMAddresses([daoAddr])
  // ).wait()

  const PreOtterClamERC20 = await ethers.getContractFactory('PreOtterClamERC20')
  // const pClam = await PreOtterClamERC20.deploy()
  const pClam = PreOtterClamERC20.attach(
    '0xBee8DDFC4698478dD774c724275785b4B5156092'
  )
  // await pClam.deployTransaction.wait()
  console.log('pCLAM deployed at: ' + pClam.address)
  // await (
  //   await pClam.transfer(
  //     daoAddr,
  //     BigNumber.from(700000000).mul(BigNumber.from(10).pow(18))
  //   )
  // ).wait()

  const ExercisePreClam = await ethers.getContractFactory('ExercisePreClam')
  const exercisePreClam = await ExercisePreClam.deploy(
    pClam.address,
    addresses.CLAM_ADDRESS,
    addresses.MAI_ADDRESS,
    addresses.TREASURY_ADDRESS,
    clamCirculatingSupply.address
  )
  await exercisePreClam.deployTransaction.wait()
  console.log('exercisePreClam deployed at: ' + exercisePreClam.address)

  const Treasury = await ethers.getContractFactory('OtterTreasury')
  const treasury = Treasury.attach(addresses.TREASURY_ADDRESS)
  await (await treasury.queue('0', exercisePreClam.address)).wait()
  // TODO: toggle after 43200 blocks
  // await (await treasury.toggle('0', exercisePreClam.address)).wait()
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
