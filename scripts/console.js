
let addresses = {
  "sCLAM_ADDRESS": "0xAAc144Dc08cE39Ed92182dd85ded60E5000C9e67",
  "CLAM_ADDRESS": "0xC250e9987A032ACAC293d838726C511E6E1C029d",
  "OLD_CLAM_ADDRESS": "0x4d6A30EFBE2e9D7A9C143Fce1C5Bb30d9312A465",
  "OLD_SCLAM_ADDRESS": "0x3949F058238563803b5971711Ad19551930C8209",
  "MAI_ADDRESS": "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1",
  "TREASURY_ADDRESS": "0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C",
  "CLAM_BONDING_CALC_ADDRESS": "0x651125e097D7e691f3Df5F9e5224f0181E3A4a0E",
  "STAKING_ADDRESS": "0xC8B0243F350AA5F8B979b228fAe522DAFC61221a",
  "OLD_STAKING_ADDRESS": "0xcF2A11937A906e09EbCb8B638309Ae8612850dBf",
  "STAKING_HELPER_ADDRESS": "0x76B38319483b570B4BCFeD2D35d191d3c9E01691",
  "MIGRATOR": "0x4dF64BBe830168Ed257D0a1FA52900E038a37c4c",
  "RESERVES": {
    "MAI": "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1",
    "OLD_MAI_CLAM": "0x8094f4C9a4C8AD1FF4c6688d07Bd90f996C7CA21",
    "MAI_CLAM": "0x1581802317f32A2665005109444233ca6E3e2D68"
  },
  "BONDS": {
    "OLD_MAI": "0x28077992bFA9609Ae27458A766470b03D43dEe8A",
    "MAI": "0x603A74Fd527b85E0A1e205517c1f24aC71f5C263",
    "OLD_MAI_CLAM": "0x64c766f9A4936c3a4b51C55Ea5C4854E19766035",
    "MAI_CLAM": "0x706587BD39322A6a78ddD5491cDbb783F8FD983E"
  },
  "CLAM_CIRCULATING_SUPPLY": "0x99ee91871cf39A44E3Fc842541274d7eA05AE4b3"
}

const { BigNumber } = ethers
const [deployer] = await ethers.getSigners()
const IUniswapV2Pair = require('./scripts/IUniswapV2Pair.json').abi

const lp = new ethers.Contract(
  addresses.RESERVES.DAI_CLAM,
  IUniswapV2Pair,
  deployer
)
const CLAM = await ethers.getContractFactory('OtterClamERC20')
const clam = await CLAM.attach(addresses.CLAM_ADDRESS)

const DAI = await ethers.getContractFactory('DAI')
const dai = DAI.attach(addresses.DAI_ADDRESS)

const Treasury = await ethers.getContractFactory('OtterTreasury')
const treasury = Treasury.attach(addresses.TREASURY_ADDRESS)

const Staking = await ethers.getContractFactory('OtterStaking')
const staking = Staking.attach(addresses.STAKING_ADDRESS)

const StakingDistributor = await ethers.getContractFactory(
  'OtterStakingDistributor'
)
const stakingDistributor = StakingDistributor.attach(
  await staking.distributor()
)

const DAIBond = await ethers.getContractFactory('OtterBondDepository')
const daiBond = DAIBond.attach(addresses.BONDS.DAI)

const LPBond = await ethers.getContractFactory('OtterBondDepository')
const lpBond = LPBond.attach(addresses.BONDS.DAI_CLAM)

const Migrator = await ethers.getContractFactory('ClamTokenMigrator')
const migrator = Migrator.attach(addresses.MIGRATOR)

module.exports = {
  lp,
  clam,
  dai,
  treasury,
  staking,
  daiBond,
  lpBond,
}
