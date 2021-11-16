// @dev. This script will deploy this V1.1 of Otter. It will deploy the whole ecosystem.

const { ethers } = require('hardhat')
const { BigNumber, ContractFactory } = ethers
const UniswapV2ABI = require('./IUniswapV2Factory.json').abi
const IUniswapV2Pair = require('./IUniswapV2Pair.json').abi
const UniswapV2RouterJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')
const { getQuickSwapAddresses } = require('./addresses')

async function main() {
  const [deployer] = await ethers.getSigners()
  const daoAddr = '0x176311b81309240a8700BCC6129D5dF85087358D'
  console.log('Deploying contracts with the account: ' + deployer.address)

  // Initial staking index
  const initialIndex = '1000000000'

  const { provider } = deployer
  // TODO: set this to launch date
  const firstEpochTime = (await provider.getBlock()).timestamp + 30 * 60
  console.log('First epoch timestamp: ' + firstEpochTime)

  // What epoch will be first epoch
  const firstEpochNumber = '1'

  // How many seconds are in each epoch
  // const epochLengthInSeconds = 86400 / 3
  const epochLengthInSeconds = 60 * 10

  // Initial reward rate for epoch
  const initialRewardRate = '5000'

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // Initial mint for DAI (10,000,000)
  const initialMint = '10000000000000000000000000'

  // DAI bond BCV
  const daiBondBCV = '300'

  // Bond vesting length in seconds.
  const bondVestingLength = 5 * 24 * 3600

  // Min bond price
  const minBondPrice = '1000'

  // Max bond payout, 1000 = 1% of CLAM total supply
  const maxBondPayout = '1000'

  // DAO fee for bond
  const bondFee = '10000'

  // Max debt bond can take on
  const maxBondDebt = '8000000000000000'

  // Initial Bond debt
  const initialBondDebt = '0'

  const warmupPeriod = '3'

  const chainId = (await provider.getNetwork()).chainId

  const { router: quickswapRouterAddr, factory: quickswapFactoryAddr } =
    getQuickSwapAddresses(chainId)

  const UniswapV2Router = ContractFactory.fromSolidity(
    UniswapV2RouterJson,
    deployer
  )
  const quickRouter = UniswapV2Router.attach(quickswapRouterAddr)

  const daiAddr =
    chainId === 80001
      ? '0x19907af68A173080c3e05bb53932B0ED541f6d20'
      : '0x3Ed57914fF5b648DCc32fB7D7c8Ff2738F8Dcff4'

  // Deploy DAI
  const DAI = await ethers.getContractFactory('DAI')
  const dai = DAI.attach(daiAddr)
  await dai.mint(deployer.address, initialMint)
  console.log('DAI addr: ' + dai.address)

  // Deploy CLAM
  const CLAM = await ethers.getContractFactory('OtterClamERC20')
  const clam = await CLAM.deploy()
  console.log('CLAM deployed: ' + clam.address)

  const ClamCirculatingSupply = await ethers.getContractFactory(
    'ClamCirculatingSupply'
  )
  const clamCirculatingSupply = await ClamCirculatingSupply.deploy(
    deployer.address
  )
  await clamCirculatingSupply.deployTransaction.wait()
  await clamCirculatingSupply.initialize(clam.address)

  const uniswapFactory = new ethers.Contract(
    quickswapFactoryAddr,
    UniswapV2ABI,
    deployer
  )
  await (await uniswapFactory.createPair(clam.address, dai.address)).wait()
  const lpAddress = await uniswapFactory.getPair(clam.address, dai.address)
  console.log('LP created: ' + lpAddress)

  // Deploy bonding calc
  const BondingCalculator = await ethers.getContractFactory(
    'OtterBondingCalculator'
  )
  const bondingCalculator = await BondingCalculator.deploy(clam.address)

  // Deploy treasury
  const Treasury = await ethers.getContractFactory('OtterTreasury')
  const treasury = await Treasury.deploy(
    clam.address,
    dai.address,
    lpAddress,
    bondingCalculator.address,
    0
  )
  console.log('treasury deployed: ' + treasury.address)

  // Deploy staking distributor
  const StakingDistributor = await ethers.getContractFactory(
    'OtterStakingDistributor'
  )
  const stakingDistributor = await StakingDistributor.deploy(
    treasury.address,
    clam.address,
    epochLengthInSeconds,
    firstEpochTime
  )

  // Deploy sCLAM
  const StakedCLAM = await ethers.getContractFactory('StakedOtterClamERC20')
  const sCLAM = await StakedCLAM.deploy()

  // Deploy Staking
  const Staking = await ethers.getContractFactory('OtterStaking')
  const staking = await Staking.deploy(
    clam.address,
    sCLAM.address,
    epochLengthInSeconds,
    firstEpochNumber,
    firstEpochTime
  )

  // Deploy staking warmpup
  const StakingWarmup = await ethers.getContractFactory('OtterStakingWarmup')
  const stakingWarmup = await StakingWarmup.deploy(
    staking.address,
    sCLAM.address
  )

  // Deploy staking helper
  const StakingHelper = await ethers.getContractFactory('OtterStakingHelper')
  const stakingHelper = await StakingHelper.deploy(
    staking.address,
    clam.address
  )

  // Deploy DAI bond
  const DAIBond = await ethers.getContractFactory('OtterBondDepository')
  const daiBond = await DAIBond.deploy(
    clam.address,
    dai.address,
    treasury.address,
    daoAddr,
    zeroAddress
  )

  const DaiClamBond = await ethers.getContractFactory('OtterBondDepository')
  const daiClamBond = await DaiClamBond.deploy(
    clam.address,
    lpAddress,
    treasury.address,
    daoAddr,
    bondingCalculator.address
  )
  const IDO = await ethers.getContractFactory('OtterClamIDO')
  const ido = await IDO.deploy(
    clam.address,
    daiAddr,
    treasury.address,
    staking.address,
    lpAddress
  )

  console.log(
    JSON.stringify({
      sCLAM_ADDRESS: sCLAM.address,
      CLAM_ADDRESS: clam.address,
      MAI_ADDRESS: dai.address,
      TREASURY_ADDRESS: treasury.address,
      CLAM_BONDING_CALC_ADDRESS: bondingCalculator.address,
      STAKING_ADDRESS: staking.address,
      STAKING_HELPER_ADDRESS: stakingHelper.address,
      RESERVES: {
        MAI: dai.address,
        MAI_CLAM: lpAddress,
      },
      BONDS: {
        MAI: daiBond.address,
        MAI_CLAM: daiClamBond.address,
      },
      IDO: ido.address,
      CLAM_CIRCULATING_SUPPLY: clamCirculatingSupply.address,
    })
  )

  // queue and toggle DAI reserve depositor
  await (await treasury.queue('0', daiBond.address)).wait()
  await treasury.toggle('0', daiBond.address, zeroAddress)

  await (await treasury.queue('0', deployer.address)).wait()
  await treasury.toggle('0', deployer.address, zeroAddress)

  // queue and toggle DAI-CLAM liquidity depositor
  await (await treasury.queue('4', daiClamBond.address)).wait()
  await treasury.toggle('4', daiClamBond.address, zeroAddress)

  await (await treasury.queue('4', deployer.address)).wait()
  await treasury.toggle('4', deployer.address, zeroAddress)

  // Set bond terms
  await daiBond.initializeBondTerms(
    daiBondBCV,
    bondVestingLength,
    minBondPrice,
    maxBondPayout,
    bondFee,
    maxBondDebt,
    initialBondDebt
  )
  await daiClamBond.initializeBondTerms(
    '100',
    bondVestingLength,
    minBondPrice,
    maxBondPayout,
    bondFee,
    maxBondDebt,
    initialBondDebt
  )

  // Set staking for bonds
  await daiBond.setStaking(staking.address, stakingHelper.address)
  await daiClamBond.setStaking(staking.address, stakingHelper.address)

  // Initialize sCLAM and set the index
  await sCLAM.initialize(staking.address)
  await sCLAM.setIndex(initialIndex)

  // set distributor contract and warmup contract
  await staking.setContract('0', stakingDistributor.address)
  await staking.setContract('1', stakingWarmup.address)
  await staking.setWarmup(warmupPeriod)

  // Set treasury for CLAM token
  await clam.setVault(treasury.address)

  // Add staking contract as distributor recipient
  await stakingDistributor.addRecipient(staking.address, initialRewardRate)

  // queue and toggle reward manager
  await (await treasury.queue('8', stakingDistributor.address)).wait(1)
  await treasury.toggle('8', stakingDistributor.address, zeroAddress)

  // const Treasury = await ethers.getContractFactory('OtterTreasury')
  // const treasury = Treasury.attach('0x12239Ec193A208343F7FEa8410b7a10cb7DFf9A6')

  // const IDO = await ethers.getContractFactory('OtterClamIDO')
  // const ido = await IDO.deploy(
  //   '0xcf2cf9Aee9A2b93a7AF9F2444843AFfDd8C435eb',
  //   '0x19907af68A173080c3e05bb53932B0ED541f6d20',
  //   '0x12239Ec193A208343F7FEa8410b7a10cb7DFf9A6',
  //   '0x72054987656EA1a801656AD0b9c52FB47aF76419',
  //   '0x3073478d69c4b40ec0BD4BA533536134B633aC71'
  // )
  // console.log('IDO: ' + ido.address)
  // await (
  //   await ido.whiteListBuyers([
  //     deployer.getAddress(),
  //     '0x61329D875252c1dD95a3eB339926AaF0A511Cc74',
  //   ])
  // ).wait()
  // await ido.initialize(
  //   BigNumber.from(200000).mul(BigNumber.from(10).pow(9)),
  //   BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
  //   48 * 60 * 60, // 48 hours
  //   Math.round(Date.now() / 1000 - 30)
  // )

  // queue and toggle ido as reserve depositor
  // await (await treasury.queue('0', ido.address)).wait(1)
  // await treasury.toggle('0', ido.address, zeroAddress)

  // await (await treasury.queue('4', ido.address)).wait(1)
  // await treasury.toggle('4', ido.address, zeroAddress)

  // const IDO = await ethers.getContractFactory('OtterClamIDO')
  // const ido = IDO.attach('0xC4d9801372e6800D5dBb03eC907CbdDE437bE627')
  // await (await ido.disableWhiteList()).wait()
  // const wallets = []
  // for (let i = 0; i < 1000; i++) {
  //   const wallet = ethers.Wallet.createRandom().connect(deployer.provider)
  //   wallets.push(wallet)
  // }

  // console.log('whitelisting')
  // await (await ido.whiteListBuyers(wallets.map((w) => w.address))).wait()

  const lp = new ethers.Contract(lpAddress, IUniswapV2Pair, deployer)
  // Approve the treasury to spend DAI
  await Promise.all([
    (await dai.approve(treasury.address, largeApproval)).wait(),
    (await dai.approve(daiBond.address, largeApproval)).wait(),
    (await dai.approve(quickRouter.address, largeApproval)).wait(),
    (await clam.approve(staking.address, largeApproval)).wait(),
    (await clam.approve(stakingHelper.address, largeApproval)).wait(),
    (await clam.approve(quickRouter.address, largeApproval)).wait(),
    (await lp.approve(treasury.address, largeApproval)).wait(),
  ])

  const totalIDODaiAmount = 100 * 10000
  const clamMinted = 200000
  const lpClamAmount = 50000
  const initialClamPriceInLP = 15
  const daiInTreasury = totalIDODaiAmount - initialClamPriceInLP * lpClamAmount
  const profit = daiInTreasury - clamMinted - lpClamAmount
  console.log({ daiInTreasury, profit })

  await (
    await treasury.deposit(
      ethers.utils.parseEther(String(daiInTreasury)),
      dai.address,
      BigNumber.from(profit).mul(1e9)
    )
  ).wait()

  // mint lp
  await (
    await quickRouter.addLiquidity(
      dai.address,
      clam.address,
      ethers.utils.parseEther(String(lpClamAmount * initialClamPriceInLP)),
      ethers.utils.parseUnits(String(lpClamAmount), 9),
      ethers.utils.parseEther(String(lpClamAmount * initialClamPriceInLP)),
      ethers.utils.parseUnits(String(lpClamAmount), 9),
      deployer.address,
      1000000000000
    )
  ).wait()

  // deposit lp with full profit
  const lpBalance = await lp.balanceOf(deployer.address)
  const valueOfLPToken = await treasury.valueOfToken(lpAddress, lpBalance)
  await treasury.deposit(lpBalance, lpAddress, valueOfLPToken)

  // Stake CLAM through helper
  // await stakingHelper.stake(
  //   BigNumber.from(clamMinted).mul(BigNumber.from(10).pow(9))
  // )

  // Bond 1,000 CLAM in each of their bonds
  //   await daiBond.deposit("1000000000000000000000", "60000", deployer.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
