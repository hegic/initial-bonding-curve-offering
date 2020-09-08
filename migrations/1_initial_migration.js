const BN = web3.utils.BN
const HEGIC = artifacts.require("FakeHEGIC")
const InitialOffering = artifacts.require("HegicInitialOffering")

module.exports = async function (deployer, network) {
    if (["development", "develop", 'soliditycoverage'].indexOf(network) >= 0) {
      await deployer.deploy(HEGIC)
      await deployer.deploy(InitialOffering, HEGIC.address)
  } else {
      throw Error(`wrong network ${network}`)
  }
}
