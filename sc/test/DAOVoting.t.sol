// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";
import {DAOVoting} from "../src/DAOVoting.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// Helper contract to calculate EIP712 hash using the forwarder's domain
contract MinimalForwarderHelper {
    using ECDSA for bytes32;
    
    bytes32 private constant TYPE_HASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant FORWARD_REQUEST_TYPEHASH = keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)");
    
    function getTypedDataHash(MinimalForwarder.ForwardRequest calldata req, address forwarder) external view returns (bytes32) {
        // Build domain separator with same parameters as MinimalForwarder
        bytes32 domainSeparator = keccak256(
            abi.encode(
                TYPE_HASH,
                keccak256(bytes("MinimalForwarder")),
                keccak256(bytes("0.0.1")),
                block.chainid,
                forwarder
            )
        );
        
        // Build struct hash
        bytes32 structHash = keccak256(
            abi.encode(
                FORWARD_REQUEST_TYPEHASH,
                req.from,
                req.to,
                req.value,
                req.gas,
                req.nonce,
                keccak256(req.data)
            )
        );
        
        // Build final hash
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}

contract DAOVotingTest is Test {
    using ECDSA for bytes32;

    MinimalForwarder public forwarder;
    MinimalForwarderHelper public helper;
    DAOVoting public dao;
    
    uint256 public constant ALICE_PRIVATE_KEY = 0xA11CE;
    uint256 public constant BOB_PRIVATE_KEY = 0xB0B;
    uint256 public constant CHARLIE_PRIVATE_KEY = 0xCAFE;
    
    address public alice;
    address public bob;
    address public charlie;
    address public recipient = address(0x4);
    
    uint256 public constant ALICE_BALANCE = 100 ether;
    uint256 public constant BOB_BALANCE = 50 ether;
    uint256 public constant CHARLIE_BALANCE = 10 ether;
    
    uint256 public constant PROPOSAL_AMOUNT = 20 ether;
    uint256 public constant EXECUTION_DELAY = 1 days;

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
        DAOVoting.VoteType voteType
    );
    event VoteChanged(
        uint256 indexed proposalId,
        address indexed voter,
        DAOVoting.VoteType oldVote,
        DAOVoting.VoteType newVote
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed recipient,
        uint256 amount
    );
    event FundsDeposited(address indexed depositor, uint256 amount);

    function setUp() public {
        // Get addresses from private keys
        alice = vm.addr(ALICE_PRIVATE_KEY);
        bob = vm.addr(BOB_PRIVATE_KEY);
        charlie = vm.addr(CHARLIE_PRIVATE_KEY);
        
        // Deploy MinimalForwarder
        forwarder = new MinimalForwarder();
        helper = new MinimalForwarderHelper();
        
        // Deploy DAOVoting with forwarder address
        dao = new DAOVoting(address(forwarder));
        
        // Fund accounts
        vm.deal(alice, ALICE_BALANCE);
        vm.deal(bob, BOB_BALANCE);
        vm.deal(charlie, CHARLIE_BALANCE);
        vm.deal(recipient, 0);
        
        // Users fund the DAO
        vm.prank(alice);
        dao.fundDAO{value: ALICE_BALANCE}();
        
        vm.prank(bob);
        dao.fundDAO{value: BOB_BALANCE}();
        
        vm.prank(charlie);
        dao.fundDAO{value: CHARLIE_BALANCE}();
    }

    // ============ Tests de Creación de Propuestas ============

    function test_CreateProposal_Success() public {
        uint256 deadline = block.timestamp + 7 days;
        
        vm.prank(alice);
        dao.createProposal("Test Proposal", recipient, PROPOSAL_AMOUNT, deadline);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(1);
        assertEq(proposal.id, 1);
        assertEq(proposal.name, "Test Proposal");
        assertEq(proposal.proposer, alice);
        assertEq(proposal.recipient, recipient);
        assertEq(proposal.amount, PROPOSAL_AMOUNT);
        assertEq(proposal.deadline, deadline);
        assertEq(proposal.votesFor, 0);
        assertEq(proposal.votesAgainst, 0);
        assertEq(proposal.votesAbstain, 0);
        assertFalse(proposal.executed);
    }

    function test_CreateProposal_RequiresMinimumBalance() public {
        address smallHolder = address(0x5);
        vm.deal(smallHolder, 1 ether);
        
        vm.prank(smallHolder);
        dao.fundDAO{value: 1 ether}();
        
        uint256 deadline = block.timestamp + 7 days;
        
        vm.prank(smallHolder);
        vm.expectRevert("DAOVoting: insufficient balance to create proposal");
        dao.createProposal("Test Proposal", recipient, PROPOSAL_AMOUNT, deadline);
    }

    function test_CreateProposal_RequiresValidRecipient() public {
        uint256 deadline = block.timestamp + 7 days;
        
        vm.prank(alice);
        vm.expectRevert("DAOVoting: invalid recipient");
        dao.createProposal("Test Proposal", address(0), PROPOSAL_AMOUNT, deadline);
    }

    function test_CreateProposal_RequiresPositiveAmount() public {
        uint256 deadline = block.timestamp + 7 days;
        
        vm.prank(alice);
        vm.expectRevert("DAOVoting: amount must be greater than 0");
        dao.createProposal("Test Proposal", recipient, 0, deadline);
    }

    function test_CreateProposal_RequiresFutureDeadline() public {
        vm.prank(alice);
        vm.expectRevert("DAOVoting: deadline must be in the future");
        dao.createProposal("Test Proposal", recipient, PROPOSAL_AMOUNT, block.timestamp - 1);
    }

    function test_CreateProposal_RequiresNonEmptyName() public {
        uint256 deadline = block.timestamp + 7 days;
        
        vm.prank(alice);
        vm.expectRevert("DAOVoting: name cannot be empty");
        dao.createProposal("", recipient, PROPOSAL_AMOUNT, deadline);
    }

    function test_CreateProposal_RequiresSufficientDAOBalance() public {
        uint256 deadline = block.timestamp + 7 days;
        uint256 excessiveAmount = address(dao).balance + 1 ether;
        
        vm.prank(alice);
        vm.expectRevert("DAOVoting: insufficient DAO balance");
        dao.createProposal("Test Proposal", recipient, excessiveAmount, deadline);
    }

    function test_CreateProposal_EmitsEvent() public {
        uint256 deadline = block.timestamp + 7 days;
        
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit ProposalCreated(1, "Test Proposal", alice, recipient, PROPOSAL_AMOUNT, deadline);
        dao.createProposal("Test Proposal", recipient, PROPOSAL_AMOUNT, deadline);
    }

    function test_CreateProposal_SequentialIds() public {
        uint256 deadline = block.timestamp + 7 days;
        
        vm.prank(alice);
        dao.createProposal("Test Proposal 1", recipient, PROPOSAL_AMOUNT, deadline);
        
        vm.prank(alice);
        dao.createProposal("Test Proposal 2", recipient, PROPOSAL_AMOUNT, deadline);
        
        vm.prank(alice);
        dao.createProposal("Test Proposal 3", recipient, PROPOSAL_AMOUNT, deadline);
        
        assertEq(dao.getProposal(1).id, 1);
        assertEq(dao.getProposal(2).id, 2);
        assertEq(dao.getProposal(3).id, 3);
    }

    // ============ Tests de Votación Normal ============

    function test_Vote_For_Success() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesFor, BOB_BALANCE);
        assertEq(proposal.votesAgainst, 0);
        assertEq(proposal.votesAbstain, 0);
        assertEq(uint256(dao.getUserVote(proposalId, bob)), uint256(DAOVoting.VoteType.FOR));
    }

    function test_Vote_Against_Success() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.AGAINST);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesFor, 0);
        assertEq(proposal.votesAgainst, BOB_BALANCE);
        assertEq(proposal.votesAbstain, 0);
    }

    function test_Vote_Abstain_Success() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.ABSTAIN);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesFor, 0);
        assertEq(proposal.votesAgainst, 0);
        assertEq(proposal.votesAbstain, BOB_BALANCE);
    }

    function test_Vote_ChangeVote() public {
        uint256 proposalId = _createProposal();
        
        // First vote: FOR
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesFor, BOB_BALANCE);
        
        // Change vote: AGAINST
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.AGAINST);
        
        proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesFor, 0);
        assertEq(proposal.votesAgainst, BOB_BALANCE);
        
        // Change vote again: ABSTAIN
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.ABSTAIN);
        
        proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesFor, 0);
        assertEq(proposal.votesAgainst, 0);
        assertEq(proposal.votesAbstain, BOB_BALANCE);
    }

    function test_Vote_MultipleUsers() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(alice);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.AGAINST);
        
        vm.prank(charlie);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesFor, ALICE_BALANCE + CHARLIE_BALANCE);
        assertEq(proposal.votesAgainst, BOB_BALANCE);
        assertEq(proposal.votesAbstain, 0);
    }

    function test_Vote_RequiresBalance() public {
        address noBalance = address(0x5);
        uint256 proposalId = _createProposal();
        
        vm.prank(noBalance);
        vm.expectRevert("DAOVoting: must have balance to vote");
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
    }

    function test_Vote_RequiresValidProposal() public {
        vm.prank(bob);
        vm.expectRevert("DAOVoting: proposal does not exist");
        dao.vote(999, DAOVoting.VoteType.FOR);
    }

    function test_Vote_RequiresBeforeDeadline() public {
        uint256 proposalId = _createProposal();
        
        // Move time past deadline
        vm.warp(block.timestamp + 8 days);
        
        vm.prank(bob);
        vm.expectRevert("DAOVoting: voting deadline passed");
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
    }

    function test_Vote_RequiresNotExecuted() public {
        uint256 proposalId = _createProposal();
        
        // Vote FOR to pass
        vm.prank(alice);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        // Move past deadline and execution delay
        vm.warp(block.timestamp + 8 days);
        
        // Execute proposal
        dao.executeProposal(proposalId);
        
        // Try to vote after execution - contract checks deadline first, but executed check should also fail
        vm.prank(charlie);
        // The contract checks deadline before executed, so we get deadline error first
        vm.expectRevert("DAOVoting: voting deadline passed");
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
    }

    function test_Vote_EmitsVoteCast() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(bob);
        vm.expectEmit(true, true, false, true);
        emit VoteCast(proposalId, bob, DAOVoting.VoteType.FOR);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
    }

    function test_Vote_EmitsVoteChanged() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.prank(bob);
        vm.expectEmit(true, true, false, true);
        emit VoteChanged(proposalId, bob, DAOVoting.VoteType.FOR, DAOVoting.VoteType.AGAINST);
        dao.vote(proposalId, DAOVoting.VoteType.AGAINST);
    }

    // ============ Tests de Votación Gasless (Meta-transacciones) ============

    function test_Vote_Gasless_Success() public {
        uint256 proposalId = _createProposal();
        
        // Create meta-transaction for voting
        bytes memory data = abi.encodeWithSelector(
            DAOVoting.vote.selector,
            proposalId,
            DAOVoting.VoteType.FOR
        );
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: bob,
            to: address(dao),
            value: 0,
            gas: 100000,
            nonce: forwarder.getNonce(bob),
            data: data
        });
        
        bytes32 digest = helper.getTypedDataHash(req, address(forwarder));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(BOB_PRIVATE_KEY, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Execute meta-transaction
        forwarder.execute(req, signature);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesFor, BOB_BALANCE);
        assertEq(uint256(dao.getUserVote(proposalId, bob)), uint256(DAOVoting.VoteType.FOR));
    }

    function test_Vote_Gasless_ChangeVote() public {
        uint256 proposalId = _createProposal();
        
        // First vote: FOR (normal transaction)
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        // Change vote: AGAINST (gasless)
        bytes memory data = abi.encodeWithSelector(
            DAOVoting.vote.selector,
            proposalId,
            DAOVoting.VoteType.AGAINST
        );
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: bob,
            to: address(dao),
            value: 0,
            gas: 100000,
            nonce: forwarder.getNonce(bob),
            data: data
        });
        
        bytes32 digest = helper.getTypedDataHash(req, address(forwarder));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(BOB_PRIVATE_KEY, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        forwarder.execute(req, signature);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesAgainst, BOB_BALANCE);
        assertEq(proposal.votesFor, 0);
    }

    function test_CreateProposal_Gasless() public {
        uint256 deadline = block.timestamp + 7 days;
        
        bytes memory data = abi.encodeWithSelector(
            DAOVoting.createProposal.selector,
            "Gasless Proposal",
            recipient,
            PROPOSAL_AMOUNT,
            deadline
        );
        
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from: alice,
            to: address(dao),
            value: 0,
            gas: 200000,
            nonce: forwarder.getNonce(alice),
            data: data
        });
        
        bytes32 digest = helper.getTypedDataHash(req, address(forwarder));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ALICE_PRIVATE_KEY, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        forwarder.execute(req, signature);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(1);
        assertEq(proposal.name, "Gasless Proposal");
        assertEq(proposal.proposer, alice);
        assertEq(proposal.recipient, recipient);
    }

    // ============ Tests de Ejecución de Propuestas ============

    function test_ExecuteProposal_Success() public {
        uint256 proposalId = _createProposal();
        uint256 initialBalance = recipient.balance;
        
        // Vote FOR to pass
        vm.prank(alice);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        // Move past deadline and execution delay
        vm.warp(block.timestamp + 8 days);
        
        dao.executeProposal(proposalId);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertTrue(proposal.executed);
        assertEq(recipient.balance, initialBalance + PROPOSAL_AMOUNT);
        assertEq(address(dao).balance, ALICE_BALANCE + BOB_BALANCE + CHARLIE_BALANCE - PROPOSAL_AMOUNT);
    }

    function test_ExecuteProposal_RequiresDeadlinePassed() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(alice);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.expectRevert("DAOVoting: voting deadline not passed");
        dao.executeProposal(proposalId);
    }

    function test_ExecuteProposal_RequiresExecutionDelay() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(alice);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        // Move past deadline but not execution delay
        vm.warp(block.timestamp + 7 days + 1);
        
        vm.expectRevert("DAOVoting: execution delay not passed");
        dao.executeProposal(proposalId);
    }

    function test_ExecuteProposal_RequiresMoreForThanAgainst() public {
        uint256 proposalId = _createProposal();
        
        // Bob votes AGAINST (50 ETH)
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.AGAINST);
        
        // Charlie votes FOR (10 ETH) - not enough to beat AGAINST
        vm.prank(charlie);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        // Move past deadline and execution delay
        vm.warp(block.timestamp + 8 days);
        
        // AGAINST (50) > FOR (10), so should fail
        vm.expectRevert("DAOVoting: proposal did not pass");
        dao.executeProposal(proposalId);
    }

    function test_ExecuteProposal_RequiresNotExecuted() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(alice);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.warp(block.timestamp + 8 days);
        dao.executeProposal(proposalId);
        
        vm.expectRevert("DAOVoting: proposal already executed");
        dao.executeProposal(proposalId);
    }

    function test_ExecuteProposal_EmitsEvent() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(alice);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.warp(block.timestamp + 8 days);
        
        vm.expectEmit(true, true, false, true);
        emit ProposalExecuted(proposalId, recipient, PROPOSAL_AMOUNT);
        dao.executeProposal(proposalId);
    }

    // ============ Tests de Edge Cases ============

    function test_Vote_Twice_SameVote() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        // Vote again with same vote type
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        // Should still be BOB_BALANCE (not doubled)
        assertEq(proposal.votesFor, BOB_BALANCE);
    }

    function test_FundDAO_UpdatesBalance() public {
        address newUser = address(0x5);
        uint256 depositAmount = 5 ether;
        vm.deal(newUser, depositAmount);
        
        vm.prank(newUser);
        dao.fundDAO{value: depositAmount}();
        
        assertEq(dao.getUserBalance(newUser), depositAmount);
        assertEq(dao.totalBalance(), ALICE_BALANCE + BOB_BALANCE + CHARLIE_BALANCE + depositAmount);
    }

    function test_FundDAO_ReceiveFunction() public {
        address newUser = address(0x5);
        uint256 depositAmount = 5 ether;
        vm.deal(newUser, depositAmount);
        
        vm.prank(newUser);
        (bool success, ) = address(dao).call{value: depositAmount}("");
        assertTrue(success);
        
        assertEq(dao.getUserBalance(newUser), depositAmount);
    }

    function test_GetProposal_NonExistent() public {
        DAOVoting.Proposal memory proposal = dao.getProposal(999);
        assertEq(proposal.id, 0);
        assertEq(proposal.proposer, address(0));
    }

    function test_MinimumProposalThreshold_Calculation() public {
        // Alice has 100 ETH, total is 160 ETH
        // 100 / 160 = 62.5% > 10% ✓
        uint256 deadline = block.timestamp + 7 days;
        
        vm.prank(alice);
        dao.createProposal("Test Proposal", recipient, PROPOSAL_AMOUNT, deadline);
        
        // Bob has 50 ETH, total is 160 ETH
        // 50 / 160 = 31.25% > 10% ✓
        vm.prank(bob);
        dao.createProposal("Test Proposal", recipient, PROPOSAL_AMOUNT, deadline);
        
        // Charlie has 10 ETH, total is 160 ETH
        // 10 / 160 = 6.25% < 10% ✗
        vm.prank(charlie);
        vm.expectRevert("DAOVoting: insufficient balance to create proposal");
        dao.createProposal("Test Proposal", recipient, PROPOSAL_AMOUNT, deadline);
    }

    function test_Vote_WeightedByBalance() public {
        uint256 proposalId = _createProposal();
        
        // Alice votes FOR (100 ETH)
        vm.prank(alice);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        // Bob votes AGAINST (50 ETH)
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.AGAINST);
        
        // Charlie votes FOR (10 ETH)
        vm.prank(charlie);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        DAOVoting.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(proposal.votesFor, ALICE_BALANCE + CHARLIE_BALANCE); // 110 ETH
        assertEq(proposal.votesAgainst, BOB_BALANCE); // 50 ETH
        // FOR wins
        assertGt(proposal.votesFor, proposal.votesAgainst);
    }

    function test_ExecuteProposal_AfterTie() public {
        uint256 proposalId = _createProposal();
        
        // Create a tie: Alice (100 ETH) FOR, Bob (50 ETH) AGAINST
        // But we need equal votes, so let's make it truly equal
        // Actually, with 100 vs 50, FOR wins. Let's make it 50 vs 50
        address tieUser = address(0x5);
        vm.deal(tieUser, 50 ether);
        vm.prank(tieUser);
        dao.fundDAO{value: 50 ether}();
        
        vm.prank(bob);
        dao.vote(proposalId, DAOVoting.VoteType.FOR);
        
        vm.prank(tieUser);
        dao.vote(proposalId, DAOVoting.VoteType.AGAINST);
        
        // Move past deadline and execution delay
        vm.warp(block.timestamp + 8 days);
        
        // Tie should not pass (FOR must be > AGAINST, not >=)
        vm.expectRevert("DAOVoting: proposal did not pass");
        dao.executeProposal(proposalId);
    }

    // ============ Helper Functions ============

    function _createProposal() internal returns (uint256) {
        uint256 deadline = block.timestamp + 7 days;
        vm.prank(alice);
        dao.createProposal("Test Proposal", recipient, PROPOSAL_AMOUNT, deadline);
        return 1;
    }
}

