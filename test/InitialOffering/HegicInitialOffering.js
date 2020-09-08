const {getIOContracts, toWei, timeTravel, snapshot, revert} = require("../utils/utils.js")
const toBN = web3.utils.toBN
const params = {
    BCSupply: toBN("753001000000000000000000000")
}

contract("InitialOffering", ([user1, user2, user3, user4]) => {
    const contract = getIOContracts()



    it("Should provide HEGIC to InitialOffering contract", async () => {
        const {InitialOffering, HEGIC} = await contract
        await HEGIC.mintTo(InitialOffering.address, params.BCSupply)
    })

    it("Shouldn't withdraw HEGIC before start", async () => {
        const {InitialOffering} = await contract
        await InitialOffering.withdrawHEGIC().then(
            () => assert.fail("The owner withdraw HEGIC before start"),
            x => assert.equal(x.reason, "The offering must be completed")
        )
    })


    it("Shouldn't receive ETH before the offering", async () => {
        const {InitialOffering} = await contract
        await InitialOffering.sendTransaction({value:100000000, from:user1})
            .then(
                () => assert.fail("ETH was provided"),
                x => assert.equal(x.reason, "The offering has not started yet")
            )
    })

    it("Should receive ETH during the offering", async () => {
        lastSnapshot = await snapshot()
        try {
            const {InitialOffering} = await contract
            const start = await InitialOffering.START()
            const delta = parseInt(start - Date.now() / 1000) + 1

            await timeTravel(delta)
            await InitialOffering.sendTransaction({value:100000000, from:user1})
                .catch(() => assert.fail("ETH provide was reverted"))
            await timeTravel(24*3600)
            await InitialOffering.sendTransaction({value:100000000, from:user1})
                .catch(() => assert.fail("ETH provide was reverted"))
            await timeTravel(24*3600)
            await InitialOffering.sendTransaction({value:100000000, from:user1})
                .catch(() => assert.fail("ETH provide was reverted"))
            await timeTravel(24*3600-1)
            await InitialOffering.sendTransaction({value:100000000, from:user1})
                .catch(() => assert.fail("ETH provide was reverted during the offering"))
        } finally {
            await revert(lastSnapshot)
        }
    })

    it("Shouldn't receive ETH after the offering", async () => {
        lastSnapshot = await snapshot()
        try {
            const {InitialOffering} = await contract
            const start = await InitialOffering.START()
            const delta = parseInt(start - Date.now() / 1000) + 3*24*3600 + 2

            await timeTravel(delta)
            await InitialOffering.sendTransaction({value:100000000, from:user1})
                .then(
                    () => assert.fail("ETH was provided"),
                    x => assert.equal(x.reason, "The offering has already ended")
                )
        } finally {
            await revert(lastSnapshot)
        }
    })

    it("Should claim Hegic after the offering (was provided enough)", async () => {
        lastSnapshot = await snapshot()
        try {
            const {InitialOffering, HEGIC} = await contract
            const start = await InitialOffering.START()
            const delta = parseInt(start - Date.now() / 1000) + 1

            const startBalance = await Promise.all([
                HEGIC.balanceOf(user1).then(toBN),
                HEGIC.balanceOf(user2).then(toBN),
                HEGIC.balanceOf(user3).then(toBN),
                HEGIC.balanceOf(user4).then(toBN),
            ])

            await timeTravel(delta)
            await InitialOffering.sendTransaction({value:toWei(1000), from:user1})
            await InitialOffering.sendTransaction({value:toWei(2000), from:user2})
            await InitialOffering.sendTransaction({value:toWei(500), from:user4})
            await InitialOffering.sendTransaction({value:toWei(1000), from:user2})
            await InitialOffering.sendTransaction({value:toWei(2000), from:user3})
            await timeTravel(3 * 24 * 3600 + 1)
            await InitialOffering.claim({from: user1})
            await InitialOffering.claim({from: user2})
            await InitialOffering.claim({from: user3})
            await InitialOffering.claim({from: user4})


            const deltaBalance = await Promise.all([
                HEGIC.balanceOf(user1).then(toBN),
                HEGIC.balanceOf(user2).then(toBN),
                HEGIC.balanceOf(user3).then(toBN),
                HEGIC.balanceOf(user4).then(toBN),
            ]).then(x => x.map((x,i) => x.sub(startBalance[0]).toString()))
            assert.equal(deltaBalance[0], "13901584615384615384615384")
            assert.equal(deltaBalance[1], "41704753846153846153846153")
            assert.equal(deltaBalance[2], "27803169230769230769230769")
            assert.equal(deltaBalance[3], "6950792307692307692307692")

            await InitialOffering.withdrawProvidedETH()
            const contractBalance = await web3.eth
                .getBalance(InitialOffering.address)
                .then(x => x.toString())
            assert.equal(contractBalance, "0")

            await InitialOffering.withdrawHEGIC().then(
                () => assert.faild("HEGIC was withdrawn"),
                x => assert.equal(x.reason, "The required amount has been provided!")
            )
        } finally {
            await revert(lastSnapshot)
        }
    })

    it("Should claim ETH after the offering (was provided less than necessary)", async () => {
        lastSnapshot = await snapshot()
        try {
            const {InitialOffering, HEGIC} = await contract
            const start = await InitialOffering.START()
            const delta = parseInt(start - Date.now() / 1000) + 1

            const startBalance = await Promise.all([
                HEGIC.balanceOf(user1).then(toBN),
                HEGIC.balanceOf(user2).then(toBN),
                HEGIC.balanceOf(user3).then(toBN),
                HEGIC.balanceOf(user4).then(toBN),
            ])

            await timeTravel(delta)
            await InitialOffering.sendTransaction({value:toWei(10), from:user1})
            await InitialOffering.sendTransaction({value:toWei(20), from:user2})
            await InitialOffering.sendTransaction({value:toWei(5), from:user4})
            await InitialOffering.sendTransaction({value:toWei(10), from:user2})
            await InitialOffering.sendTransaction({value:toWei(20), from:user3})
            await timeTravel(3 * 24 * 3600 + 1)
            await InitialOffering.claim({from: user1})
            await InitialOffering.claim({from: user2})
            await InitialOffering.claim({from: user3})
            await InitialOffering.claim({from: user4})


            const deltaBalance = await Promise.all([
                HEGIC.balanceOf(user1).then(toBN),
                HEGIC.balanceOf(user2).then(toBN),
                HEGIC.balanceOf(user3).then(toBN),
                HEGIC.balanceOf(user4).then(toBN),
            ]).then(x => x.map((x,i) => x.sub(startBalance[0]).toString()))
            assert.equal(deltaBalance[0], "0")
            assert.equal(deltaBalance[1], "0")
            assert.equal(deltaBalance[2], "0")
            assert.equal(deltaBalance[3], "0")

            await InitialOffering.withdrawHEGIC()
            const contractBalance = await HEGIC
                .balanceOf(InitialOffering.address)
                .then(x => x.toString())
            assert.equal(contractBalance, "0")

            await InitialOffering.withdrawProvidedETH().then(
                () => assert.faild("ETH was withdrawn"),
                x => assert.equal(x.reason, "The required amount has not been provided!")
            )
        } finally {
            await revert(lastSnapshot)
        }
    })

    it("Should withdrawUnclaimedHEGIC only after 30 days after the end", async () => {
        lastSnapshot = await snapshot()
        try {
            const {InitialOffering, HEGIC} = await contract
            const start = await InitialOffering.START()
            const delta = parseInt(start - Date.now() / 1000) + 1

            await InitialOffering.withdrawUnclaimedHEGIC().then(
                () => assert.fail("Unclaimed HEGIC was withdrawn too early"),
                x => assert.equal(x.reason, "Withdrawal unavailable yet")
            )

            await timeTravel(delta)
            await InitialOffering.withdrawUnclaimedHEGIC().then(
                () => assert.fail("Unclaimed HEGIC was withdrawn too early"),
                x => assert.equal(x.reason, "Withdrawal unavailable yet")
            )

            await timeTravel(3 * 24 * 3600 + 1)
            await InitialOffering.withdrawUnclaimedHEGIC().then(
                () => assert.fail("Unclaimed HEGIC was withdrawn too early"),
                x => assert.equal(x.reason, "Withdrawal unavailable yet")
            )
            await timeTravel(30 * 24 * 3600)
            await InitialOffering.withdrawUnclaimedHEGIC()
        } finally {
            await revert(lastSnapshot)
        }
    })
})
