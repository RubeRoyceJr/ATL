const { ethers } = require('hardhat')
const { expect } = require('chai')
const { BigNumber } = require('@ethersproject/bignumber')

describe('Presale', () => {
  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000'

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  let // Used as default deployer for contracts, asks as owner of contracts.
    deployer,
    // Used as the default user for deposits and trade. Intended to be the default regular user.
    depositor,
    clam,
    pClam,
    exercisePreClam,
    dai,
    treasury

  beforeEach(async () => {
    ;[deployer, depositor] = await ethers.getSigners()

    firstEpochTime = (await deployer.provider.getBlock()).timestamp - 100

    const CLAM = await ethers.getContractFactory('OtterClamERC20')
    clam = await CLAM.deploy()
    await clam.setVault(deployer.address)

    const DAI = await ethers.getContractFactory('DAI')
    dai = await DAI.deploy(0)

    const PreOtterClamERC20 = await ethers.getContractFactory(
      'PreOtterClamERC20'
    )
    pClam = await PreOtterClamERC20.deploy()

    const Treasury = await ethers.getContractFactory('OtterTreasury')
    treasury = await Treasury.deploy(
      clam.address,
      dai.address,
      zeroAddress,
      zeroAddress,
      0
    )

    const ClamCirculatingSupply = await ethers.getContractFactory(
      'ClamCirculatingSupply'
    )
    const clamCirculatingSupply = await ClamCirculatingSupply.deploy(
      deployer.address
    )
    await clamCirculatingSupply.initialize(clam.address)

    const ExercisePreClam = await ethers.getContractFactory('ExercisePreClam')
    exercisePreClam = await ExercisePreClam.deploy(
      pClam.address,
      clam.address,
      dai.address,
      treasury.address,
      clamCirculatingSupply.address
    )

    await clam.setVault(treasury.address)

    // queue and toggle deployer reserve depositor
    await treasury.queue('0', deployer.address)
    await treasury.toggle('0', deployer.address, zeroAddress)

    await treasury.queue('0', exercisePreClam.address)
    await treasury.toggle('0', exercisePreClam.address, zeroAddress)

    await dai.approve(treasury.address, largeApproval)
    await dai.approve(exercisePreClam.address, largeApproval)
    await pClam.approve(exercisePreClam.address, largeApproval)

    // mint 1,000,000 DAI for testing
    await dai.mint(
      deployer.address,
      BigNumber.from(100 * 10000).mul(BigNumber.from(10).pow(18))
    )

    // mint 250,000 CLAM for testing
    treasury.deposit(
      BigNumber.from(50 * 10000).mul(BigNumber.from(10).pow(18)),
      dai.address,
      BigNumber.from(25 * 10000).mul(BigNumber.from(10).pow(9))
    )
  })

  describe('exercise', () => {
    it('should get reverted', async () => {
      await exercisePreClam.setTerms(
        deployer.address,
        BigNumber.from(30000).mul(BigNumber.from(10).pow(18)),
        10 * 10000 // 10%
      )

      await expect(
        exercisePreClam.exercise(
          BigNumber.from(30000).mul(BigNumber.from(10).pow(18))
        )
      ).to.be.revertedWith('Not enough vested')
    })

    it('should get clam', async () => {
      await exercisePreClam.setTerms(
        deployer.address,
        BigNumber.from(30000).mul(BigNumber.from(10).pow(18)),
        10 * 10000 // 10%
      )

      await expect(() =>
        exercisePreClam.exercise(
          BigNumber.from(10000).mul(BigNumber.from(10).pow(18))
        )
      ).to.changeTokenBalance(
        clam,
        deployer,
        BigNumber.from(10000).mul(BigNumber.from(10).pow(9))
      )
      expect(await dai.balanceOf(deployer.address)).to.eq(
        BigNumber.from(490000).mul(BigNumber.from(10).pow(18))
      )
      expect(await pClam.balanceOf(deployer.address)).to.eq(
        '999990000000000000000000000'
      )
    })
  })
})
