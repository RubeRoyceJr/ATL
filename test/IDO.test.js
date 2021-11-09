const { ethers, timeAndMine } = require('hardhat')
const { expect } = require('chai')
const { BigNumber } = require('@ethersproject/bignumber')

describe.skip('IDO', () => {
  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  // What epoch will be first epoch
  const firstEpochNumber = '1'

  // How many seconds are in each epoch
  const epochLength = 86400 / 3

  // Initial reward rate for epoch
  const initialRewardRate = '3000'

  // Initial staking index
  const initialIndex = '1000000000'

  let // Used as default deployer for contracts, asks as owner of contracts.
    deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    buyer1,
    clam,
    dai,
    treasury,
    uniFactory,
    pairAddress,
    lp,
    ido

  beforeEach(async () => {
    ;[deployer, buyer1] = await ethers.getSigners()

    firstEpochTime = (await deployer.provider.getBlock()).timestamp + 100

    const CLAM = await ethers.getContractFactory('OtterClamERC20')
    clam = await CLAM.deploy()
    await clam.setVault(deployer.address)

    const StakedCLAM = await ethers.getContractFactory('StakedOtterClamERC20')
    sClam = await StakedCLAM.deploy()

    const DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.deploy(0)

    const UniswapV2FactoryContract = await ethers.getContractFactory(
      'UniswapV2Factory'
    )
    uniFactory = await UniswapV2FactoryContract.deploy(deployer.address)
    await uniFactory.createPair(clam.address, dai.address)

    pairAddress = await uniFactory.getPair(clam.address, dai.address)

    const UniswapV2Pair = await ethers.getContractFactory('UniswapV2Pair')
    lp = UniswapV2Pair.attach(pairAddress)

    const BondingCalculator = await ethers.getContractFactory(
      'OtterBondingCalculator'
    )
    const bondingCalculator = await BondingCalculator.deploy(clam.address)

    const Treasury = await ethers.getContractFactory('OtterTreasury')
    treasury = await Treasury.deploy(
      clam.address,
      dai.address,
      pairAddress,
      bondingCalculator.address,
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

    const IDO = await ethers.getContractFactory('OtterClamIDO')
    ido = await IDO.deploy(
      clam.address,
      dai.address,
      treasury.address,
      staking.address,
      pairAddress
    )

    // queue and toggle ido reserve depositor
    await treasury.queue('0', ido.address)
    await treasury.toggle('0', ido.address, zeroAddress)

    // queue and toggle ido liquidity depositor
    await treasury.queue('4', ido.address)
    await treasury.toggle('4', ido.address, zeroAddress)

    await dai.approve(treasury.address, largeApproval)
    await dai.approve(ido.address, largeApproval)
    await dai.connect(buyer1).approve(ido.address, largeApproval)

    // mint 1,000,000 DAI for testing
    await dai.mint(
      deployer.address,
      BigNumber.from(200 * 10000).mul(BigNumber.from(10).pow(18))
    )
    await dai.transfer(
      buyer1.address,
      BigNumber.from(1000).mul(BigNumber.from(10).pow(18))
    )
  })

  describe('whiteListed', () => {
    it('should be blocked by whitelist', async () => {
      await ido.initialize(
        BigNumber.from(200000).mul(
          BigNumber.from(10).pow(await clam.decimals())
        ),
        BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
        100,
        Math.round(Date.now() / 1000 - 1000)
      )

      await expect(
        ido.purchaseCLAM(BigNumber.from(1000).mul(BigNumber.from(10).pow(18)))
      ).to.be.revertedWith('Not whitelisted')
    })
    it('should return false', async () => {
      expect(await ido.whiteListed(deployer.address)).to.be.false
    })
    it('should return true', async () => {
      const whitelist = [deployer.address]
      await ido.whiteListBuyers(whitelist)
      expect(await ido.whiteListed(deployer.address)).to.be.true
    })
  })

  describe('purchase', () => {
    beforeEach(async () => {
      const whitelist = [deployer.address, buyer1.address]
      await ido.whiteListBuyers(whitelist)
      await ido.initialize(
        BigNumber.from(200000).mul(
          BigNumber.from(10).pow(await clam.decimals())
        ),
        BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
        100,
        Math.round(Date.now() / 1000 - 1000)
      )
    })

    it('able to purchase first time', async () => {
      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
      expect(await ido.totalAmount()).to.eq(
        BigNumber.from(200000).mul(BigNumber.from(10).pow(9)).sub(maxAmountCLAM)
      )
      expect(await ido.purchasedAmounts(deployer.address)).to.eq(maxAmountCLAM)
      expect(await dai.balanceOf(ido.address)).to.eq(amountDAI)
    })

    it('failed to purchase second time', async () => {
      await ido.purchaseCLAM(
        BigNumber.from(1000).mul(BigNumber.from(10).pow(18))
      )
      await expect(
        ido.purchaseCLAM(BigNumber.from(1000).mul(BigNumber.from(10).pow(18)))
      ).to.be.revertedWith('Already participated')
    })

    it('able to purchase more for others', async () => {
      let buyerIdo = ido.connect(buyer1)
      await buyerIdo.purchaseCLAM(
        BigNumber.from(1000).mul(BigNumber.from(10).pow(18))
      )

      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
      expect(await ido.totalAmount()).to.eq(0)
      expect(await ido.purchasedAmounts(deployer.address)).to.eq(
        '199800000000000'
      )
    })
  })

  describe('disable white list', () => {
    beforeEach(async () => {
      await ido.initialize(
        BigNumber.from(201).mul(BigNumber.from(10).pow(9)),
        BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
        100,
        Math.round(Date.now() / 1000 - 1000)
      )
      await ido.disableWhiteList()
    })

    it('should able to purchase', async () => {
      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
      expect(await ido.totalAmount()).to.eq(
        BigNumber.from(1).mul(BigNumber.from(10).pow(9))
      )
      expect(await ido.purchasedAmounts(deployer.address)).to.eq(maxAmountCLAM)
      expect(await dai.balanceOf(ido.address)).to.eq(amountDAI)

      const secondBuyAmount = await ido.getAllotmentPerBuyer()
      const secondAmountDAI = secondBuyAmount
        .div(1e9)
        .mul(await ido.salePrice())
      const buyerIdo = ido.connect(buyer1)
      await expect(() =>
        buyerIdo.purchaseCLAM(secondAmountDAI)
      ).to.changeTokenBalance(dai, buyer1, secondAmountDAI.mul(-1))
      expect(await ido.totalAmount()).to.eq(0)
      expect(await ido.purchasedAmounts(buyer1.address)).to.eq(
        BigNumber.from(1).mul(BigNumber.from(10).pow(9))
      )
      expect(await dai.balanceOf(ido.address)).to.eq(
        amountDAI.add(secondAmountDAI)
      )
    })

    it('should failed to purchase more then total amount', async () => {
      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
      expect(await ido.totalAmount()).to.eq(
        BigNumber.from(1).mul(BigNumber.from(10).pow(9))
      )
      expect(await ido.purchasedAmounts(deployer.address)).to.eq(maxAmountCLAM)
      expect(await dai.balanceOf(ido.address)).to.eq(amountDAI)

      const secondBuyDAIAmount = BigNumber.from(6).mul(
        BigNumber.from(10).pow(18)
      )
      const buyerIdo = ido.connect(buyer1)
      await expect(
        buyerIdo.purchaseCLAM(secondBuyDAIAmount)
      ).to.be.revertedWith('More than alloted')
    })
  })

  describe('finalize', () => {
    beforeEach(async () => {
      const whitelist = [deployer.address, buyer1.address]
      await staking.setWarmup(1)
      await ido.whiteListBuyers(whitelist)
      await ido.initialize(
        BigNumber.from(200000).mul(
          BigNumber.from(10).pow(await clam.decimals())
        ),
        BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
        100,
        Math.round(Date.now() / 1000 - 1000)
      )
    })

    it('should finalize', async () => {
      await dai.transfer(
        buyer1.address,
        BigNumber.from(500000).mul(BigNumber.from(10).pow(18))
      )

      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
      expect(await ido.totalAmount()).to.eq(
        BigNumber.from(200000).mul(BigNumber.from(10).pow(9)).sub(maxAmountCLAM)
      )
      expect(await ido.purchasedAmounts(deployer.address)).to.eq(maxAmountCLAM)
      expect(await dai.balanceOf(ido.address)).to.eq(amountDAI)

      await ido.connect(buyer1).purchaseCLAM(amountDAI)

      await ido.finalize(deployer.address)
      await ido.claim(buyer1.address)

      expect(await treasury.totalReserves()).to.eq('637298334620739')

      expect(await staking.warmupInfo(deployer.address)).to.deep.eq([
        BigNumber.from('100000').mul(BigNumber.from(10).pow(9)),
        BigNumber.from(
          '2315841784746323908471419700173758157065399693312811280789151600000000000000'
        ),
        BigNumber.from('2'),
        false,
      ])
      expect(await staking.warmupInfo(buyer1.address)).to.deep.eq([
        BigNumber.from('100000').mul(BigNumber.from(10).pow(9)),
        BigNumber.from(
          '2315841784746323908471419700173758157065399693312811280789151600000000000000'
        ),
        BigNumber.from('2'),
        false,
      ])

      // after 2 epochs, should able to claim with reward.
      await timeAndMine.setTimeIncrease(86400)
      await staking.rebase()
      await staking.rebase()

      await expect(() => staking.claim(deployer.address)).to.changeTokenBalance(
        sClam,
        deployer,
        '100375000000000'
      )
      await expect(() => staking.claim(buyer1.address)).to.changeTokenBalance(
        sClam,
        buyer1,
        '100375000000000'
      )
    })

    it('able to finalize after epoch 1 start', async () => {
      await dai.transfer(
        buyer1.address,
        BigNumber.from(500000).mul(BigNumber.from(10).pow(18))
      )

      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
      expect(await ido.totalAmount()).to.eq(
        BigNumber.from(200000).mul(BigNumber.from(10).pow(9)).sub(maxAmountCLAM)
      )
      expect(await ido.purchasedAmounts(deployer.address)).to.eq(maxAmountCLAM)
      expect(await dai.balanceOf(ido.address)).to.eq(amountDAI)

      await ido.connect(buyer1).purchaseCLAM(amountDAI)

      await timeAndMine.setTimeIncrease(150)

      await ido.finalize(deployer.address)
      await ido.claim(buyer1.address)

      expect(await treasury.totalReserves()).to.eq('637298334620739')

      expect(await staking.warmupInfo(deployer.address)).to.deep.eq([
        BigNumber.from('100000').mul(BigNumber.from(10).pow(9)),
        BigNumber.from(
          '2315841784746323908471419700173758157065399693312811280789151600000000000000'
        ),
        BigNumber.from('3'),
        false,
      ])
      expect(await staking.warmupInfo(buyer1.address)).to.deep.eq([
        BigNumber.from('100000').mul(BigNumber.from(10).pow(9)),
        BigNumber.from(
          '2315841784746323908471419700173758157065399693312811280789151600000000000000'
        ),
        BigNumber.from('3'),
        false,
      ])

      // after 1 epochs, should able to claim with reward.
      await timeAndMine.setTimeIncrease(86400 / 3)
      await staking.rebase()

      await expect(() => staking.claim(deployer.address)).to.changeTokenBalance(
        sClam,
        deployer,
        '100375000000000'
      )
      await expect(() => staking.claim(buyer1.address)).to.changeTokenBalance(
        sClam,
        buyer1,
        '100375000000000'
      )
    })

    it('should have rewards claim after second period', async () => {
      await dai.transfer(
        buyer1.address,
        BigNumber.from(500000).mul(BigNumber.from(10).pow(18))
      )

      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
      expect(await ido.totalAmount()).to.eq(
        BigNumber.from(200000).mul(BigNumber.from(10).pow(9)).sub(maxAmountCLAM)
      )
      expect(await ido.purchasedAmounts(deployer.address)).to.eq(maxAmountCLAM)
      expect(await dai.balanceOf(ido.address)).to.eq(amountDAI)

      await ido.connect(buyer1).purchaseCLAM(amountDAI)

      await ido.finalize(deployer.address)

      await timeAndMine.setTimeIncrease(86400)

      await ido.claim(buyer1.address)

      expect(await treasury.totalReserves()).to.eq('637298334620739')

      expect(await staking.warmupInfo(deployer.address)).to.deep.eq([
        BigNumber.from('100000').mul(BigNumber.from(10).pow(9)),
        BigNumber.from(
          '2315841784746323908471419700173758157065399693312811280789151600000000000000'
        ),
        BigNumber.from('2'),
        false,
      ])
      expect(await staking.warmupInfo(buyer1.address)).to.deep.eq([
        BigNumber.from('100000').mul(BigNumber.from(10).pow(9)),
        BigNumber.from(
          '2315841784746323908471419700173758157065399693312811280789151600000000000000'
        ),
        BigNumber.from('3'),
        false,
      ])
      await staking.rebase()

      await expect(() => staking.claim(deployer.address)).to.changeTokenBalance(
        sClam,
        deployer,
        '100375000000000'
      )
      await expect(() => staking.claim(buyer1.address)).to.changeTokenBalance(
        sClam,
        buyer1,
        '100375000000000'
      )
    })

    it('should failed with non-owner', async () => {
      await expect(
        ido.connect(buyer1).finalize(buyer1.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should failed claim 2 times', async () => {
      await dai.transfer(
        buyer1.address,
        BigNumber.from(500000).mul(BigNumber.from(10).pow(18))
      )

      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
      expect(await ido.totalAmount()).to.eq(
        BigNumber.from(200000).mul(BigNumber.from(10).pow(9)).sub(maxAmountCLAM)
      )
      expect(await ido.purchasedAmounts(deployer.address)).to.eq(maxAmountCLAM)
      expect(await dai.balanceOf(ido.address)).to.eq(amountDAI)

      await ido.connect(buyer1).purchaseCLAM(amountDAI)

      await ido.finalize(deployer.address)
      await expect(ido.claim(deployer.address)).to.be.revertedWith(
        'not purchased'
      )
    })
  })

  describe.skip('1000 buyer', () => {
    const totalAmount = BigNumber.from(200000).mul(BigNumber.from(10).pow(9))
    const pricePerClam = BigNumber.from(5).mul(BigNumber.from(10).pow(18))
    beforeEach(async () => {})

    it('buy all clam and finalize', async () => {
      const wallets = []
      const totalBuyer = 999
      for (let i = 0; i < totalBuyer; i++) {
        const wallet = ethers.Wallet.createRandom().connect(deployer.provider)
        wallets.push(wallet)
      }
      await ido.whiteListBuyers(wallets.map((w) => w.address))
      await ido.whiteListBuyers([deployer.address])
      await ido.initialize(
        totalAmount,
        pricePerClam,
        100,
        Math.round(Date.now() / 1000 - 1000)
      )

      const daiAmount = BigNumber.from(1000).mul(BigNumber.from(10).pow(18))
      await (await dai.approve(ido.address, largeApproval)).wait()
      await (await ido.purchaseCLAM(daiAmount)).wait()

      let nonce = await deployer.getTransactionCount()
      await Promise.all(
        wallets.map(async (wallet) => {
          await (
            await deployer.sendTransaction({
              to: wallet.address,
              value: ethers.utils.parseEther('0.001'),
              nonce: nonce++,
            })
          ).wait()
        })
      )
      nonce = await deployer.getTransactionCount()
      console.log('sending dai')
      await Promise.all(
        wallets.map(async (wallet) => {
          await (
            await dai.transfer(wallet.address, daiAmount, { nonce: nonce++ })
          ).wait()
        })
      )

      let step = 15
      for (let i = 0; i < totalBuyer; i += step) {
        await Promise.all(
          wallets.slice(i, i + step).map(async (wallet, j) => {
            let buyerDAI = dai.connect(wallet)
            let buyerIDO = ido.connect(wallet)

            await (await buyerDAI.approve(ido.address, largeApproval)).wait()
            await (await buyerIDO.purchaseCLAM(daiAmount)).wait()
            console.log(`${i + j} ${wallet.address} purchased`)
          })
        )
      }

      expect(await ido.totalAmount()).to.eq('0')

      await (await ido.finalize(deployer.address)).wait()

      nonce = await deployer.getTransactionCount()
      console.log('claim clams')
      step = 50
      for (let i = 0; i < totalBuyer; i += step) {
        await Promise.all(
          wallets.slice(i, i + step).map(async (wallet, j) => {
            await (await ido.claim(wallet.address)).wait()
            console.log(`${i + j} ${wallet.address} claim`)
          })
        )
      }

      expect(await treasury.totalReserves()).to.eq('637298334620739')
      expect(await dai.balanceOf(treasury.address)).to.eq(
        BigNumber.from(250000).mul(BigNumber.from(10).pow(18))
      )
      expect(await dai.balanceOf(ido.address)).to.eq(0)
    })
  })

  describe('cancel', () => {
    beforeEach(async () => {
      const whitelist = [deployer.address, buyer1.address]
      await ido.whiteListBuyers(whitelist)
      await ido.initialize(
        BigNumber.from(200000).mul(
          BigNumber.from(10).pow(await clam.decimals())
        ),
        BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
        100,
        Math.round(Date.now() / 1000 - 1000)
      )
    })

    it('should failed with non-owner', async () => {
      await expect(ido.connect(buyer1).cancel()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('should return funds to buyer', async () => {
      await dai.transfer(
        buyer1.address,
        BigNumber.from(500000).mul(BigNumber.from(10).pow(18))
      )

      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
      await ido.connect(buyer1).purchaseCLAM(amountDAI)

      await ido.cancel()
      await ido.withdraw()
      await ido.connect(buyer1).withdraw()

      expect(await dai.balanceOf(deployer.address)).to.eq(
        '1499000000000000000000000'
      )
      expect(await dai.balanceOf(buyer1.address)).to.eq(
        '501000000000000000000000'
      )
    })
  })

  describe('start', () => {
    beforeEach(async () => {
      const whitelist = [deployer.address, buyer1.address]
      await ido.whiteListBuyers(whitelist)
    })

    it('should failed to purchase if not initialized', async () => {
      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(ido.purchaseCLAM(amountDAI)).to.be.revertedWith(
        'Not started'
      )
    })

    it('should failed to purchase before start', async () => {
      await ido.initialize(
        BigNumber.from(200000).mul(
          BigNumber.from(10).pow(await clam.decimals())
        ),
        BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
        100,
        Math.round(Date.now() / 1000 + 1000000)
      )
      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(ido.purchaseCLAM(amountDAI)).to.be.revertedWith(
        'Not started'
      )
    })

    it('should able to purchase after start', async () => {
      await ido.initialize(
        BigNumber.from(200000).mul(
          BigNumber.from(10).pow(await clam.decimals())
        ),
        BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
        100,
        Math.round(Date.now() / 1000 - 1000)
      )
      const maxAmountCLAM = await ido.getAllotmentPerBuyer()
      const amountDAI = maxAmountCLAM.div(1e9).mul(await ido.salePrice())
      await expect(() => ido.purchaseCLAM(amountDAI)).to.changeTokenBalance(
        dai,
        deployer,
        amountDAI.mul(-1)
      )
    })
  })
})
