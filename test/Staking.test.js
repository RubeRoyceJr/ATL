const { ethers, timeAndMine } = require('hardhat')
const { expect } = require('chai')
const { BigNumber } = require('@ethersproject/bignumber')

describe('Staking', () => {
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

  let // Used as default deployer for contracts, asks as owner of contracts.
    deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    depositor,
    clam,
    sClam,
    dai,
    treasury,
    stakingDistributor,
    staking,
    stakingHelper,
    firstEpochTime

  beforeEach(async () => {
    ;[deployer, depositor] = await ethers.getSigners()

    firstEpochTime = (await deployer.provider.getBlock()).timestamp - 100

    const CLAM = await ethers.getContractFactory('OtterClamERC20')
    clam = await CLAM.deploy()
    await clam.setVault(deployer.address)

    const DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.deploy(0)

    const StakedCLAM = await ethers.getContractFactory('StakedOtterClamERC20')
    sClam = await StakedCLAM.deploy()

    const Treasury = await ethers.getContractFactory('OtterTreasury')
    treasury = await Treasury.deploy(
      clam.address,
      dai.address,
      zeroAddress,
      zeroAddress,
      0
    )

    const StakingDistributor = await ethers.getContractFactory(
      'OtterStakingDistributor'
    )
    stakingDistributor = await StakingDistributor.deploy(
      treasury.address,
      clam.address,
      epochLength,
      firstEpochTime
    )

    const Staking = await ethers.getContractFactory('OtterStaking')
    staking = await Staking.deploy(
      clam.address,
      sClam.address,
      epochLength,
      firstEpochNumber,
      firstEpochTime
    )

    // Deploy staking helper
    const StakingHelper = await ethers.getContractFactory('OtterStakingHelper')
    stakingHelper = await StakingHelper.deploy(staking.address, clam.address)

    const StakingWarmup = await ethers.getContractFactory('OtterStakingWarmup')
    const stakingWarmup = await StakingWarmup.deploy(
      staking.address,
      sClam.address
    )

    await sClam.initialize(staking.address)
    await sClam.setIndex(initialIndex)

    await staking.setContract('0', stakingDistributor.address)
    await staking.setContract('1', stakingWarmup.address)

    await stakingDistributor.addRecipient(staking.address, initialRewardRate)

    await clam.setVault(treasury.address)

    // queue and toggle reward manager
    await treasury.queue('8', stakingDistributor.address)
    await treasury.toggle('8', stakingDistributor.address, zeroAddress)

    // queue and toggle deployer reserve depositor
    await treasury.queue('0', deployer.address)
    await treasury.toggle('0', deployer.address, zeroAddress)

    await clam.approve(stakingHelper.address, largeApproval)
    await dai.approve(treasury.address, largeApproval)

    // mint 1,000,000 DAI for testing
    await dai.mint(
      deployer.address,
      BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18))
    )
  })

  describe('treasury deposit', () => {
    it('should get CLAM', async () => {
      await expect(() =>
        treasury.deposit(
          BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
          dai.address,
          BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
        )
      ).to.changeTokenBalance(
        clam,
        deployer,
        BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9))
      )
    })
  })

  describe('stake', () => {
    it('should get equally sClam tokens', async () => {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )

      await expect(() =>
        stakingHelper.stake(
          BigNumber.from(100).mul(BigNumber.from(10).pow(9)),
          deployer.address
        )
      ).to.changeTokenBalance(
        sClam,
        deployer,
        BigNumber.from(100).mul(BigNumber.from(10).pow(9))
      )
    })
  })

  describe('rebase', () => {
    it('distribute 0 for first block', async () => {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )

      await stakingHelper.stake(
        BigNumber.from(100).mul(BigNumber.from(10).pow(9)),
        deployer.address
      )

      await expect(() => staking.rebase()).to.changeTokenBalance(
        sClam,
        deployer,
        0
      )

      expect(await sClam.index()).to.eq('1000000000')
    })

    it('should rebase after epoch end', async () => {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )

      await stakingHelper.stake(
        BigNumber.from(100).mul(BigNumber.from(10).pow(9)),
        deployer.address
      )

      // 0 -> 1: no reward
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sClam,
        deployer,
        0
      )

      const epoch = await staking.epoch()
      const distribute = epoch[3]

      // advanced next block time to next epoch
      await timeAndMine.setTimeIncrease(86400 / 3 + 1)

      // 1 -> 2
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sClam,
        deployer,
        distribute
      )
      expect(await sClam.index()).to.eq('8500000000')
    })

    it('should not rebase before epoch end', async () => {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )

      await stakingHelper.stake(
        BigNumber.from(100).mul(BigNumber.from(10).pow(9)),
        deployer.address
      )

      // 0 -> 1: no reward
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sClam,
        deployer,
        0
      )

      // advanced next block time to same epoch
      await timeAndMine.setTimeIncrease(86400 / 3 - 200)

      // 1 -> 1
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sClam,
        deployer,
        0
      )

      const [, number, endTime, distribute] = await staking.epoch()
      expect(number).to.eq(2)
      expect(endTime).to.eq(firstEpochTime + 86400 / 3)
      expect(distribute).to.eq('750000000000')
    })

    it('should not receive reward', async () => {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(1e9)
      )

      await stakingHelper.stake(BigNumber.from(100).mul(1e9), deployer.address)

      // 0 -> 1: no reward
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sClam,
        deployer,
        0
      )

      // advanced next block time to next epoch
      await timeAndMine.setTimeIncrease(86400 / 3 + 1)

      // 1 -> 2
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sClam,
        deployer,
        '750000000000'
      )
      expect(await sClam.index()).to.eq('8500000000')

      // set distributor to zero
      staking.setContract(0, zeroAddress)

      // 2 -> 3, still get reward
      await timeAndMine.setTimeIncrease(86400 / 3 + 1)

      await expect(() => staking.rebase()).to.changeTokenBalance(
        sClam,
        deployer,
        '752250000000'
      )

      // 3 -> 4, no reward
      await timeAndMine.setTimeIncrease(86400 / 3 + 1)
      await expect(() => staking.rebase()).to.changeTokenBalance(
        sClam,
        deployer,
        0
      )
    })
  })

  describe('warmup', () => {
    beforeEach(async () => {
      await treasury.deposit(
        BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18)),
        dai.address,
        BigNumber.from(750000).mul(BigNumber.from(10).pow(9))
      )
    })

    it('in stay in warmup after 1 epoch', async () => {
      await staking.setWarmup(2)

      await expect(() =>
        stakingHelper.stake(100 * 1e9, deployer.address)
      ).to.changeTokenBalance(sClam, deployer, 0)

      const [deposit, gons, expiry, lock] = await staking.warmupInfo(
        deployer.address
      )
      expect(deposit).to.eq(100 * 1e9)
      expect(expiry).to.eq(4)
      expect(lock).to.be.false

      await timeAndMine.setTimeIncrease(86400 / 3 + 1)
      await staking.rebase()
      await expect(() => staking.claim(deployer.address)).to.changeTokenBalance(
        sClam,
        deployer,
        0
      )

      await timeAndMine.setTimeIncrease(86400 / 3 + 1)
      await staking.rebase()
      await expect(() => staking.claim(deployer.address)).to.changeTokenBalance(
        sClam,
        deployer,
        '1602250000000'
      )
    })

    it('should be able to forfeit without reward', async () => {
      await staking.setWarmup(2)

      await expect(() =>
        stakingHelper.stake(100 * 1e9, deployer.address)
      ).to.changeTokenBalance(sClam, deployer, 0)

      const [deposit, gons, expiry, lock] = await staking.warmupInfo(
        deployer.address
      )
      expect(deposit).to.eq(100 * 1e9)
      expect(expiry).to.eq(4)
      expect(lock).to.be.false

      await timeAndMine.setTimeIncrease(86400 / 3 + 1)
      await staking.rebase()
      await expect(() => staking.forfeit()).to.changeTokenBalance(
        clam,
        deployer,
        100 * 1e9
      )
    })
  })
})
