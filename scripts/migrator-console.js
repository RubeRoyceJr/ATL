let addresses = {
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
    OLD_MAI_CLAM: '0x64c766f9A4936c3a4b51C55Ea5C4854E19766035',
    MAI: '0x603A74Fd527b85E0A1e205517c1f24aC71f5C263',
    MAI_CLAM: '0x706587BD39322A6a78ddD5491cDbb783F8FD983E',
  },
  CLAM_CIRCULATING_SUPPLY: '0x99ee91871cf39A44E3Fc842541274d7eA05AE4b3',
}

const zeroAddress = '0x0000000000000000000000000000000000000000'

await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: ['0x929A27c46041196e1a49C7B459d63eC9A20cd879'] })
await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: ['0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B'] })
let deployer = await ethers.getSigner('0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B')
let multisig = await ethers.getSigner( '0x929A27c46041196e1a49C7B459d63eC9A20cd879')

const Treasury = await ethers.getContractFactory('OtterTreasury')

let oldTreasury = Treasury.attach('0xab328Ca61599974b0f577d1F8AB0129f2842d765').connect(multisig)
let newTreasury = Treasury.attach('0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C').connect(deployer)

const Migrator = await ethers.getContractFactory('ClamTokenMigrator')
let migrator = Migrator.attach( '0xDaa1f5036eC158fca9E5ce791ab3e213cD1c41df').connect(deployer)

const ERC20 = await ethers.getContractFactory('OtterClamERC20V2')
let clam = ERC20.attach(addresses.OLD_CLAM_ADDRESS)
let clam2 = ERC20.attach(addresses.CLAM_ADDRESS)
let mai = ERC20.attach(addresses.MAI_ADDRESS)

const StakedOtterClamERC20V2 = await ethers.getContractFactory('StakedOtterClamERC20V2')
let sClam = StakedOtterClamERC20V2.attach(addresses.OLD_SCLAM_ADDRESS).connect(deployer)
let sClam2 = StakedOtterClamERC20V2.attach(addresses.sCLAM_ADDRESS).connect(deployer)

const Staking = await ethers.getContractFactory('OtterStaking')
let staking = Staking.attach(addresses.STAKING_ADDRESS).connect(deployer)
let oldStaking = Staking.attach(addresses.OLD_STAKING_ADDRESS).connect(multisig)

// await oldTreasury.queue('1', migrator.address)
// await oldTreasury.queue('3', migrator.address)
// await oldTreasury.queue('6', migrator.address)
// await newTreasury.queue('0', migrator.address)
// await newTreasury.queue('4', migrator.address)
// await newTreasury.queue('8', migrator.address)

// await hre.network.provider.request({ method: 'evm_setNextBlockTimestamp', params:[''] })
await hre.network.provider.request({ method: 'evm_increaseTime', params:[86400/3] })

// for (var i = 0; i < 5000; i++) { await hre.network.provider.request({ method: 'evm_mine' }); console.log(i); }
await hre.network.provider.request({ method: 'evm_mine' });

// await oldStaking.setContract('0', zeroAddress)
await oldStaking.rebase()

// await oldTreasury.toggle('1', migrator.address, zeroAddress)
// await oldTreasury.toggle('3', migrator.address, zeroAddress)
// await oldTreasury.toggle('6', migrator.address, zeroAddress)
// await newTreasury.toggle('0', migrator.address, zeroAddress)
// await newTreasury.toggle('4', migrator.address, zeroAddress)
// await newTreasury.toggle('8', migrator.address, zeroAddress)

// await newTreasury.toggle('8', '0x0Dd015889df6F50d39e9D7A52711D0B86E43FC62', zeroAddress)

// await migrator.migrateContracts({ gasLimit: '30000000' })
// await sClam2.setIndex(sClam.index())

await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: ['0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B'] })
let deployer = await ethers.getSigner('0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B')
const Bond = await ethers.getContractFactory('OtterBondDepository')
let maiBond = Bond.attach('0x603A74Fd527b85E0A1e205517c1f24aC71f5C263').connect(deployer)
let lpBond = Bond.attach('0x706587BD39322A6a78ddD5491cDbb783F8FD983E').connect(deployer)

const maiMinPrice = '5000'
const lpMinPrice = '600'

await maiBond.initializeBondTerms( '120', 5 * 24 * 3600, maiMinPrice, '50', '10000', '8000000000000000','0')
await lpBond.initializeBondTerms( '100', 5 * 24 * 3600, lpMinPrice, '50', '10000', '8000000000000000', '0')

await newTreasury.toggle('0', addresses.BONDS.MAI, zeroAddress)
await newTreasury.toggle('4', addresses.BONDS.MAI_CLAM, zeroAddress)


