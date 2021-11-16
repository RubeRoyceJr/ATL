const addresses = {
  sCLAM_ADDRESS: '0xFf329aea2a9413C3c2e755182a8f952E339ED0Ba',
  CLAM_ADDRESS: '0x313474edfAd3aB88E2b745F43934180841169AEe',
  OLD_CLAM_ADDRESS: '0x858D2A7c8700ecB2513615C71f454C6979D02576',
  OLD_SCLAM_ADDRESS: '0x5076BCe2F331963DecfC105995332DD9a8117C12',
  MAI_ADDRESS: '0x19907af68A173080c3e05bb53932B0ED541f6d20',
  TREASURY_ADDRESS: '0x8f1e380599B9F2FCEB1acb79e3e55cECa153E180',
  CLAM_BONDING_CALC_ADDRESS: '0xcc70f43050f0716092042F128f9A478D23a1b4b7',
  STAKING_ADDRESS: '0x18112d179FbA0d3BAe70af067068C44b8f763E16',
  OLD_STAKING_ADDRESS: '0xDe1DC58Db40c628E9C64E3fbEf80aE9D4C2FDfC4',
  STAKING_HELPER_ADDRESS: '0xEdaf3a9aE936EbD0495c425E2149264F0F687C11',
  MIGRATOR: '0x3f5c4f6fd8364c159fcA07359beB8A83f79626AE',
  RESERVES: {
    MAI: '0x19907af68A173080c3e05bb53932B0ED541f6d20',
    OLD_MAI_CLAM: '0x9FAf2ad7F8927981E4c8f6087ebc7e339e5a2219',
    MAI_CLAM: '0x2CcA574e622306C0e514E62F63e0123e7AD9792F',
  },
  BONDS: {
    OLD_MAI: '0x62E83bfB165A8af1A5afa72e6B2F341B28F07e54',
    MAI: '0x1352774C48929Cf186A868676B69d458906D6419',
    OLD_MAI_CLAM: '0x0a011089fad0FAd19B95cCAaD46d26c6fd3d5c93',
    MAI_CLAM: '0xD89Fa317868DAc6563BC19338A0A270201cA762E',
  },
  CLAM_CIRCULATING_SUPPLY: '0xE0277bfd88F30A834E54A2EA2B7aE99f05b7Ade9',
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
