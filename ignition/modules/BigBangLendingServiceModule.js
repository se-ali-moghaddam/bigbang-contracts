const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');
const { web3 } = require('hardhat');

module.exports = buildModule('BigbangLendingServiceModule', m => {
    const { networkCoinPriceFeed, ownerFeePercent, voteFee, lendingLimitationPercent, lowestPrice, highestPrice, loanDuration }
        = {
        networkCoinPriceFeed: '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada',
        ownerFeePercent: 38,
        voteFee: web3.utils.toWei(1, 'ether'),
        lendingLimitationPercent: 90,
        lowestPrice: web3.utils.toWei(800, 'ether'),
        highestPrice: web3.utils.toWei(1000, 'ether'),
        loanDuration: 30
    };

    const bigbangLendingService = m.contract('BigbangLendingContract',
        [
            networkCoinPriceFeed,
            ownerFeePercent,
            voteFee,
            lendingLimitationPercent,
            lowestPrice,
            highestPrice,
            loanDuration
        ]);

    return {
        bigbangLendingService
    };
});