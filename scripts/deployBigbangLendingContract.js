const { Web3 } = require('web3');
const artifacts = require('../artifacts/contracts/BigbangLendingContract.sol/BigbangLendingContract.json');

async function main() {
    const web3 = new Web3(process.env.RPC_URL);
    const deployer = web3.eth.accounts.privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);

    try {
        const bigbangLendingContract = new web3.eth.Contract(artifacts.abi);
        const rawContract = bigbangLendingContract.deploy({
            data: artifacts.bytecode,
            arguments: [
                process.env.NETWORK_COIN_PRICE_FEED, // networkCoinPriceFeed
                38, // ownerFeePercent
                web3.utils.toWei('1', 'ether'), // voteFee
                90, // lendingLimitationPercent
                web3.utils.toWei('800', 'ether'), // lowestPrice
                web3.utils.toWei('1000', 'ether'), // highestPrice
                30, // loanDuration
            ]
        });

        const gas = await rawContract.estimateGas({ from: deployer.address });
        const gasPrice = await web3.eth.getGasPrice();

        const tx = {
            from: deployer.address,
            data: rawContract.encodeABI(),
            gas,
            gasPrice
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log('Contract address : ' + receipt.contractAddress);
    }
    catch(err) {
        console.log('Error deploying contract : ' + err);
        throw err;
    }
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
