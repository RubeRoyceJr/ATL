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
      : OtterBondDepository.attach('0x79B47c03B02019Af78Ee0de9B0b3Ac0786338a0d')

  const bcvCurrent = (await bond.terms())[0].toNumber()

  const add = false
  const adjustment = 2
  const bcvTarget = 90
  const buffer = 0
  const step = Math.ceil(Math.abs(bcvCurrent - bcvTarget) / adjustment)

  console.log(
    'adjust bond: ' +
      JSON.stringify(
        {
          add,
          adjustment,
          bcvCurrent,
          bcvTarget,
          step,
          buffer,
        },
        2
      )
  )
  // await (await bond.setAdjustment(add, adjustment, bcvTarget, buffer)).wait(2)

  console.log('adjusted')

  if (bondType == 'mai') {
    const nonce = await signer.getTransactionCount()
    for (let i = 0; i < step; i++) {
      await bond.deposit(
        ethers.utils.parseEther('1'),
        ethers.utils.parseUnits('9999', 9),
        signer.address,
        { nonce: nonce + i }
      )
      console.log('adjust: ' + i)
    }
  }

  console.log('done')
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
