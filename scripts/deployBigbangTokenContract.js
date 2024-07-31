const { Web3 } = require('web3');
const artifacts = require('../artifacts/contracts/BigbangTokenContract.sol/BigbangToken.json');

async function main() {
    const web3 = new Web3(process.env.RPC_URL);
    const deployer = web3.eth.accounts.privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);

    const bigbangTokenContract = new web3.eth.Contract(artifacts.abi);
    const rawContract = bigbangTokenContract.deploy({
        data: artifacts.bytecode,
        arguments: [
            process.env.LENDING_CONTRACT_ADDR, // service contarct addr
            10_000_000_000 // total supply
        ]
    });

    const gas = await rawContract.estimateGas({from: deployer.address});
    const gasPrice = await web3.eth.getGasPrice();

    const tx = {
        from: deployer.address,
        data: rawContract.encodeABI(),
        gas,
        gasPrice
    };

    const signedTx = web3.eth.accounts.signTransaction(tx, privateKey);

    web3.eth.sendSignedTransaction((await signedTx).rawTransaction)
    .on('receipt', receipt => {
        console.log('Contract address : ' + receipt.contractAddress);
    })
    .on('error', err => {
        console.log('Error deploying contract : ' + err);
    });
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
