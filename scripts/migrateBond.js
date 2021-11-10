const { ethers } = require('hardhat')

async function main() {
  const signer = await ethers.getSigner()
  const OtterBondDepository = await ethers.getContractFactory(
    'OtterBondDepository'
  )
  const bondV1 = OtterBondDepository.attach(
    '0x79B47c03B02019Af78Ee0de9B0b3Ac0786338a0d'
  )
  const bondV2 = OtterBondDepository.attach(
    '0x64c766f9A4936c3a4b51C55Ea5C4854E19766035'
  )

  const [bcv, vestingTerm, minimumPrice, maxPayout, fee, maxDebt] =
    await bondV1.terms()
  const totalDebt = await bondV1.totalDebt()
  const currentDebt = await bondV1.currentDebt()
  const debtDecay = await bondV1.debtDecay()

  console.log(
    `bond v1 terms` +
      JSON.stringify(
        {
          bcv: bcv.toString(),
          vestingTerm: vestingTerm.toString(),
          minimumPrice: minimumPrice.toString(),
          maxPayout: maxPayout.toString(),
          fee: fee.toString(),
          maxDebt: maxDebt.toString(),
          totalDebt: ethers.utils.formatUnits(totalDebt, 9),
          currentDebt: ethers.utils.formatUnits(currentDebt, 9),
          debtDecay: ethers.utils.formatUnits(debtDecay, 9),
        },
        null,
        2
      )
  )

  // await bondV2.initializeBondTerms(
  //   '40',
  //   vestingTerm,
  //   minimumPrice,
  //   maxPayout,
  //   fee,
  //   maxDebt,
  //   currentDebt,
  // )

  console.log('done')
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
