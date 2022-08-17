const BlindAuction = artifacts.require("SimpleAuction");

module.exports = function (deployer) {
  deployer.deploy(BlindAuction, 6,10);
};
