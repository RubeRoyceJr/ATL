const { ethers } = require('hardhat')
const { ContractFactory } = require('ethers')
const { expect } = require('chai')
const { toClamAmount } = require('./helper')
const UniswapV2FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const UniswapV2PairJson = require('@uniswap/v2-core/build/UniswapV2Pair.json')
const UniswapV2RouterJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')

describe.skip('ClamTokenMigrator', () => {
  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // What epoch will be first epoch
  const firstEpochNumber = '1'

  // How many seconds are in each epoch
  const epochLength = 86400 / 3

  // Initial reward rate for epoch
  const initialRewardRate = '3000'

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  // Initial staking index
  const initialIndex = '1000000000'

  let deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    depositor,
    clam,
    clam2,
    sClam,
    sClam2,
    dai,
    lp,
    lp2,
    quickFactory,
    quickRouter,
    treasury,
    treasury2,
    stakingDistributor,
    staking,
    stakingHelper,
    firstEpochTime,
    migrator

  beforeEach(async () => {
    ;[deployer, depositor] = await ethers.getSigners()

    firstEpochTime = (await deployer.provider.getBlock()).timestamp - 100

    const DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.deploy(0)

    const CLAM = await ethers.getContractFactory('OtterClamERC20')
    clam = await CLAM.deploy()
    const CLAM2 = await ethers.getContractFactory('OtterClamERC20V2')
    clam2 = await CLAM2.deploy()

    const StakedCLAM = await ethers.getContractFactory('StakedOtterClamERC20')
    sClam = await StakedCLAM.deploy()

    const UniswapV2FactoryContract = ContractFactory.fromSolidity(
      UniswapV2FactoryJson,
      deployer
    )
    quickFactory = await UniswapV2FactoryContract.deploy(deployer.address)

    const UniswapV2Router = ContractFactory.fromSolidity(
      UniswapV2RouterJson,
      deployer
    )
    quickRouter = await UniswapV2Router.deploy(
      quickFactory.address,
      zeroAddress
    )

    await quickFactory.createPair(clam.address, dai.address)
    const pairAddress = await quickFactory.getPair(clam.address, dai.address)
    const UniswapV2Pair = ContractFactory.fromSolidity(
      UniswapV2PairJson,
      deployer
    )
    lp = UniswapV2Pair.attach(pairAddress)

    await quickFactory.createPair(clam2.address, dai.address)
    const pair2Address = await quickFactory.getPair(clam2.address, dai.address)
    lp2 = UniswapV2Pair.attach(pair2Address)

    const BondingCalculator = await ethers.getContractFactory(
      'OtterBondingCalculator'
    )
    const bondingCalculator = await BondingCalculator.deploy(clam.address)

    const Treasury = await ethers.getContractFactory('OtterTreasury')
    treasury = await Treasury.deploy(
      clam.address,
      dai.address,
      lp.address,
      bondingCalculator.address,
      0
    )
    treasury2 = await Treasury.deploy(
      clam2.address,
      dai.address,
      lp2.address,
      bondingCalculator.address,
      0
    )

    const MigratorContract = await ethers.getContractFactory(
      'ClamTokenMigrator'
    )
    migrator = await MigratorContract.deploy(
      clam.address,
      treasury.address,
      quickRouter.address,
      quickFactory.address,
      clam2.address,
      treasury2.address,
      dai.address
    )

    // const StakingDistributor = await ethers.getContractFactory(
    //   'OtterStakingDistributor'
    // )
    // stakingDistributor = await StakingDistributor.deploy(
    //   treasury.address,
    //   clam.address,
    //   epochLength,
    //   firstEpochTime
    // )

    // const Staking = await ethers.getContractFactory('OtterStaking')
    // staking = await Staking.deploy(
    //   clam.address,
    //   sClam.address,
    //   epochLength,
    //   firstEpochNumber,
    //   firstEpochTime
    // )

    // // Deploy staking helper
    // const StakingHelper = await ethers.getContractFactory('OtterStakingHelper')
    // stakingHelper = await StakingHelper.deploy(staking.address, clam.address)

    // const StakingWarmup = await ethers.getContractFactory('OtterStakingWarmup')
    // const stakingWarmup = await StakingWarmup.deploy(
    //   staking.address,
    //   sClam.address
    // )

    // await sClam.initialize(staking.address)
    // await sClam.setIndex(initialIndex)

    // await staking.setContract('0', stakingDistributor.address)
    // await staking.setContract('1', stakingWarmup.address)

    // await stakingDistributor.addRecipient(staking.address, initialRewardRate)

    await clam.setVault(treasury.address)
    await clam2.setVault(treasury2.address)

    // queue and toggle deployer reserve depositor
    await treasury.queue('0', deployer.address)
    await treasury.toggle('0', deployer.address, zeroAddress)
    await treasury.queue('4', deployer.address)
    await treasury.toggle('4', deployer.address, zeroAddress)

    // queue and toggle migrator as manager
    await treasury.queue('1', migrator.address)
    await treasury.toggle('1', migrator.address, zeroAddress)
    await treasury.queue('3', migrator.address)
    await treasury.toggle('3', migrator.address, zeroAddress)
    await treasury.queue('6', migrator.address)
    await treasury.toggle('6', migrator.address, zeroAddress)

    // queue and toggle migrator as new treasury depositor
    await treasury2.queue('0', migrator.address)
    await treasury2.toggle('0', migrator.address, zeroAddress)
    await treasury2.queue('4', migrator.address)
    await treasury2.toggle('4', migrator.address, zeroAddress)
    await treasury2.queue('8', migrator.address)
    await treasury2.toggle('8', migrator.address, zeroAddress)

    // await clam.approve(stakingHelper.address, largeApproval)
    await dai.approve(treasury.address, largeApproval)
    await lp.approve(treasury.address, largeApproval)
    await clam.approve(migrator.address, largeApproval)
    await dai.approve(quickRouter.address, largeApproval)
    await clam.approve(quickRouter.address, largeApproval)
    await clam.connect(depositor).approve(migrator.address, largeApproval)

    await dai.mint(
      deployer.address,
      ethers.utils.parseEther(String(1000 * 10000))
    )
  })

  describe('migrate process', () => {
    it('should deposit excess dai to the new treasury', async () => {
      const oldDaiReserve = ethers.utils.parseEther('905126.540522624806525292')
      const oldTotalSupply = ethers.BigNumber.from('387634700303642')
      const profit = oldDaiReserve.div(1e9).sub(oldTotalSupply)
      const oldLPDaiAmount = ethers.utils.parseEther(
        '1328699.790772922615662018'
      )
      const oldLPClamAmount = toClamAmount('46983.066687369')

      // deposit DAI and mint CLAMs
      await expect(() =>
        treasury.deposit(oldDaiReserve, dai.address, profit)
      ).to.changeTokenBalance(clam, deployer, oldTotalSupply)

      // deposit CLAM/DAI lp
      await quickRouter.addLiquidity(
        dai.address,
        clam.address,
        oldLPDaiAmount,
        oldLPClamAmount,
        oldLPDaiAmount,
        oldLPClamAmount,
        deployer.address,
        1000000000000
      )

      const lpBalance = await lp.balanceOf(deployer.address)
      const lpValue = await treasury.valueOfToken(lp.address, lpBalance)
      await treasury.deposit(lpBalance, lp.address, lpValue)

      const oldClamAmount = await clam.balanceOf(deployer.address)

      // migrate contracts
      await migrator.migrateContracts()

      // migrator should not have any token left
      expect(await lp.balanceOf(migrator.address)).to.eq('0')
      expect(await clam.balanceOf(migrator.address)).to.eq('0')
      expect(await dai.balanceOf(migrator.address)).to.eq('0')
      expect(await clam2.balanceOf(migrator.address)).to.eq('68130326723254')

      // just left enough mai for total supply of old clam
      expect(await dai.balanceOf(treasury.address)).to.eq(
        '340651633616274806525292'
      )
      expect(await clam2.totalSupply()).to.eq(oldTotalSupply.div(5).sub(1))

      // transfer clam to another user
      await clam.transfer(depositor.address, ethers.utils.parseUnits('100', 9))

      // migrate personal
      await migrator.migrate()
      await migrator.connect(depositor).migrate()

      expect(await clam2.balanceOf(deployer.address)).to.eq(
        oldClamAmount.sub(ethers.utils.parseUnits('100', 9)).div(5)
      )
      expect(await clam2.balanceOf(depositor.address)).to.eq(
        ethers.utils.parseUnits('20', 9)
      )
      expect(await clam.balanceOf(deployer.address)).to.eq('0')
      expect(await clam.balanceOf(depositor.address)).to.eq('0')

      // migrator should not have any token left
      expect(await lp.balanceOf(migrator.address)).to.eq('0')
      expect(await clam.balanceOf(migrator.address)).to.eq('0')
      expect(await dai.balanceOf(migrator.address)).to.eq('0')
      expect(await clam2.balanceOf(migrator.address)).to.eq('0')

      // old clam total supply should be 1, locked in QuickSwap
      expect(await clam.totalSupply()).to.eq('1')

      // old treasury reserve should < 1
      expect(await dai.balanceOf(treasury.address)).to.eq('1806525292')
      expect(await lp.balanceOf(treasury.address)).to.eq('0')

      // new LP open in x5 price
      const [daiAmount, newClamAmount] = await lp2.getReserves()
      expect(daiAmount).to.eq('1328699790772922447494252')
      expect(newClamAmount).to.eq(oldLPClamAmount.div(5))

      // new treasury have the same amount of total reserves
      await treasury2.auditReserves()

      expect(await lp2.balanceOf(treasury2.address)).to.eq(
        '3533451312169791387'
      )
      expect(await dai.balanceOf(treasury2.address)).to.eq(
        '905126540522623000000000'
      )
      expect(await treasury2.totalReserves()).to.eq('1128601623477964')
    })
  })
})
