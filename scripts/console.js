const addresses = {
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
  BONDS: { MAI: '0x28077992bFA9609Ae27458A766470b03D43dEe8A', MAI_CLAM: '0x79B47c03B02019Af78Ee0de9B0b3Ac0786338a0d' },
  IDO: '0x7f637ea843405dff10592f894292a8f1188166f9',
};

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
