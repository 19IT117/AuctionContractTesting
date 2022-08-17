// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract SimpleAuction {
    address public owner;
    address public winner;
    uint256 public highestBid;
    uint256 public endTime;
    mapping(address => uint256) public buyers;

    event Claimed(address _to, uint256 _amount);
    event NewBid(address _bidder, uint256 _bid);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner allowed");
        _;
    }

  
    constructor(uint256 _duration, uint256 _startingPrice) {
        owner = msg.sender;
        endTime = block.timestamp + _duration;
        highestBid = _startingPrice;
    }

    function bid() external payable {
        require(block.timestamp < endTime, "auction closed");
        require(msg.value > highestBid, "low bid");
        highestBid = msg.value;
        buyers[msg.sender] += msg.value;
        winner = msg.sender;
        emit NewBid(msg.sender, msg.value);
    }

    function claim() public {
        require(buyers[msg.sender] != 0, "you must be buyer");
        if (msg.sender == winner) {
            require((buyers[msg.sender] - highestBid) > 0, "nothing to claim");
            payable(msg.sender).transfer(buyers[msg.sender] - highestBid);
            emit Claimed(msg.sender, (buyers[msg.sender] - highestBid));
            buyers[msg.sender] = highestBid;
        } else {
            payable(msg.sender).transfer(buyers[msg.sender]);
            emit Claimed(msg.sender, (buyers[msg.sender]));
            buyers[msg.sender] = 0;
        }
    }

    function withdrawAll() external onlyOwner {
        require(block.timestamp > endTime, "auction is still ongoing");
        require(highestBid > 0, "no one set a bid");
        payable(owner).transfer(highestBid);
        delete owner;
    }

    function balanceOfContract() public view returns (uint256) {
        return address(this).balance;
    }
}
