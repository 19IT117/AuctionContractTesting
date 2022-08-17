const BlindAuction = artifacts.require("SimpleAuction");
const { assert } = require("chai");

const truffleAssert = require('truffle-assert');

contract('Blind Auction ', async (accounts) => {

  var contractInstance;
  currenttimestamp = Date.now();
  before(async () => {
    contractInstance = await BlindAuction.deployed();
  });

  it('should be deployed', async () => {
    assert(contractInstance.address != '');
  });

  it('checking initial values', async () => {
    const owner = await contractInstance.owner();
    const endTime = await contractInstance.endTime();
    const highestBid = await contractInstance.highestBid();
    assert(owner == accounts[0]);
    assert(highestBid == 10);
  });

  it('bidding low amount', async () => {

    await truffleAssert.reverts(
      contractInstance.bid({ value: 10 }),
      'low bid'
    )
  });

  it('bidding high amount', async () => {
    const highestBid = await contractInstance.highestBid();
    await contractInstance.bid({ value: parseInt(highestBid) + 1 }).then(async (result) => {
      assert(result.logs[0].event == 'NewBid');
      assert(result.logs[0].args[0] == accounts[0]);
      assert(result.logs[0].args[1] == 11);
    });
    const currentDeposit = await contractInstance.buyers.call(accounts[0]);
    const winner = await contractInstance.winner();
    assert(winner == accounts[0] && currentDeposit == 11);
    // console.log(bid.toNumber());
  });

  it('Adding second bid', async () => {
    await contractInstance.bid({
      from: accounts[1],
      value: 12
    }).then(async (result) => {
      assert(result.logs[0].event == 'NewBid');
      assert(result.logs[0].args[0] == accounts[1]);
      assert(result.logs[0].args[1] == 12);
    });
    const currentDeposit = await contractInstance.buyers.call(accounts[1]);
    const winner = await contractInstance.winner();
    assert(winner == accounts[1] && currentDeposit == 12);
  });

  it('Adding third bid', async () => {
    const highestBid = await contractInstance.highestBid();
    await contractInstance.bid({ value: 13 }).then(async (result) => {
      assert(result.logs[0].event == 'NewBid');
      assert(result.logs[0].args[0] == accounts[0]);
      assert(result.logs[0].args[1] == 13);
    });
    const currentDeposit = await contractInstance.buyers.call(accounts[0]);
    const winner = await contractInstance.winner();
    assert(winner == accounts[0] && currentDeposit == 24);
  });
  it('checking balance of the contract', async () => {
    const ContractBalance = await contractInstance.balanceOfContract();
    assert(ContractBalance == 36);
  });


  it('Adding forth bid', async () => {

    await contractInstance.bid({
      from: accounts[2],
      value: 70
    }).then(async (result) => {
      assert(result.logs[0].event == 'NewBid');
      assert(result.logs[0].args[0] == accounts[2]);
      assert(result.logs[0].args[1] == 70);
    });
    const currentDeposit = await contractInstance.buyers.call(accounts[2]);
    const winner = await contractInstance.winner();
    assert(winner == accounts[2] && currentDeposit == 70);

  });
  it('claiming before auction ends', async () => {
    await contractInstance.claim({
      from: accounts[1]
    }).then(async (result) => {
      assert(result.logs[0].event == 'Claimed');
      // console.log(result.logs[0].args);
      assert(result.logs[0].args[0] == accounts[1]);
      assert(result.logs[0].args[1] == 12);
    });
  });

  it('Adding fifth bid ', async () => {

    await contractInstance.bid({
      from: accounts[1],
      value: 100
    }).then(async (result) => {
      assert(result.logs[0].event == 'NewBid');
      assert(result.logs[0].args[0] == accounts[1]);
      assert(result.logs[0].args[1] == 100);
    });
    const currentDeposit = await contractInstance.buyers.call(accounts[1]);
    const winner = await contractInstance.winner();
    assert(winner == accounts[1] && currentDeposit == 100);
  });

  it('Adding sixth bid ', async () => {

    await contractInstance.bid({
      from: accounts[2],
      value: 300
    }).then(async (result) => {
      assert(result.logs[0].event == 'NewBid');
      assert(result.logs[0].args[0] == accounts[2]);
      assert(result.logs[0].args[1] == 300);
    });
    const currentDeposit = await contractInstance.buyers.call(accounts[2]);
    const winner = await contractInstance.winner();
    assert(winner == accounts[2] && currentDeposit == 370);
  });
  it('withdrawing auction amount before auction ends', async () => {
    await truffleAssert.reverts(
      contractInstance.withdrawAll({ from: accounts[0] }),
      "auction is still ongoing"
    )
  });
  function timer() {

    timeout = false;
    while (!timeout) {
      if (Date.now() >= currenttimestamp + 6000) {
        timeout = true;
      }
    }
  }

  it('bid after auction ends', async function () {
    await timer();
    await truffleAssert.reverts(
      contractInstance.bid({ value: 100 }),
      'auction closed'
    );
  });

  it('bid again', async () => {
    await truffleAssert.reverts(
      contractInstance.bid({
        from: accounts[2],
        value: 100
      }),
      'auction closed'
    );
  });

  it('checking winner details and balance of contract', async () => {
    const winner = await contractInstance.winner();
    const highestBid = await contractInstance.highestBid();
    assert(winner == accounts[2]);
    assert(highestBid == 300);
    const balance = await contractInstance.balanceOfContract();
    assert(balance == 494);
  });

  it('claiming from account 0 and 1 ', async () => {
    await contractInstance.claim({
      from: accounts[0]
    }).then(async (result) => {
      assert(result.logs[0].event == 'Claimed');
      // console.log(result.logs[0].args);
      assert(result.logs[0].args[0] == accounts[0]);
      assert(result.logs[0].args[1] == 24);
    });
    await contractInstance.claim({
      from: accounts[1]
    }).then(async (result) => {
      console.log
      assert(result.logs[0].event == 'Claimed');
      //console.log(result.logs[0].args);
      assert(result.logs[0].args[0] == accounts[1]);
      assert(result.logs[0].args[1] == 100);
    });

    const balance = await contractInstance.balanceOfContract();
    // console.log(balance);
    assert(balance == 370);
  });

  it('claiming amount form non-bidder account', async () => {
    await truffleAssert.reverts(
      contractInstance.claim({
        from: accounts[5]
      }),
      "you must be buyer"
    );
  });

  it('withdrawing auction amount', async () => {
    await contractInstance.withdrawAll({ from: accounts[0] });
    const balance = await contractInstance.balanceOfContract();
    // console.log(balance.toNumber());
    assert(balance == 70);
  });

  it('withdrawing auction amount again', async () => {
    await truffleAssert.reverts(
      contractInstance.withdrawAll({ from: accounts[0] }),
      "only owner allowed"
    )
  });

  it('claiming from winner', async () => {
    await contractInstance.claim({
      from: accounts[2]
    }).then(async (result) => {
      assert(result.logs[0].event == 'Claimed');
      assert(result.logs[0].args[0] == accounts[2]);
      assert(result.logs[0].args[1] == 70);
    });
    const balance = await contractInstance.balanceOfContract();
    assert(balance == 0);
  });

  it('claiming after already claimed', async () => {
    await truffleAssert.reverts(
      contractInstance.claim({
        from: accounts[5]
      }),
      "you must be buyer"
    );
  })
});