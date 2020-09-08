
const HEGICContract = artifacts.require("FakeHEGIC")
const HegicIOContract = artifacts.require("HegicInitialOffering")
const BN = web3.utils.BN


const send = (method, params = []) =>
  new Promise((resolve, reject) =>
    web3.currentProvider.send({id: 0, jsonrpc: "2.0", method, params}, (err, x) => {
        if(err) reject(err)
        else resolve(x)
    })
  )

const getIOContracts = () => Promise.all([
    HegicIOContract.deployed(),
    HEGICContract.deployed()
]).then(([InitialOffering, HEGIC]) => ({InitialOffering, HEGIC}))

const snapshot = () => send("evm_snapshot").then(x => x.result)
const revert = (snap) => send("evm_revert", [snap])
const timeTravel = async (seconds) => {
  await send("evm_increaseTime", [seconds])
  await send("evm_mine")
}

module.exports = {
    getIOContracts,
    timeTravel, snapshot, revert,
    toWei: (value) => web3.utils.toWei(value.toString(), "ether"),
}
