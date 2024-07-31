// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

error AccessDenied();
error NotSupportedToken();
error LoanNotFound();
error LoanIsActive();
error WrongAddress();
error AddressNotFound();
error InvalidCollateralAmount();
error InvalidLendingLimitationPercent(uint8 lendingLimitationPercent);
error InvalidLoanDuration(uint8 loanDuration);
error InvalidRepaymentAmount(uint256 borrowAmount);
error InsufficientBalance();
error TransferFailed(address from, address to, uint256 amount);
error ExecutionFailed();

contract BigbangLendingContract is AccessControl, ReentrancyGuard {
    struct Token {
        AggregatorV3Interface priceFeed;
        uint8 tokenId;
    }

    struct Loan {
        uint256 collateralAmount;
        uint256 borrowedAmount;
        // adding Comments
        uint256 expirationDate;
    }

    struct BusinessLogicData {
        uint8 ownerFee; // owner's fee percentage
        uint256 voteFee; // Fee for voting on certain actions
        uint8 lendingLimitationPercent; // Maximum lending percentage against collateral
        uint256 lowestPrice; // Lowest price threshold for tokens
        uint256 highestPrice; // Highest price threshold for tokens //10000044444222
        uint8 loanDuration; // Period allowed for repayment
    }

    address public owner;

    address private _pendingOwner;
    BusinessLogicData private _businessLogicData;
    IERC20 private _bigbangTokenProvider;
    uint256 private _loansTotalCount;
    uint256 private _usedBigbangsTotalAmount;
    uint8 private _tokensTotalCount;
    uint256 private _ownerShare;

    AggregatorV3Interface private immutable _NETWORK_COIN_PRICE_FEED;
    uint256 private immutable _BUFFER_TIME = 1 hours;

    bytes32 private constant _DEFAULT_ADMIN_ROLE =
        keccak256("DEFAULT_ADMIN_ROLE");
    bytes32 private constant _ACCESS_MANAGER_ROLE =
        keccak256("ACCESS_MANAGER_ROLE");
    bytes32 private constant _DATA_MANAGER_ROLE =
        keccak256("DATA_MANAGER_ROLE");
    bytes32 private constant _AUTHORIZED_CONTRACT_ROLE =
        keccak256("AUTHORIZED_CONTRACT_ROLE");

    mapping(address => mapping(address => Loan)) private _loans;
    mapping(address => Token) private _tokens;
    address[] private _tokensArray;

    event Borrowed(address indexed borrower, uint256 amount);
    event Repaid(address indexed borrower, uint256 amount);
    event WithdrawalTaken(
        address indexed to,
        address indexed tokenAddr,
        uint256 amount
    );
    event OwnershipTransferred(
        address indexed prevOwner,
        address indexed newOwner
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert AccessDenied();
        _;
    }

    modifier onlyValidAddress(address addr) {
        if (addr == address(0)) revert WrongAddress();
        _;
    }

    modifier onlySupportedToken(address tokenAddr) {
        if (
            tokenAddr != address(this) &&
            _tokens[tokenAddr].tokenId == 0 &&
            tokenAddr != address(_bigbangTokenProvider)
        ) revert NotSupportedToken();
        _;
    }

    modifier onlyAvailableLoan(address tokenAddr, address borrowerAddr) {
        if (_loans[borrowerAddr][tokenAddr].collateralAmount == 0)
            revert LoanNotFound();
        _;
    }

    modifier onlyLoanHolder(address tokenAddr) {
        if (_loans[msg.sender][tokenAddr].collateralAmount == 0)
            revert LoanNotFound();
        _;
    }

    modifier onlyValidRepayment(
        address borrower,
        address collateralTokenAddr,
        uint256 borrowAmount
    ) {
        if (borrowAmount > _loans[borrower][collateralTokenAddr].borrowedAmount)
            revert InvalidRepaymentAmount(borrowAmount);

        if (borrowAmount > IERC20(_bigbangTokenProvider).balanceOf(borrower))
            revert InsufficientBalance();
        _;
    }

    modifier onlyValidBusinessLogicData(BusinessLogicData memory data) {
        // solhint-disable-next-line gas-custom-errors
        require(
            data.ownerFee <= 100 && data.ownerFee > 0,
            "owner fee percent must be between 1 and 100 !"
        );

        // solhint-disable-next-line gas-custom-errors
        require(data.voteFee > 0, "Vote fee must be greater than zero !");

        if (
            data.lendingLimitationPercent <= 0 ||
            data.lendingLimitationPercent > 100
        ) revert InvalidLendingLimitationPercent(data.lendingLimitationPercent);

        // solhint-disable-next-line gas-custom-errors
        require(
            data.lowestPrice > 0 && data.lowestPrice < data.highestPrice,
            "Lowest price must be between zero and highest price !"
        );

        if (data.loanDuration < 30 || data.loanDuration > 60)
            revert InvalidLoanDuration(data.loanDuration);
        _;
    }

    constructor(
        address networkCoinPriceFeed,
        uint8 ownerFee,
        uint256 voteFee,
        uint8 lendingLimitationPercent,
        uint256 lowestPrice,
        uint256 highestPrice,
        uint8 loanDuration
    ) onlyValidAddress(networkCoinPriceFeed) {
        owner = msg.sender;
        _pendingOwner = msg.sender;

        super._grantRole(_DEFAULT_ADMIN_ROLE, owner);
        super._grantRole(_ACCESS_MANAGER_ROLE, owner);
        super._grantRole(_DATA_MANAGER_ROLE, owner);

        _NETWORK_COIN_PRICE_FEED = AggregatorV3Interface(networkCoinPriceFeed);
        _ownerShare = 0;

        setBusinessLogicData(
            ownerFee,
            voteFee,
            lendingLimitationPercent,
            lowestPrice,
            highestPrice,
            loanDuration
        );
    }

    receive() external payable {}

    fallback() external payable {}

    function borrow(
        address tokenAddr,
        uint256 collateralAmount
    ) external payable onlySupportedToken(tokenAddr) nonReentrant {
        if (collateralAmount <= 0) revert InvalidCollateralAmount();

        uint256 loanNetAmount = _placeLoan(tokenAddr, collateralAmount);

        emit Borrowed(msg.sender, loanNetAmount);

        _transfer(msg.sender, address(this), tokenAddr, collateralAmount);
        _transfer(
            address(this),
            msg.sender,
            address(_bigbangTokenProvider),
            loanNetAmount
        );
    }

    function repay(
        address tokenAddr,
        address borrowerAddr,
        uint256 repaymentAmount
    )
        external
        payable
        onlySupportedToken(tokenAddr)
        onlyAvailableLoan(tokenAddr, borrowerAddr)
        onlyValidRepayment(borrowerAddr, tokenAddr, repaymentAmount)
        nonReentrant
    {
        if (
            msg.sender != borrowerAddr &&
            _fetchBlockTimeStamp() <
            _loans[borrowerAddr][tokenAddr].expirationDate
        ) revert AccessDenied();
        
        uint256 unlockedCollateral = _calculateUnlockableCollateral(
            borrowerAddr,
            tokenAddr,
            repaymentAmount
        );

        _updateLoan(
            borrowerAddr,
            tokenAddr,
            repaymentAmount,
            unlockedCollateral
        );

        emit Repaid(msg.sender, repaymentAmount);

        _transfer(
            msg.sender,
            address(this),
            address(_bigbangTokenProvider),
            repaymentAmount
        );
        _transfer(address(this), msg.sender, tokenAddr, unlockedCollateral);
    }

    function withdrawOwnerShare(
        uint256 shareAmount
    ) external onlyOwner nonReentrant {
        if (_ownerShare <= 0 && shareAmount > _ownerShare)
            revert InsufficientBalance();

        unchecked {
            _ownerShare -= shareAmount;
        }

        emit WithdrawalTaken(
            owner,
            address(_bigbangTokenProvider),
            shareAmount
        );

        _transfer(
            address(this),
            owner,
            address(_bigbangTokenProvider),
            shareAmount
        );
    }

    function withdrawRemainingCollaterals(
        address tokenAddr
    ) external onlySupportedToken(tokenAddr) onlyLoanHolder(tokenAddr) {
        Loan memory loan = _loans[msg.sender][tokenAddr];

        if (
            loan.borrowedAmount != 0 ether &&
            (loan.collateralAmount <= 0 ether &&
                loan.collateralAmount > 1 ether)
        ) revert ExecutionFailed();

        uint256 amount = loan.collateralAmount;
        loan.collateralAmount = 0;

        if (loan.borrowedAmount == 0 ether && loan.collateralAmount == 0 ether)
            delete _loans[msg.sender][tokenAddr];

        emit WithdrawalTaken(msg.sender, tokenAddr, amount);

        _transfer(address(this), msg.sender, tokenAddr, amount);
    }

    function addToken(
        address tokenContractAddr,
        address priceFeed
    )
        external
        onlyRole(_DATA_MANAGER_ROLE)
        onlyValidAddress(tokenContractAddr)
        onlyValidAddress(priceFeed)
    {
        // solhint-disable-next-line gas-custom-errors
        require(_tokens[tokenContractAddr].tokenId == 0, "Token already added");

        _tokens[tokenContractAddr] = Token({
            tokenId: _tokensTotalCount + 1,
            priceFeed: AggregatorV3Interface(priceFeed)
        });

        _tokensArray.push(tokenContractAddr);

        unchecked {
            _tokensTotalCount++;
        }
    }

    function removeToken(
        address tokenContractAddr
    )
        external
        onlyRole(_DATA_MANAGER_ROLE)
        onlySupportedToken(tokenContractAddr)
    {
        delete _tokens[tokenContractAddr];
        delete _tokensArray[_findAddressIndex(tokenContractAddr)];
        unchecked {
            _tokensTotalCount--;
        }
    }

    function changeTokenPriceFeed(
        address tokenAddr,
        address tokenPriceFeedAddr
    )
        external
        onlyRole(_DATA_MANAGER_ROLE)
        onlySupportedToken(tokenAddr)
        onlyValidAddress(tokenPriceFeedAddr)
    {
        _tokens[tokenAddr].priceFeed = AggregatorV3Interface(
            tokenPriceFeedAddr
        );
    }

    function setNativeToken(
        address tokenAddr
    ) external onlyRole(_DATA_MANAGER_ROLE) onlyValidAddress(tokenAddr) {
        _bigbangTokenProvider = IERC20(tokenAddr);
    }

    function setLendingLimitationPercent(
        uint8 lendingLimitationPercent
    ) external onlyRole(_AUTHORIZED_CONTRACT_ROLE) {
        if (lendingLimitationPercent <= 0 || lendingLimitationPercent > 100)
            revert InvalidLendingLimitationPercent(lendingLimitationPercent);

        _businessLogicData.lendingLimitationPercent = lendingLimitationPercent;
    }

    function setLoanDuration(
        uint8 loanDuration
    ) external onlyRole(_AUTHORIZED_CONTRACT_ROLE) {
        if (loanDuration < 30 || loanDuration > 60)
            revert InvalidLoanDuration(loanDuration);

        _businessLogicData.loanDuration = loanDuration;
    }

    function assignRole(
        bytes32 role,
        address account
    ) external onlyRole(_ACCESS_MANAGER_ROLE) {
        // solhint-disable-next-line gas-custom-errors
        if (super.hasRole(role, account)) revert("Role already assigned");
        super._grantRole(role, account);
    }

    function unassignRole(
        bytes32 role,
        address account
    ) external onlyRole(_ACCESS_MANAGER_ROLE) {
        // solhint-disable-next-line gas-custom-errors
        if (!super.hasRole(role, account)) revert("Role not assigned");

        super._revokeRole(role, account);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        _pendingOwner = newOwner;
    }

    function confirmOwnership() external {
        if (msg.sender != _pendingOwner) revert AccessDenied();

        address prevOwner = owner;
        owner = _pendingOwner;

        super._grantRole(_DEFAULT_ADMIN_ROLE, owner);
        super._grantRole(_ACCESS_MANAGER_ROLE, owner);
        super._grantRole(_DATA_MANAGER_ROLE, owner);

        super._revokeRole(_DEFAULT_ADMIN_ROLE, prevOwner);
        super._revokeRole(_ACCESS_MANAGER_ROLE, prevOwner);
        super._revokeRole(_DATA_MANAGER_ROLE, prevOwner);

        emit OwnershipTransferred(prevOwner, owner);
    }

    function getLoanData(
        address borrowerAddr,
        address tokenAddr
    )
        external
        view
        onlyAvailableLoan(tokenAddr, borrowerAddr)
        returns (uint256, uint256, uint256)
    {
        Loan memory loan = _loans[borrowerAddr][tokenAddr];
        return (
            loan.collateralAmount,
            loan.borrowedAmount,
            loan.expirationDate
        );
    }

    function isLoanExpired(
        address borrowerAddr,
        address tokenAddr
    ) external view onlyAvailableLoan(tokenAddr, borrowerAddr) returns (bool) {
        Loan memory loan = _loans[borrowerAddr][tokenAddr];
        return _fetchBlockTimeStamp() > loan.expirationDate;
    }

    function getContractBalance(
        address tokenAddr
    ) external view onlySupportedToken(tokenAddr) returns (uint256) {
        if (tokenAddr == address(this)) return address(this).balance;

        return IERC20(tokenAddr).balanceOf(address(this));
    }

    function getLoansTotalCount() external view returns (uint256) {
        return _loansTotalCount;
    }

    function getTokensTotalCount() external view returns (uint256) {
        return _tokensTotalCount;
    }

    function getAssetsTotalValue() external view returns (uint256) {
        return _getAssetsTotalValue();
    }

    function getUsedBigbangsTotalAmount() external view returns (uint256) {
        return _usedBigbangsTotalAmount;
    }

    function estimateBigbangPrice() external view returns (uint256) {
        return _estimateBigbangPrice();
    }

    function getVoteFee() external view returns (uint256) {
        return _businessLogicData.voteFee;
    }

    function getLendingLimitationPercent() external view returns (uint8) {
        return _businessLogicData.lendingLimitationPercent;
    }

    function getLoanDuration() external view returns (uint8) {
        return _businessLogicData.loanDuration;
    }

    function setBusinessLogicData(
        uint8 ownerFee,
        uint256 voteFee,
        uint8 lendingLimitationPercent,
        uint256 lowestPrice,
        uint256 highestPrice,
        uint8 loanDuration
    ) public onlyRole(_DATA_MANAGER_ROLE) {
        _setBusinessLogicData(
            BusinessLogicData({
                ownerFee: ownerFee,
                voteFee: voteFee,
                lendingLimitationPercent: lendingLimitationPercent,
                lowestPrice: lowestPrice,
                highestPrice: highestPrice,
                loanDuration: loanDuration
            })
        );
    }

    function fetchLatestPrice(address tokenAddr) public view returns (uint256) {
        if (tokenAddr == address(this))
            return _fetchLatestPrice(_NETWORK_COIN_PRICE_FEED);

        return _fetchLatestPrice(_tokens[tokenAddr].priceFeed);
    }

    function _placeLoan(
        address tokenAddr,
        uint256 collateralAmount
    ) private returns (uint256) {
        uint256 loanGrossAmount = _calculateLoanGrossAmount(
            tokenAddr,
            collateralAmount
        );

        Loan memory loan = Loan({
            collateralAmount: collateralAmount,
            borrowedAmount: loanGrossAmount,
            expirationDate: (_fetchBlockTimeStamp() +
                (_businessLogicData.loanDuration * 1 days))
        });

        _loans[msg.sender][tokenAddr] = loan;

        unchecked {
            _loansTotalCount++;
            _usedBigbangsTotalAmount += loan.borrowedAmount;
        }

        uint256 loanMilliAmount = (loanGrossAmount / 10000);
        uint256 loanNetAmount = loanMilliAmount *
            (10000 - _businessLogicData.ownerFee);
        _ownerShare += loanMilliAmount * _businessLogicData.ownerFee;

        return loanNetAmount;
    }

    function _updateLoan(
        address borrowerAddr,
        address tokenAddr,
        uint256 repaymentAmount,
        uint256 unlockedCollateral
    ) private {
        Loan memory loan = _loans[borrowerAddr][tokenAddr];
        unchecked {
            loan.borrowedAmount -= repaymentAmount;
            loan.collateralAmount -= unlockedCollateral;

            _usedBigbangsTotalAmount -= repaymentAmount;
        }

        if (loan.borrowedAmount == 0 && loan.collateralAmount == 0) {
            delete _loans[borrowerAddr][tokenAddr];
            unchecked {
                _loansTotalCount--;
            }
        }

        loan.expirationDate = (_fetchBlockTimeStamp() +
            (_businessLogicData.loanDuration * 1 days));

        _loans[borrowerAddr][tokenAddr] = loan;
    }

    function _setBusinessLogicData(
        BusinessLogicData memory data
    ) private onlyValidBusinessLogicData(data) {
        _businessLogicData = data;
    }

    function _transfer(
        address sender,
        address recipient,
        address tokenAddr,
        uint256 amount
    ) private {
        if (tokenAddr == address(this)) {
            if (address(sender).balance <= amount) revert InsufficientBalance();

            (bool res, ) = payable(recipient).call{value: amount}("");
            if (!res) revert TransferFailed(sender, recipient, amount);
        } else {
            IERC20 token = IERC20(tokenAddr);

            if (token.balanceOf(sender) <= amount) revert InsufficientBalance();

            if (!token.transferFrom(sender, recipient, amount))
                revert TransferFailed(sender, recipient, amount);
        }
    }

    function _calculateLoanGrossAmount(
        address collateralTokenAddr,
        uint256 collateralAmount
    ) private view returns (uint256) {
        uint256 collateralValue = fetchLatestPrice(collateralTokenAddr) *
            collateralAmount;

        uint256 loanTotalValue = (collateralValue *
            _businessLogicData.lendingLimitationPercent) / 100;

        uint256 loanGrossAmount = loanTotalValue / _estimateBigbangPrice();

        return loanGrossAmount;
    }

    function _calculateUnlockableCollateral(
        address borrowerAddr,
        address tokenAddr,
        uint256 borrowAmount
    ) private view returns (uint256) {
        uint256 collateralTokenPrice = fetchLatestPrice(tokenAddr);

        uint256 collateralTotalValue = _loans[borrowerAddr][tokenAddr]
            .collateralAmount * collateralTokenPrice;

        uint256 borrowValue = collateralTotalValue /
            _loans[borrowerAddr][tokenAddr].borrowedAmount;

        uint256 borrowedAmountTotalValue = borrowValue * borrowAmount;

        return (borrowedAmountTotalValue / collateralTokenPrice);
    }

    function _getAssetsTotalValue() private view returns (uint256) {
        uint256 assestTotalValue;

        for (uint256 i = 0; i < _tokensArray.length; i++) {
            assestTotalValue += (IERC20(_tokensArray[i]).balanceOf(
                address(this)
            ) * fetchLatestPrice(_tokensArray[i]));
        }

        assestTotalValue +=
            address(this).balance *
            fetchLatestPrice(address(this));

        return assestTotalValue;
    }

    function _estimateBigbangPrice() private view returns (uint256) {
        if (_usedBigbangsTotalAmount == 0) return 100000000000000000;
        // it is 0.1 $ now , should to be add an 0 to be 1 $
        else {
            uint256 bigbangPrice = _getAssetsTotalValue() /
                _usedBigbangsTotalAmount;

            if (bigbangPrice < _businessLogicData.lowestPrice)
                return _businessLogicData.lowestPrice;
            else if (bigbangPrice > _businessLogicData.highestPrice)
                return _businessLogicData.highestPrice;
            else return bigbangPrice;
        }
    }

    function _findAddressIndex(address target) private view returns (uint256) {
        for (uint256 i = 0; i < _tokensArray.length; i++) {
            if (_tokensArray[i] == target) return i;
        }

        revert AddressNotFound();
    }

    function _fetchLatestPrice(
        AggregatorV3Interface priceFeed
    ) private view returns (uint256) {
        unchecked {
            (, int256 price, , , ) = priceFeed.latestRoundData();
            return (uint256(price) * 1e10);
        }
    }

    function _fetchBlockTimeStamp() private view returns (uint256) {
        // solhint-disable-next-line not-rely-on-time
        return (block.timestamp + _BUFFER_TIME);
    }
}
