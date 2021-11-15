const addresses = {
  sCLAM_ADDRESS: '0x2DAB9DB4735cC3dB73126F697639FD916BB0A612',
  CLAM_ADDRESS: '0x5324Ed5dCA1627DED99be0C0113B8dab183ec36C',
  OLD_CLAM_ADDRESS: '0x858D2A7c8700ecB2513615C71f454C6979D02576',
  OLD_SCLAM_ADDRESS: '0x5076BCe2F331963DecfC105995332DD9a8117C12',
  MAI_ADDRESS: '0x19907af68A173080c3e05bb53932B0ED541f6d20',
  TREASURY_ADDRESS: '0x63Cf2D1486ae705bF3C825ebdaDEa46cbce38757',
  CLAM_BONDING_CALC_ADDRESS: '0xcc70f43050f0716092042F128f9A478D23a1b4b7',
  STAKING_ADDRESS: '0x39979c23a69f5f8818da554b29D1821b10349AD6',
  OLD_STAKING_ADDRESS: '0xDe1DC58Db40c628E9C64E3fbEf80aE9D4C2FDfC4',
  STAKING_HELPER_ADDRESS: '0xD163Be5dAED31d3F9416368E8FD18b721620964A',
  MIGRATOR: '0x5f14563801EcaA53644a55556E97c2f520fb68Ff',
  RESERVES: {
    MAI: '0x19907af68A173080c3e05bb53932B0ED541f6d20',
    OLD_MAI_CLAM: '0x9FAf2ad7F8927981E4c8f6087ebc7e339e5a2219',
    MAI_CLAM: '0xe9b295f9Ce817Ee37A590A4109ae6d6c5d6d2143',
  },
  BONDS: {
    OLD_MAI: '0x62E83bfB165A8af1A5afa72e6B2F341B28F07e54',
    MAI: '0x79401a642b3b7ecd41560E429B517A0e48Ee23bB',
    OLD_MAI_CLAM: '0x0a011089fad0FAd19B95cCAaD46d26c6fd3d5c93',
    MAI_CLAM: '0xC695C48288a12fD26b6f534acA371FF224F6d5Cb',
  },
  CLAM_CIRCULATING_SUPPLY: '0x48730F61b105084201C64524E0a8E57d9801d3Af',
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
const migratory = Migrator.attach(addresses.MIGRATOR)

module.exports = {
  lp,
  clam,
  dai,
  treasury,
  staking,
  daiBond,
  lpBond,
}
