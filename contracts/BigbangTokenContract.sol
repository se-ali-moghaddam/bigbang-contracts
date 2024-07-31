// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import necessary OpenZeppelin libraries for ERC20 functionality
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

error AccessDenied();
error FrozenFeature();
error NotAllowed();

/**
 * @title BigBangToken
 * @dev A comprehensive ERC20 token contract with additional features and access control.
 */
contract BigbangToken is
    ERC20,
    ERC20Burnable,
    AccessControl,
    Pausable,
    ERC20Permit
{
    address public owner;
    address private _pendingOwner;

    bytes32 private constant _DEFAULT_ADMIN_ROLE =
        keccak256("DEFAULT_ADMIN_ROLE");
    bytes32 private constant _ACCESS_MANAGER_ROLE =
        keccak256("ACCESS_MANAGER_ROLE");
    bytes32 private constant _MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 private constant _PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 private constant _FREEZER_ROLE = keccak256("FREEZER_ROLE");

    mapping(bytes32 => bool) private _frozenFeatures;

    event FeatureFrozen(bytes32 feature, address account);
    event FeatureUnfrozen(bytes32 feature, address account);
    event Mint(address indexed to, uint256 indexed amount);
    event Burn(address indexed account, uint256 indexed amount);
    event OwnershipTransferred(
        address indexed prevOwner,
        address indexed newOwner
    );

    modifier onlyOwner(){
        if(msg.sender != owner) revert AccessDenied();
        _;
    }

    /**
     * @dev Modifier to check if an account has enough allowance.
     * @param account The account to check allowance from.
     * @param amount The required allowance.
     */
    modifier onlyAllowed(address account, uint256 amount) {
        if(allowance(account, msg.sender) < amount) revert NotAllowed();
        _;
    }

    /**
     * @dev Modifier to check if a feature is not frozen.
     * @param feature The feature to check.
     */
    modifier whenNotFrozen(bytes32 feature) {
        if(_frozenFeatures[feature]) revert FrozenFeature();
        _;
    }

    /**
     * @dev Contract constructor
     */
    constructor(
        address serviceContractAddr,
        uint256 totalSupply
    ) ERC20("BigbangToken", "BGBT") ERC20Permit("BigbangToken") {
        owner = msg.sender;
        _pendingOwner = msg.sender;

        _grantRole(_DEFAULT_ADMIN_ROLE, owner);
        _grantRole(_ACCESS_MANAGER_ROLE, owner);
        _grantRole(_MINTER_ROLE, owner);
        _grantRole(_PAUSER_ROLE, owner);
        _grantRole(_FREEZER_ROLE, owner);

        _mint(serviceContractAddr, totalSupply * (10 ** decimals()));
    }

    /**
     * @dev Transfers tokens from the sender to a specified address with a permit, restricted to non-frozen transfers.
     * @param to The address to which tokens will be transferred.
     * @param amount The amount of tokens to transfer.
     * @param deadline The deadline for the permit.
     * @param v The v signature parameter.
     * @param r The r signature parameter.
     * @param s The s signature parameter.
     */
    function transferWithPermit(
        address to,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused whenNotFrozen(keccak256("transferWithPermit")) {
        permit(msg.sender, address(this), amount, deadline, v, r, s);
        transfer(to, amount);
    }

    /**
     * @dev Transfers tokens from a specified owner's account to another address with a permit,
     * restricted to non-frozen transfers.
     * @param tokenOwner The owner of the tokens.
     * @param from The address from which tokens will be transferred.
     * @param to The address to which tokens will be transferred.
     * @param amount The amount of tokens to transfer.
     * @param deadline The deadline for the permit.
     * @param v The v signature parameter.
     * @param r The r signature parameter.
     * @param s The s signature parameter.
     */
    function transferFromWithPermit(
        address tokenOwner,
        address from,
        address to,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused whenNotFrozen(keccak256("transferFromWithPermit")) {
        permit(msg.sender, from, amount, deadline, v, r, s);
        transferFrom(tokenOwner, to, amount);
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

        super._revokeRole(_DEFAULT_ADMIN_ROLE, prevOwner);
        super._revokeRole(_ACCESS_MANAGER_ROLE, prevOwner);

        emit OwnershipTransferred(prevOwner, owner);
    }

    /**
     * @dev Pauses the contract operations, restricted to _PAUSER_ROLE.
     */
    function pause() external onlyRole(_PAUSER_ROLE) {
        super._pause();
    }

    /**
     * @dev Unpauses the contract operations, restricted to _PAUSER_ROLE.
     */
    function unpause() external onlyRole(_PAUSER_ROLE) {
        super._unpause();
    }

    /**
     * @dev Freezes a feature, restricted to _FREEZER_ROLE.
     * @param feature The feature to freeze.
     */
    function freeze(bytes32 feature) external onlyRole(_FREEZER_ROLE) {
        // solhint-disable-next-line gas-custom-errors
        require(!_frozenFeatures[feature], "Feature is already frozen !");

        _frozenFeatures[feature] = true;
        emit FeatureFrozen(feature, msg.sender);
    }

    /**
     * @dev Unfreezes a feature, restricted to _FREEZER_ROLE.
     * @param feature The feature to unfreeze.
     */
    function unfreeze(bytes32 feature) external onlyRole(_FREEZER_ROLE) {
        // solhint-disable-next-line gas-custom-errors
        require(_frozenFeatures[feature], "Feature is not frozen !");

        _frozenFeatures[feature] = false;
        emit FeatureUnfrozen(feature, msg.sender);
    }

    /**
     * @dev Mints new tokens and assigns them to an address, restricted to _MINTER_ROLE.
     * @param to The address to receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(
        address to,
        uint256 amount
    ) public whenNotPaused whenNotFrozen(keccak256("mint")) onlyRole(_MINTER_ROLE) {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /**
     * @dev Burns a specified amount of tokens, restricted to burners.
     * @param amount The amount of tokens to burn.
     */
    function burn(
        uint256 amount
    ) public override whenNotPaused whenNotFrozen(keccak256("burn")) {
        super.burn(amount);
        emit Burn(msg.sender, amount);
    }

    /**
     * @dev Burns a specified amount of tokens from an account, restricted to burners.
     * @param account The account from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burnFrom(
        address account,
        uint256 amount
    )
        public
        override
        whenNotPaused
        whenNotFrozen(keccak256("burn"))
        onlyAllowed(account, amount)
    {
        super.burnFrom(account, amount);
        emit Burn(account, amount);
    }

    /**
     * @dev Transfers tokens to a specified address, restricted to non-frozen transfers.
     * @param to The address to which tokens will be transferred.
     * @param amount The amount of tokens to transfer.
     * @return A boolean indicating the success of the transfer.
     */
    function transfer(
        address to,
        uint256 amount
    ) public override whenNotPaused whenNotFrozen(keccak256("transfer")) returns (bool) {
        super.transfer(to, amount);
        return true;
    }

    /**
     * @dev Transfers tokens from one address to another, restricted to non-frozen transfers.
     * @param from The address from which tokens will be transferred.
     * @param to The address to which tokens will be transferred.
     * @param amount The amount of tokens to transfer.
     * @return A boolean indicating the success of the transfer.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    )
        public
        override
        whenNotPaused
        whenNotFrozen(keccak256("transferFrom"))
        returns (bool)
    {
        super.transferFrom(from, to, amount);
        return true;
    }

  
    function approve(
        address tokenOwner,
        address spender,
        uint256 amount
    ) public whenNotPaused whenNotFrozen(keccak256("approve")) returns (bool) {
        super._approve(tokenOwner, spender, amount);
        return true;
    }
}
