const { ethers } = require('hardhat')

async function main() {
  const signer = await ethers.getSigner()
  const OtterBondDepository = await ethers.getContractFactory(
    'OtterBondDepository'
  )
  const bondType = 'lp'

  const bond =
    bondType == 'mai'
      ? OtterBondDepository.attach('0x28077992bFA9609Ae27458A766470b03D43dEe8A')
      : OtterBondDepository.attach('0x64c766f9A4936c3a4b51C55Ea5C4854E19766035')

  const bcvCurrent = (await bond.terms())[0].toNumber()

  const add = false
  const adjustment = 1
  const bcvTarget = 38
  const buffer = 0
  const step = Math.ceil(Math.abs(bcvCurrent - bcvTarget) / adjustment) + 1

  console.log(
    `adjust bond ${bondType}: ` +
      JSON.stringify(
        {
          add,
          adjustment,
          bcvCurrent,
          bcvTarget,
          step,
          buffer,
        },
        null,
        2
      )
  )
  await (await bond.setAdjustment(add, adjustment, bcvTarget, buffer)).wait(2)

  console.log('adjusted')

  const nonce = await signer.getTransactionCount()
  const amount = bondType === 'mai' ? '0.6' : '0.000002'
  for (let i = 0; i < step; i++) {
    await bond.deposit(
      ethers.utils.parseEther(amount),
      ethers.utils.parseUnits('9999', 9),
      signer.address,
      { nonce: nonce + i }
    )
    console.log('adjust: ' + i)
  }

  console.log('done')
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
