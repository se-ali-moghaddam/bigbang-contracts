//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {BigbangLendingContract} from "./BigbangLendingContract.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error AccessDenied();
error InvalidVoteNumber();
error InsufficientBalance();
error TransferFailed(address sender, address recipient, uint256 amount);

contract BigbangVotingContract is AccessControl, ReentrancyGuard {
    address public owner;

    address private _pendingOwner;
    IERC20 private _bigbangTokenProvider;
    BigbangLendingContract private _lendingContractProvider;
    uint256 private _lendingLimitationPercentIncreaseVotes;
    uint256 private _lendingLimitationPercentDecreaseVotes;
    uint256 private _loanDurationIncreaseVotes;
    uint256 private _loanDurationDecreaseVotes;

    bytes32 private constant _DEFAULT_ADMIN_ROLE =
        keccak256("DEFAULT_ADMIN_ROLE");
    bytes32 private constant _ACCESS_MANAGER_ROLE =
        keccak256("ACCESS_MANAGER_ROLE");
    bytes32 private constant _DATA_MANAGER_ROLE =
        keccak256("DATA_MANAGER_ROLE");

    event VoteSubmitted(
        address indexed submitter,
        bool isPositive,
        uint256 voteNumber
    );
    event OwnershipTransferred(
        address indexed prevOwner,
        address indexed newOwner
    );
    event LendingLimitationPercentIncreased(uint8 newLendingLimitationPercent);
    event LendingLimitationPercentDecreased(uint8 newLendingLimitationPercent);
    event LoanDurationIncreased(uint8 newLendingLimitationPercent);
    event LoanDurationDecreased(uint8 newLendingLimitationPercent);

    modifier onlyOwner() {
        if (msg.sender != owner) revert AccessDenied();
        _;
    }

    modifier onlyValidVote(uint256 voteNumber) {
        if (voteNumber <= 0) revert InvalidVoteNumber();
        _;
    }

    constructor(address bigbangTokenAddr, address bigbangLendingContractAddr) {
        owner = msg.sender;
        _pendingOwner = msg.sender;
        _bigbangTokenProvider = IERC20(bigbangTokenAddr);
        _lendingContractProvider = BigbangLendingContract(
            payable(bigbangLendingContractAddr)
        );

        super._grantRole(_DEFAULT_ADMIN_ROLE, owner);
        super._grantRole(_ACCESS_MANAGER_ROLE, owner);
        super._grantRole(_DATA_MANAGER_ROLE, owner);
    }

    function voteIncreaseLendingLimitationPercent(
        bool isPositive,
        uint256 voteNumber
    ) external onlyValidVote(voteNumber) nonReentrant {
        uint256 voteFee = _lendingContractProvider.getVoteFee();
        uint256 voteFeeAmount = voteNumber * voteFee;

        if (isPositive) _lendingLimitationPercentIncreaseVotes += voteNumber;
        else _lendingLimitationPercentDecreaseVotes += voteNumber;

        emit VoteSubmitted(msg.sender, isPositive, voteNumber);

        _transfer(msg.sender, address(_lendingContractProvider), voteFeeAmount);
    }

    function voteIncreaseLoanDuration(
        bool isPositive,
        uint256 voteNumber
    ) external onlyValidVote(voteNumber) nonReentrant {
        uint256 voteFee = _lendingContractProvider.getVoteFee();
        uint256 voteFeeAmount = voteNumber * voteFee;

        if (isPositive) _loanDurationIncreaseVotes += voteNumber;
        else _loanDurationDecreaseVotes += voteNumber;

        emit VoteSubmitted(msg.sender, isPositive, voteNumber);

        _transfer(msg.sender, address(_lendingContractProvider), voteFeeAmount);
    }

    function increaseLendingLimitationPercent()
        external
        onlyRole(_DATA_MANAGER_ROLE)
    {
        uint8 lendingLimitationPercent = _lendingContractProvider
            .getLendingLimitationPercent();

        uint8 newLendingLimitationPercent;

        if (_getResultIncreaseLendingLimitationPercentVoting()) {
            if (lendingLimitationPercent < 96) {
                newLendingLimitationPercent = (lendingLimitationPercent++);

                _lendingContractProvider.setLendingLimitationPercent(
                    newLendingLimitationPercent
                );

                emit LendingLimitationPercentIncreased(
                    newLendingLimitationPercent
                );
            }
        } else {
            if (lendingLimitationPercent > 20) {
                newLendingLimitationPercent = (lendingLimitationPercent--);

                _lendingContractProvider.setLendingLimitationPercent(
                    newLendingLimitationPercent
                );

                emit LendingLimitationPercentDecreased(
                    newLendingLimitationPercent
                );
            }
        }
    }

    function increaseLoanDuration() external onlyRole(_DATA_MANAGER_ROLE) {
        uint8 loanDuration = _lendingContractProvider.getLoanDuration();
        uint8 newLoanDuration;

        if (_getResultIncreaseLoanDurationVoting()) {
            if (loanDuration < 31) {
                newLoanDuration = (loanDuration++);
                _lendingContractProvider.setLoanDuration(newLoanDuration);

                emit LoanDurationIncreased(newLoanDuration);
            }
        } else {
            if (loanDuration > 1) {
                newLoanDuration = (loanDuration--);
                _lendingContractProvider.setLoanDuration(newLoanDuration);

                emit LoanDurationDecreased(newLoanDuration);
            }
        }
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

    function getLendingLimitationPercentVotes()
        external
        view
        returns (uint256 increaseVotes, uint256 decreaseVotes)
    {
        return(_lendingLimitationPercentIncreaseVotes, _lendingLimitationPercentDecreaseVotes);
    }

    function getLendingLoanDurationVotes()
        external
        view
        returns (uint256 increaseVotes, uint256 decreaseVotes)
    {
        return(_loanDurationIncreaseVotes, _loanDurationDecreaseVotes);
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) private {
        if (_bigbangTokenProvider.balanceOf(sender) <= amount)
            revert InsufficientBalance();

        if (!_bigbangTokenProvider.transferFrom(sender, recipient, amount))
            revert TransferFailed(sender, recipient, amount);
    }

    function _getResultIncreaseLendingLimitationPercentVoting()
        private
        view
        returns (bool)
    {
        if (
            _lendingLimitationPercentIncreaseVotes >
            _lendingLimitationPercentDecreaseVotes
        ) return true;
        else return false;
    }

    function _getResultIncreaseLoanDurationVoting()
        private
        view
        returns (bool)
    {
        if (_loanDurationIncreaseVotes > _loanDurationDecreaseVotes)
            return true;
        else return false;
    }
}
