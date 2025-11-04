// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title SafeBase (UUPS Upgradeable)
 * @notice Minimal upgradeable contract using UUPS + Ownable for access control.
 *         This serves as a starter skeleton for the #2 SafeBase project.
 */
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SafeBase is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 private _value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 initialValue, address owner_) public initializer {
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        _value = initialValue;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getValue() external view returns (uint256) {
        return _value;
    }

    function setValue(uint256 newValue) external onlyOwner {
        _value = newValue;
    }
}