// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SafeBaseV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 private _value;

    function initialize(uint256 initialValue, address owner_) public initializer {
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        _value = initialValue;
    }

    function initializeV2() public reinitializer(2) {
        _value = _value + 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getValue() external view returns (uint256) {
        return _value;
    }

    function setValue(uint256 newValue) external onlyOwner {
        _value = newValue;
    }
}
