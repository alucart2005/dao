// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @title DAOVoting
 * @dev DAO contract with voting system for proposals
 * Inherits from ERC2771Context to support meta-transactions
 */
contract DAOVoting is ERC2771Context {
    enum VoteType {
        AGAINST,
        FOR,
        ABSTAIN
    }

    struct Proposal {
        uint256 id;
        string name;
        address proposer;
        address recipient;
        uint256 amount;
        uint256 deadline;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        bool executed;
        uint256 executionTime;
    }

    // Minimum balance percentage required to create proposals (10% = 1000, using basis points)
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 1000; // 10% in basis points
    uint256 public constant EXECUTION_DELAY = 1 days; // Security period after deadline

    uint256 private _nextProposalId = 1;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => VoteType)) public votes; // proposalId => user => vote
    mapping(uint256 => mapping(address => bool)) public hasVoted; // proposalId => user => has voted
    mapping(address => uint256) private _balances; // User balances in ETH
    uint256 public totalBalance; // Total ETH in the DAO

    event ProposalCreated(
        uint256 indexed proposalId,
        string name,
        address indexed proposer,
        address indexed recipient,
        uint256 amount,
        uint256 deadline
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType
    );
    event VoteChanged(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType oldVote,
        VoteType newVote
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed recipient,
        uint256 amount
    );
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed withdrawer, uint256 amount);

    /**
     * @dev Constructor
     * @param trustedForwarder The address of the trusted forwarder (MinimalForwarder)
     */
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    /**
     * @dev Receive ETH and update balances
     */
    receive() external payable {
        _deposit(msg.sender, msg.value);
    }

    /**
     * @dev Fund the DAO with ETH
     */
    function fundDAO() external payable {
        require(msg.value > 0, "DAOVoting: must send ETH");
        _deposit(_msgSender(), msg.value);
    }

    /**
     * @dev Internal function to handle deposits
     */
    function _deposit(address user, uint256 amount) internal {
        _balances[user] += amount;
        totalBalance += amount;
        emit FundsDeposited(user, amount);
    }

    /**
     * @dev Create a new proposal
     * @param name The name/title of the proposal
     * @param recipient The address that will receive the funds if proposal passes
     * @param amount The amount of ETH to transfer
     * @param deadline The timestamp when voting ends
     */
    function createProposal(
        string memory name,
        address recipient,
        uint256 amount,
        uint256 deadline
    ) external {
        address proposer = _msgSender();
        uint256 proposerBalance = _balances[proposer];

        // Require minimum 10% of total balance to create proposals
        require(
            proposerBalance * 10000 >= totalBalance * MIN_PROPOSAL_THRESHOLD,
            "DAOVoting: insufficient balance to create proposal"
        );

        require(bytes(name).length > 0, "DAOVoting: name cannot be empty");
        require(recipient != address(0), "DAOVoting: invalid recipient");
        require(amount > 0, "DAOVoting: amount must be greater than 0");
        require(deadline > block.timestamp, "DAOVoting: deadline must be in the future");
        require(amount <= address(this).balance, "DAOVoting: insufficient DAO balance");

        uint256 proposalId = _nextProposalId++;
        proposals[proposalId] = Proposal({
            id: proposalId,
            name: name,
            proposer: proposer,
            recipient: recipient,
            amount: amount,
            deadline: deadline,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            executed: false,
            executionTime: 0
        });

        emit ProposalCreated(proposalId, name, proposer, recipient, amount, deadline);
    }

    /**
     * @dev Vote on a proposal
     * @param proposalId The ID of the proposal
     * @param voteType The type of vote (FOR, AGAINST, ABSTAIN)
     */
    function vote(uint256 proposalId, VoteType voteType) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "DAOVoting: proposal does not exist");
        require(block.timestamp <= proposal.deadline, "DAOVoting: voting deadline passed");
        require(!proposal.executed, "DAOVoting: proposal already executed");

        address voter = _msgSender();
        uint256 voterBalance = _balances[voter];
        require(voterBalance > 0, "DAOVoting: must have balance to vote");

        VoteType previousVote = votes[proposalId][voter];
        bool isFirstVote = !hasVoted[proposalId][voter];

        // Remove previous vote if exists
        if (!isFirstVote) {
            if (previousVote == VoteType.FOR) {
                proposal.votesFor -= voterBalance;
            } else if (previousVote == VoteType.AGAINST) {
                proposal.votesAgainst -= voterBalance;
            } else if (previousVote == VoteType.ABSTAIN) {
                proposal.votesAbstain -= voterBalance;
            }
        }

        // Add new vote
        if (voteType == VoteType.FOR) {
            proposal.votesFor += voterBalance;
        } else if (voteType == VoteType.AGAINST) {
            proposal.votesAgainst += voterBalance;
        } else if (voteType == VoteType.ABSTAIN) {
            proposal.votesAbstain += voterBalance;
        }

        votes[proposalId][voter] = voteType;
        hasVoted[proposalId][voter] = true;

        if (isFirstVote) {
            // First time voting
            emit VoteCast(proposalId, voter, voteType);
        } else {
            // Changed vote
            emit VoteChanged(proposalId, voter, previousVote, voteType);
        }
    }

    /**
     * @dev Execute a proposal if conditions are met
     * @param proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "DAOVoting: proposal does not exist");
        require(!proposal.executed, "DAOVoting: proposal already executed");
        require(block.timestamp > proposal.deadline, "DAOVoting: voting deadline not passed");
        require(
            proposal.votesFor > proposal.votesAgainst,
            "DAOVoting: proposal did not pass"
        );

        // Check if execution delay has passed
        uint256 executionTime = proposal.deadline + EXECUTION_DELAY;
        require(
            block.timestamp >= executionTime,
            "DAOVoting: execution delay not passed"
        );

        proposal.executed = true;
        proposal.executionTime = block.timestamp;

        // Transfer funds to recipient
        (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "DAOVoting: transfer failed");

        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    /**
     * @dev Get proposal details
     * @param proposalId The ID of the proposal
     * @return The proposal struct
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    /**
     * @dev Get user balance
     * @param user The address of the user
     * @return The user's balance in ETH
     */
    function getUserBalance(address user) external view returns (uint256) {
        return _balances[user];
    }

    /**
     * @dev Get the vote of a user for a specific proposal
     * @param proposalId The ID of the proposal
     * @param user The address of the user
     * @return The vote type
     */
    function getUserVote(uint256 proposalId, address user) external view returns (VoteType) {
        return votes[proposalId][user];
    }

    /**
     * @dev Override _msgSender to use ERC2771Context
     */
    function _msgSender() internal view override(ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    /**
     * @dev Override _msgData to use ERC2771Context
     */
    function _msgData() internal view override(ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}

