// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SafeBaseV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 private _value;

    enum Status { None, Funded, Released, Refunded }

    struct Deal {
        address payer;
        address payee;
        uint256 amount;
        uint64 deadline;
        bytes32 hashlock;
        Status status;
    }

    mapping(bytes32 => Deal) private _deals;

    event DealCreated(bytes32 indexed dealId, address indexed payer, address indexed payee, uint256 amount, uint64 deadline, bytes32 hashlock);
    event Released(bytes32 indexed dealId, address indexed payee, uint256 amount);
    event Refunded(bytes32 indexed dealId, address indexed payer, uint256 amount);
    event Resolved(bytes32 indexed dealId, address indexed to, uint256 amount);

    function initialize(uint256 initialValue, address owner_) public initializer {
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        _value = initialValue;
    }

    function initializeV2() public reinitializer(2) {}

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getValue() external view returns (uint256) {
        return _value;
    }

    function setValue(uint256 newValue) external onlyOwner {
        _value = newValue;
    }

    function createDeal(bytes32 dealId, address payee, uint64 deadline, bytes32 hashlock) external payable {
        require(_deals[dealId].status == Status.None, "exists");
        require(payee != address(0), "payee");
        require(msg.value > 0, "amount");
        require(deadline > block.timestamp, "deadline");
        _deals[dealId] = Deal({
            payer: msg.sender,
            payee: payee,
            amount: msg.value,
            deadline: deadline,
            hashlock: hashlock,
            status: Status.Funded
        });
        emit DealCreated(dealId, msg.sender, payee, msg.value, deadline, hashlock);
    }

    function reveal(bytes32 dealId, bytes calldata secret) external {
        Deal storage d = _deals[dealId];
        require(d.status == Status.Funded, "status");
        require(keccak256(secret) == d.hashlock, "hash");
        d.status = Status.Released;
        _transfer(d.payee, d.amount);
        emit Released(dealId, d.payee, d.amount);
    }

    function refund(bytes32 dealId) external {
        Deal storage d = _deals[dealId];
        require(d.status == Status.Funded, "status");
        require(block.timestamp >= d.deadline, "time");
        d.status = Status.Refunded;
        _transfer(d.payer, d.amount);
        emit Refunded(dealId, d.payer, d.amount);
    }

    function resolveByOwner(bytes32 dealId, address to) external onlyOwner {
        Deal storage d = _deals[dealId];
        require(d.status == Status.Funded, "status");
        require(to != address(0), "to");
        d.status = Status.Released;
        _transfer(to, d.amount);
        emit Resolved(dealId, to, d.amount);
    }

    function deal(bytes32 dealId) external view returns (Deal memory) {
        return _deals[dealId];
    }

    function _transfer(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer");
    }
}
