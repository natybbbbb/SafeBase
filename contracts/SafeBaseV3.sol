// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SafeBaseV3 is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    uint256 private _value;
    uint256 public feeRate;
    uint256 public totalFeesCollected;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_FEE_RATE = 500;

    enum Status { None, Funded, Released, Refunded, Disputed }
    enum TokenType { ETH, ERC20 }

    struct Deal {
        address payer;
        address payee;
        uint256 amount;
        uint64 deadline;
        bytes32 hashlock;
        Status status;
        TokenType tokenType;
        address token;
        uint256 createdAt;
    }

    mapping(bytes32 => Deal) private _deals;
    mapping(address => uint256) public userDealCount;
    mapping(address => bytes32[]) public userDeals;
    mapping(address => uint256) public collectedFees;

    error DealAlreadyExists();
    error InvalidPayee();
    error InvalidAmount();
    error InvalidDeadline();
    error DealNotFound();
    error InvalidStatus();
    error InvalidHashlock();
    error DeadlineNotReached();
    error InvalidRecipient();
    error TransferFailed();
    error InvalidFeeRate();
    error ZeroAddress();

    event DealCreated(
        bytes32 indexed dealId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        uint64 deadline,
        bytes32 hashlock,
        TokenType tokenType,
        address token
    );
    event DealRevealed(bytes32 indexed dealId, address indexed payee, uint256 amount, bytes32 secret);
    event DealRefunded(bytes32 indexed dealId, address indexed payer, uint256 amount);
    event DealResolved(bytes32 indexed dealId, address indexed to, uint256 amount);
    event DealDisputed(bytes32 indexed dealId, address indexed disputer);
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event FeeCollected(bytes32 indexed dealId, uint256 feeAmount);

    modifier validDealId(bytes32 dealId) {
        if (_deals[dealId].status == Status.None) revert DealNotFound();
        _;
    }

    modifier onlyPayer(bytes32 dealId) {
        if (_deals[dealId].payer != msg.sender) revert InvalidRecipient();
        _;
    }

    modifier onlyPayee(bytes32 dealId) {
        if (_deals[dealId].payee != msg.sender) revert InvalidRecipient();
        _;
    }

    function initialize(uint256 initialValue, address owner_) public initializer {
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _value = initialValue;
        feeRate = 100;
    }

    function initializeV3() public reinitializer(3) {
        feeRate = 100;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getValue() external view returns (uint256) {
        return _value;
    }

    function setValue(uint256 newValue) external onlyOwner {
        _value = newValue;
    }

    function createDealETH(
        bytes32 dealId,
        address payee,
        uint64 deadline,
        bytes32 hashlock
    ) external payable nonReentrant {
        if (_deals[dealId].status != Status.None) revert DealAlreadyExists();
        if (payee == address(0)) revert InvalidPayee();
        if (msg.value == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        _deals[dealId] = Deal({
            payer: msg.sender,
            payee: payee,
            amount: msg.value,
            deadline: deadline,
            hashlock: hashlock,
            status: Status.Funded,
            tokenType: TokenType.ETH,
            token: address(0),
            createdAt: block.timestamp
        });

        userDealCount[msg.sender]++;
        userDeals[msg.sender].push(dealId);

        emit DealCreated(dealId, msg.sender, payee, msg.value, deadline, hashlock, TokenType.ETH, address(0));
    }

    function createDealERC20(
        bytes32 dealId,
        address payee,
        uint256 amount,
        uint64 deadline,
        bytes32 hashlock,
        address token
    ) external nonReentrant {
        if (_deals[dealId].status != Status.None) revert DealAlreadyExists();
        if (payee == address(0)) revert InvalidPayee();
        if (amount == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (token == address(0)) revert ZeroAddress();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        _deals[dealId] = Deal({
            payer: msg.sender,
            payee: payee,
            amount: amount,
            deadline: deadline,
            hashlock: hashlock,
            status: Status.Funded,
            tokenType: TokenType.ERC20,
            token: token,
            createdAt: block.timestamp
        });

        userDealCount[msg.sender]++;
        userDeals[msg.sender].push(dealId);

        emit DealCreated(dealId, msg.sender, payee, amount, deadline, hashlock, TokenType.ERC20, token);
    }

    function reveal(bytes32 dealId, bytes calldata secret) external nonReentrant validDealId(dealId) {
        Deal storage d = _deals[dealId];
        if (d.status != Status.Funded) revert InvalidStatus();
        if (keccak256(secret) != d.hashlock) revert InvalidHashlock();

        d.status = Status.Released;

        uint256 feeAmount = (d.amount * feeRate) / FEE_DENOMINATOR;
        uint256 payoutAmount = d.amount - feeAmount;

        if (feeAmount > 0) {
            collectedFees[address(this)] += feeAmount;
            totalFeesCollected += feeAmount;
            emit FeeCollected(dealId, feeAmount);
        }

        if (d.tokenType == TokenType.ETH) {
            _transferETH(d.payee, payoutAmount);
        } else {
            IERC20(d.token).safeTransfer(d.payee, payoutAmount);
        }

        emit DealRevealed(dealId, d.payee, payoutAmount, keccak256(secret));
    }

    function refund(bytes32 dealId) external nonReentrant validDealId(dealId) {
        Deal storage d = _deals[dealId];
        if (d.status != Status.Funded) revert InvalidStatus();
        if (block.timestamp < d.deadline) revert DeadlineNotReached();

        d.status = Status.Refunded;

        if (d.tokenType == TokenType.ETH) {
            _transferETH(d.payer, d.amount);
        } else {
            IERC20(d.token).safeTransfer(d.payer, d.amount);
        }

        emit DealRefunded(dealId, d.payer, d.amount);
    }

    function disputeDeal(bytes32 dealId) external nonReentrant validDealId(dealId) onlyPayer(dealId) {
        Deal storage d = _deals[dealId];
        if (d.status != Status.Funded) revert InvalidStatus();

        d.status = Status.Disputed;
        emit DealDisputed(dealId, msg.sender);
    }

    function resolveByOwner(bytes32 dealId, address to) external onlyOwner nonReentrant validDealId(dealId) {
        Deal storage d = _deals[dealId];
        if (d.status != Status.Funded && d.status != Status.Disputed) revert InvalidStatus();
        if (to == address(0)) revert InvalidRecipient();

        d.status = Status.Released;

        if (d.tokenType == TokenType.ETH) {
            _transferETH(to, d.amount);
        } else {
            IERC20(d.token).safeTransfer(to, d.amount);
        }

        emit DealResolved(dealId, to, d.amount);
    }

    function setFeeRate(uint256 newFeeRate) external onlyOwner {
        if (newFeeRate > MAX_FEE_RATE) revert InvalidFeeRate();
        uint256 oldRate = feeRate;
        feeRate = newFeeRate;
        emit FeeRateUpdated(oldRate, newFeeRate);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = collectedFees[address(this)];
        if (amount == 0) revert InvalidAmount();

        collectedFees[address(this)] = 0;
        _transferETH(owner(), amount);

        emit FeesWithdrawn(owner(), amount);
    }

    function getDeal(bytes32 dealId) external view returns (Deal memory) {
        return _deals[dealId];
    }

    function getUserDeals(address user) external view returns (bytes32[] memory) {
        return userDeals[user];
    }

    function _transferETH(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    receive() external payable {}
}
