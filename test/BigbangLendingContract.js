const chai = require('chai');
const { Web3 } = require('web3');
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const lendingContractArtifacts = require('../artifacts/contracts/BigbangLendingContract.sol/BigbangLendingContract.json');
const tokenContractArtifacts = require('../artifacts/contracts/BigbangTokenContract.sol/BigbangToken.json');
const { describe } = require('mocha');

(async () => {
    const chaiAsPromised = await import('chai-as-promised');
    chai.use(chaiAsPromised.default);
})();

const { expect } = chai;

describe('BigangLendingContract', () => {
    const deployBigbangLendingServiceFixture = async function () {
        const web3 = new Web3(process.env.RPC_URL);

        const { deployer, contractAddress, networkCoinPriceFeed, ownerFeePercent, voteFee, lendingLimitationPercent, lowestPrice, highestPrice, loanDuration } = {
            deployer: web3.eth.accounts.privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY),
            contractAddress: process.env.LENDING_CONTRACT_ADDR,
            networkCoinPriceFeed: process.env.NETWORK_COIN_PRICE_FEED,
            ownerFeePercent: 38,
            voteFee: web3.utils.toWei(1, 'ether'),
            lendingLimitationPercent: 90,
            lowestPrice: web3.utils.toWei(800, 'ether'),
            highestPrice: web3.utils.toWei(1000, 'ether'),
            loanDuration: 30
        };

        const bigbangLendingContract = new web3.eth.Contract(lendingContractArtifacts.abi, contractAddress);

        return {
            web3,
            bigbangLendingContract,
            deployer,
            contractAddress,
            networkCoinPriceFeed,
            ownerFeePercent,
            voteFee,
            lendingLimitationPercent,
            lowestPrice,
            highestPrice,
            loanDuration
        };
    }

    // describe('Deployment and General Tests', () => {
    //     it('Should deployment successful', async () => {
    //         const { bigbangLendingContract, contractAddress } = await loadFixture(deployBigbangLendingServiceFixture);

    //         expect(bigbangLendingContract.options.address.toLocaleLowerCase()).to.equal(contractAddress);
    //     });

    //     it('Should set the right voteFee', async () => {
    //         const { bigbangLendingContract, voteFee } = await loadFixture(deployBigbangLendingServiceFixture);

    //         expect(await bigbangLendingContract.methods.getVoteFee().call()).to.equal(voteFee);
    //     });

    //     it('Should to be the lendingLimitationPercent less than 100', async () => {
    //         const { bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //         expect(await bigbangLendingContract.methods.getLendingLimitationPercent().call()).to.be.lessThan(100);
    //     });

    //     it('Should set the right lendingLimitationPercent', async () => {
    //         const { bigbangLendingContract, lendingLimitationPercent } = await loadFixture(deployBigbangLendingServiceFixture);

    //         expect(await bigbangLendingContract.methods.getLendingLimitationPercent().call()).to.equal(lendingLimitationPercent);
    //     });

    //     it('Should set the right loanDuration', async () => {
    //         const { bigbangLendingContract, loanDuration } = await loadFixture(deployBigbangLendingServiceFixture);

    //         expect(await bigbangLendingContract.methods.getLoanDuration().call()).to.equal(loanDuration);
    //     });

    //     it('Should set new lending limitation percent successfully', async () => {
    //         const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //         try {
    //             const txData = bigbangLendingContract.methods.setLendingLimitationPercent(
    //                 80
    //             ).encodeABI();

    //             const gasEstimate = await bigbangLendingContract.methods.setLendingLimitationPercent(
    //                 80
    //             ).estimateGas({ from: deployer.address });

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: gasEstimate,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //             const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //             expect(receipt.status).to.equal(1n);

    //         } catch (error) {
    //             console.error("Error: ", error);
    //             throw error;
    //         }
    //     });

    //     it('Should reverted by InvalidLendingLimitationPercent', async () => {
    //         const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //         const txData = bigbangLendingContract.methods.setLendingLimitationPercent(
    //             0
    //         ).encodeABI();

    //         const gasPrice = await web3.eth.getGasPrice();

    //         const tx = {
    //             from: deployer.address,
    //             to: bigbangLendingContract.options.address,
    //             data: txData,
    //             gas: 3000000,
    //             gasPrice: gasPrice
    //         };

    //         const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //         await expect(
    //             web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //         ).to.be.rejectedWith(Error).then((error) => {
    //             expect(error.reason).to.equal('execution reverted');
    //         });
    //     });

    //     it('Should set new Loan duration percent successfully', async () => {
    //         const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //         try {
    //             const txData = bigbangLendingContract.methods.setLoanDuration(
    //                 60
    //             ).encodeABI();

    //             const gasEstimate = await bigbangLendingContract.methods.setLoanDuration(
    //                 60
    //             ).estimateGas({ from: deployer.address });

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: gasEstimate,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //             const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //             expect(receipt.status).to.equal(1n);

    //         } catch (error) {
    //             console.error("Error: ", error);
    //             throw error;
    //         }
    //     });

    //     it('Should reverted by InvalidLoanDuration', async () => {
    //         const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //         const txData = bigbangLendingContract.methods.setLoanDuration(
    //             29
    //         ).encodeABI();

    //         const gasPrice = await web3.eth.getGasPrice();

    //         const tx = {
    //             from: deployer.address,
    //             to: bigbangLendingContract.options.address,
    //             data: txData,
    //             gas: 3000000,
    //             gasPrice: gasPrice
    //         };

    //         const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //         await expect(
    //             web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //         ).to.be.rejectedWith(Error).then((error) => {
    //             expect(error.reason).to.equal('execution reverted');
    //         });
    //     });
    // });

    // describe('Token Managemant', () => {
    //     describe('addToken', () => {
    //         it('Should add token successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             try {

    //                 const txData = bigbangLendingContract.methods.addToken(
    //                     process.env.BTC_ADDR,
    //                     process.env.BTC_PRICE_FEED
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.addToken(
    //                     process.env.BTC_ADDR,
    //                     process.env.BTC_PRICE_FEED
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });

    //         it('Should revert if the token is already added', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.addToken(
    //                 process.env.BTC_ADDR,
    //                 process.env.BTC_PRICE_FEED
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted: Token already added');
    //             });
    //         });

    //         it('Should revert if the executer have not access', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.addToken(
    //                 process.env.BTC_ADDR,
    //                 process.env.BTC_PRICE_FEED
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should revert if the token address is not vaild', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.addToken(
    //                 '0x0000000000000000000000000000000000000000',
    //                 process.env.BTC_PRICE_FEED
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should revert if the price feed address is not vaild', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.addToken(
    //                 process.env.BTC_ADDR,
    //                 '0x0000000000000000000000000000000000000000'
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });
    //     });

    //     describe('removeToken', () => {
    //         it('Should remove token successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             try {

    //                 const txData = bigbangLendingContract.methods.removeToken(
    //                     process.env.BTC_ADDR
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.removeToken(
    //                     process.env.BTC_ADDR
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });

    //         it('Should revert if the executer have not access', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.removeToken(
    //                 process.env.BTC_ADDR
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should revert if the token is not supported', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.removeToken(
    //                 process.env.BTC_ADDR
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });
    //     });

    //     describe('changeTokenPriceFeed', () => {
    //         it('Should change token price feed successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             try {

    //                 const txData = bigbangLendingContract.methods.changeTokenPriceFeed(
    //                     process.env.BTC_ADDR,
    //                     process.env.BTC_PRICE_FEED
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.changeTokenPriceFeed(
    //                     process.env.BTC_ADDR,
    //                     process.env.BTC_PRICE_FEED
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });

    //         it('Should revert if the price feed address is not vaild', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.changeTokenPriceFeed(
    //                 process.env.BTC_ADDR,
    //                 '0x0000000000000000000000000000000000000000'
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should revert if the executer have not access', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.changeTokenPriceFeed(
    //                 process.env.BTC_ADDR,
    //                 process.env.BTC_PRICE_FEED
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should revert if the token is not supported', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.changeTokenPriceFeed(
    //                 process.env.BTC_ADDR,
    //                 process.env.BTC_PRICE_FEED
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });
    //     });

    //     describe('setNativeToken', () => {
    //         it('Should set native token successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             try {

    //                 const txData = bigbangLendingContract.methods.setNativeToken(
    //                     process.env.BGBT_ADDR
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.setNativeToken(
    //                     process.env.BGBT_ADDR
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });

    //         it('Should revert if the token address is not vaild', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setNativeToken(
    //                 '0x0000000000000000000000000000000000000000'
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should revert if the executer have not access', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setNativeToken(
    //                 process.env.BGBT_ADDR
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });
    //     });
    // });

    // describe('Role Management', () => {
    //     describe('assignRole', () => {
    //         it('Should assign role successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const ROLE = web3.utils.keccak256('AUTHORIZED_CONTRACT_ROLE');

    //             try {
    //                 const txData = bigbangLendingContract.methods.assignRole(
    //                     ROLE,
    //                     deployer.address
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.assignRole(
    //                     ROLE,
    //                     deployer.address
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);
    //                 expect(await bigbangLendingContract.methods.hasRole(
    //                     ROLE,
    //                     deployer.address
    //                 ).call()).to.equal(true);

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });

    //         it('Should reverted by reassign the role', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const ROLE = web3.utils.keccak256('AUTHORIZED_CONTRACT_ROLE');

    //             const txData = bigbangLendingContract.methods.assignRole(
    //                 ROLE,
    //                 deployer.address
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted: Role already assigned');
    //             });
    //         });

    //         it('Should revert if the executer have not access', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const ROLE = web3.utils.keccak256('AUTHORIZED_CONTRACT_ROLE');

    //             const txData = bigbangLendingContract.methods.assignRole(
    //                 ROLE,
    //                 deployer.address
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });
    //     });

    //     describe('unassignRole', () => {
    //         it('Should unassign role successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const ROLE = web3.utils.keccak256('AUTHORIZED_CONTRACT_ROLE');

    //             try {
    //                 const txData = bigbangLendingContract.methods.unassignRole(
    //                     ROLE,
    //                     deployer.address
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.unassignRole(
    //                     ROLE,
    //                     deployer.address
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);
    //                 expect(await bigbangLendingContract.methods.hasRole(
    //                     ROLE,
    //                     deployer.address
    //                 ).call()).to.equal(false);

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });

    //         it('Should reverted by Role not assigned', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const ROLE = web3.utils.keccak256('AUTHORIZED_CONTRACT_ROLE');

    //             const txData = bigbangLendingContract.methods.unassignRole(
    //                 ROLE,
    //                 deployer.address
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted: Role not assigned');
    //             });
    //         });

    //         it('Should revert if the executer have not access', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const ROLE = web3.utils.keccak256('AUTHORIZED_CONTRACT_ROLE');

    //             const txData = bigbangLendingContract.methods.unassignRole(
    //                 ROLE,
    //                 deployer.address
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });
    //     });
    // });

    // describe('Ownership Management', () => {
    //     describe('transferOwnership', () => {
    //         it('Should set pending owner successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             try {
    //                 const txData = bigbangLendingContract.methods.transferOwnership(
    //                     deployer.address
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.transferOwnership(
    //                     deployer.address
    //                 ).estimateGas({ from: process.env.PENDING_OWNER_ADDR });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: process.env.PENDING_OWNER_ADDR,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.PENDING_OWNER_PRIVATE_KEY);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });

    //         it('Should revert if the executer have not access', async () => {
    //             const { bigbangLendingContract, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.transferOwnership(
    //                 process.env.PENDING_OWNER_ADDR
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: process.env.PENDING_OWNER_ADDR,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.PENDING_OWNER_PRIVATE_KEY);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });
    //     });

    //     describe('confirmOwnership', () => {
    //         it('Should confirm ownership successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             try {
    //                 const txData = bigbangLendingContract.methods.confirmOwnership().encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.confirmOwnership()
    //                     .estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });

    //         it('Should chnage owner successfully', async () => {
    //             const { bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.owner().call()).to.equal(deployer.address);
    //         });

    //         it('Should set roles to the new owner', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.hasRole(
    //                 web3.utils.keccak256('DEFAULT_ADMIN_ROLE'),
    //                 deployer.address
    //             ).call()).to.equal(true);

    //             expect(await bigbangLendingContract.methods.hasRole(
    //                 web3.utils.keccak256('ACCESS_MANAGER_ROLE'),
    //                 deployer.address
    //             ).call()).to.equal(true);

    //             expect(await bigbangLendingContract.methods.hasRole(
    //                 web3.utils.keccak256('DATA_MANAGER_ROLE'),
    //                 deployer.address
    //             ).call()).to.equal(true);
    //         });

    //         it('Should revoke the roles to the previous owner', async () => {
    //             const { web3, bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.hasRole(
    //                 web3.utils.keccak256('DEFAULT_ADMIN_ROLE'),
    //                 process.env.PENDING_OWNER_ADDR
    //             ).call()).to.equal(false);

    //             expect(await bigbangLendingContract.methods.hasRole(
    //                 web3.utils.keccak256('ACCESS_MANAGER_ROLE'),
    //                 process.env.PENDING_OWNER_ADDR
    //             ).call()).to.equal(false);

    //             expect(await bigbangLendingContract.methods.hasRole(
    //                 web3.utils.keccak256('DATA_MANAGER_ROLE'),
    //                 process.env.PENDING_OWNER_ADDR
    //             ).call()).to.equal(false);
    //         });

    //         it('Should revert when the executer is not the pending owner', async () => {
    //             const { bigbangLendingContract, deployer, web3 } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.confirmOwnership().encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });
    //     });
    // });

    // describe('Data Management', () => {
    //     describe('setBusinessLogicData', () => {
    //         it('Should to set business logic data successfully', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             try {
    //                 const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                     ownerFeePercent,
    //                     voteFee,
    //                     lendingLimitationPercent,
    //                     lowestPrice,
    //                     highestPrice,
    //                     loanDuration
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.setBusinessLogicData(
    //                     ownerFeePercent,
    //                     voteFee,
    //                     lendingLimitationPercent,
    //                     lowestPrice,
    //                     highestPrice,
    //                     loanDuration
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });

    //         it('Should reverted by owner fee percent must be between 1 and 100 !', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 101,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted: owner fee percent must be between 1 and 100 !');
    //             });
    //         });

    //         it('Should reverted by owner fee percent must be between 1 and 100 !', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 0,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted: owner fee percent must be between 1 and 100 !');
    //             });
    //         });

    //         it('Should reverted by Vote fee must be greater than zero !', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 ownerFeePercent,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 ownerFeePercent,
    //                 0,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted: Vote fee must be greater than zero !');
    //             });
    //         });

    //         it('Should reverted by InvalidLendingLimitationPercent', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 ownerFeePercent,
    //                 voteFee,
    //                 0,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should reverted by InvalidLendingLimitationPercent', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 ownerFeePercent,
    //                 voteFee,
    //                 101,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should reverted by Lowest price must be between zero and highest price !', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 highestPrice,
    //                 loanDuration
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 0,
    //                 highestPrice,
    //                 loanDuration
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted: Lowest price must be between zero and highest price !');
    //             });
    //         });

    //         it('Should reverted by Lowest price must be between zero and highest price !', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice + highestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted: Lowest price must be between zero and highest price !');
    //             });
    //         });

    //         it('Should reverted by InvalidLoanDuration', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 29
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should reverted by InvalidLoanDuration', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 61
    //             ).encodeABI();

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: 3000000,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });

    //         it('Should revert when executer have not access', async () => {
    //             const {
    //                 web3,
    //                 bigbangLendingContract,
    //                 deployer,
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             } = await loadFixture(deployBigbangLendingServiceFixture);

    //             const txData = bigbangLendingContract.methods.setBusinessLogicData(
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             ).encodeABI();

    //             const gasEstimate = await bigbangLendingContract.methods.setBusinessLogicData(
    //                 ownerFeePercent,
    //                 voteFee,
    //                 lendingLimitationPercent,
    //                 lowestPrice,
    //                 highestPrice,
    //                 loanDuration
    //             ).estimateGas({ from: deployer.address });

    //             const gasPrice = await web3.eth.getGasPrice();

    //             const tx = {
    //                 from: deployer.address,
    //                 to: bigbangLendingContract.options.address,
    //                 data: txData,
    //                 gas: gasEstimate,
    //                 gasPrice: gasPrice
    //             };

    //             const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);

    //             await expect(
    //                 web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    //             ).to.be.rejectedWith(Error).then((error) => {
    //                 expect(error.reason).to.equal('execution reverted');
    //             });
    //         });
    //     });

    //     describe('getContractBalance', () => {
    //         it('Should get the right contract BGBT balance', async () => {
    //             const { web3, bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.getContractBalance(process.env.BGBT_ADDR)
    //                 .call()).to.be.equal(web3.utils.toWei('10000000000', 'ether'));
    //         });

    //         it('Should get the right contract BNB balance', async () => {
    //             const { contractAddress, bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.getContractBalance(contractAddress)
    //                 .call()).to.be.equal(0);
    //         });

    //         it('Should get the right contract Token balance', async () => {
    //             const { bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.getContractBalance('0x157ee9d5c45588b6ea9bdc0dc556b3e5042e2e33')
    //                 .call()).to.be.equal(0);
    //         });

    //         it('Should revert with Custom Error : NotSupportedToken', async () => {
    //             const { bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             await expect(bigbangLendingContract.methods.getContractBalance('0x0000000000000000000000000000000000000000')
    //                 .call()).to.be.rejectedWith(Error);
    //         });

    //         it('Should revert with Custom Error : NotSupportedToken', async () => {
    //             const { bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             await expect(bigbangLendingContract.methods.getContractBalance('0x64cea995f784a8a7bd92160d05dec92edbf8f186')
    //                 .call()).to.be.rejectedWith(Error);
    //         });
    //     });

    //     describe('fetchLatestPrice', () => {
    //         it('Should fetch right BNB latest price successfully', async () => {
    //             const { web3, bigbangLendingContract, contractAddress } = await loadFixture(deployBigbangLendingServiceFixture);
    //             let price = await bigbangLendingContract.methods.fetchLatestPrice(contractAddress).call();
    //             console.log(web3.utils.fromWei(price, 'ether'));

    //             expect(price).not.to.be.equal(0);
    //         });

    //         it('Should revert with Error by using an not supported token', async () => {
    //             const { bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             await expect(bigbangLendingContract.methods.fetchLatestPrice('0x64cea995f784a8a7bd92160d05dec92edbf8f186')
    //                 .call()).to.be.rejectedWith(Error);
    //         });
    //     });

    //     describe('State data', () => {
    //         it('Should get right loans total count', async () => {
    //             const { bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.getLoansTotalCount().call()).to.be.equal(0);
    //         });

    //         it('Should get right tokens total count', async () => {
    //             const { bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.getTokensTotalCount().call()).to.be.equal(1);
    //         });

    //         it('Should get right used bigbangs total amount', async () => {
    //             const { bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.getUsedBigbangsTotalAmount().call()).to.be.equal(0);
    //         });

    //         it('Should get right assets total value', async () => {
    //             const { bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.getAssetsTotalValue().call()).to.be.equal(0);
    //         });

    //         it('Should get right BGBT price', async () => {
    //             const { web3, bigbangLendingContract } = await loadFixture(deployBigbangLendingServiceFixture);

    //             expect(await bigbangLendingContract.methods.estimateBigbangPrice().call())
    //                 .to.be.equal(web3.utils.toWei(0.1, 'ether'));
    //         });
    //     });
    // });

    // describe('Lending proccess', () => {
    //     describe('borrow', () => {
    //         it('Sender allow contract', async () => {
    //             const { web3, deployer, contractAddress } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const bigbangTokenContract = new web3.eth.Contract(tokenContractArtifacts.abi, process.env.BTC_ADDR);
    //             const amount = web3.utils.toWei(10000000000, 'ether');

    //             try {
    //                 const txData = bigbangTokenContract.methods.approve(
    //                     deployer.address,
    //                     contractAddress,
    //                     amount
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangTokenContract.methods.approve(
    //                     deployer.address,
    //                     contractAddress,
    //                     amount
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangTokenContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);
    //                 console.log(await bigbangTokenContract.methods.allowance(deployer.address, contractAddress).call());

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }

    //         });

    //         it('Contract allow contract', async () => {
    //             const { web3, deployer, contractAddress } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const bigbangTokenContract = new web3.eth.Contract(tokenContractArtifacts.abi, process.env.BGBT_ADDR);
    //             const amount = web3.utils.toWei(10000000000, 'ether');

    //             try {
    //                 const txData = bigbangTokenContract.methods.approve(
    //                     contractAddress,
    //                     contractAddress,
    //                     amount
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangTokenContract.methods.approve(
    //                     contractAddress,
    //                     contractAddress,
    //                     amount
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangTokenContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);
    //                 console.log(await bigbangTokenContract.methods.allowance(contractAddress, contractAddress).call());

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }

    //         });

    //         it('Should getting loan successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             try {
    //                 const txData = bigbangLendingContract.methods.borrow(
    //                     process.env.BTC_ADDR,
    //                     web3.utils.toWei(100, 'ether')
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.borrow(
    //                     process.env.BTC_ADDR,
    //                     web3.utils.toWei(100, 'ether')
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);

    //                 console.log(await bigbangLendingContract.methods.getLoanData(
    //                     deployer.address,
    //                     process.env.BTC_ADDR
    //                 ).call());

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });
    //     });

    //     describe('repay', () => {
    //         it('Sender allow contract', async () => {
    //             const { web3, deployer, contractAddress } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const bigbangTokenContract = new web3.eth.Contract(tokenContractArtifacts.abi, process.env.BGBT_ADDR);
    //             const amount = web3.utils.toWei(10000000000, 'ether');

    //             try {
    //                 const txData = bigbangTokenContract.methods.approve(
    //                     deployer.address,
    //                     contractAddress,
    //                     amount
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangTokenContract.methods.approve(
    //                     deployer.address,
    //                     contractAddress,
    //                     amount
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangTokenContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);
    //                 console.log(await bigbangTokenContract.methods.allowance(deployer.address, contractAddress).call());

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }

    //         });

    //         it('Contract allow contract', async () => {
    //             const { web3, deployer, contractAddress } = await loadFixture(deployBigbangLendingServiceFixture);
    //             const bigbangTokenContract = new web3.eth.Contract(tokenContractArtifacts.abi, process.env.BTC_ADDR);
    //             const amount = web3.utils.toWei(10000000000, 'ether');

    //             try {
    //                 const txData = bigbangTokenContract.methods.approve(
    //                     contractAddress,
    //                     contractAddress,
    //                     amount
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangTokenContract.methods.approve(
    //                     contractAddress,
    //                     contractAddress,
    //                     amount
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangTokenContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);
    //                 console.log(await bigbangTokenContract.methods.allowance(contractAddress, contractAddress).call());

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }

    //         });

    //         it('Should repying loan successfully', async () => {
    //             const { web3, bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //             console.log(await bigbangLendingContract.methods.getLoanData(
    //                 deployer.address,
    //                 process.env.BTC_ADDR
    //             ).call());

    //             try {
    //                 const txData = bigbangLendingContract.methods.repay(
    //                     process.env.BTC_ADDR,
    //                     deployer.address,
    //                     web3.utils.toWei(50_000_000, 'ether')
    //                 ).encodeABI();

    //                 const gasEstimate = await bigbangLendingContract.methods.repay(
    //                     process.env.BTC_ADDR,
    //                     deployer.address,
    //                     web3.utils.toWei(50_000_000, 'ether')
    //                 ).estimateGas({ from: deployer.address });

    //                 const gasPrice = await web3.eth.getGasPrice();

    //                 const tx = {
    //                     from: deployer.address,
    //                     to: bigbangLendingContract.options.address,
    //                     data: txData,
    //                     gas: gasEstimate,
    //                     gasPrice: gasPrice
    //                 };

    //                 const signedTx = await web3.eth.accounts.signTransaction(tx, deployer.privateKey);
    //                 const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    //                 expect(receipt.status).to.equal(1n);
    //                 console.log(await bigbangLendingContract.methods.getLoanData(
    //                     deployer.address,
    //                     process.env.BTC_ADDR
    //                 ).call());

    //             } catch (error) {
    //                 console.error("Error: ", error);
    //                 throw error;
    //             }
    //         });
    //     });

    //     describe('Loan Data', () => {
    //         describe('isLoanExpired', () => {
    //             it('Should be false if loan was not expired yet', async () => {
    //                 const { bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);

    //                 expect(await bigbangLendingContract.methods.isLoanExpired(
    //                     deployer.address, 
    //                     process.env.BTC_ADDR
    //                 ).call()).to.equal(false);
    //             });

    //             it('Should be true if loan was not expired yet', async () => {
    //                 const { bigbangLendingContract, deployer } = await loadFixture(deployBigbangLendingServiceFixture);
                    
    //                 expect(await bigbangLendingContract.methods.isloanExpired(
    //                     deployer.address, 
    //                     process.env.BTC_ADDR
    //                 ).call()).to.equal(true);
    //             });
    //         });
    //     });
    // });
});