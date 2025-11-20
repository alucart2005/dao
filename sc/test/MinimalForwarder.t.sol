// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";
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

contract MinimalForwarderTest is Test {
    using ECDSA for bytes32;

    MinimalForwarder public forwarder;
    
    uint256 public constant SIGNER_PRIVATE_KEY = 0xA11CE;
    address public signer;
    
    address public target = address(0x1234);
    uint256 public constant CALL_VALUE = 1 ether;

    event MetaTransactionExecuted(address indexed from, address indexed to, bool success);

    MinimalForwarderHelper public helper;
    
    function setUp() public {
        forwarder = new MinimalForwarder();
        helper = new MinimalForwarderHelper();
        signer = vm.addr(SIGNER_PRIVATE_KEY);
        vm.deal(address(forwarder), 10 ether);
    }

    // ============ Tests de getNonce ============

    function test_GetNonce_InitialValue() public {
        assertEq(forwarder.getNonce(signer), 0);
    }

    function test_GetNonce_IncrementsAfterExecute() public {
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        bytes memory signature = _signRequest(req);
        
        forwarder.execute(req, signature);
        
        assertEq(forwarder.getNonce(signer), 1);
    }

    // ============ Tests de verify ============

    function test_Verify_ValidSignature() public {
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        bytes memory signature = _signRequest(req);
        
        assertTrue(forwarder.verify(req, signature));
    }

    function test_Verify_InvalidSignature() public {
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        bytes memory signature = "invalid signature";
        
        // ECDSA throws for invalid signature length, so verify will revert
        vm.expectRevert();
        forwarder.verify(req, signature);
    }

    function test_Verify_WrongNonce() public {
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        bytes memory signature = _signRequest(req);
        
        // Execute once to increment nonce
        forwarder.execute(req, signature);
        
        // Try to verify with old nonce
        assertFalse(forwarder.verify(req, signature));
    }

    function test_Verify_WrongSigner() public {
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        req.from = address(0x999); // Different address
        bytes memory signature = _signRequest(req);
        
        assertFalse(forwarder.verify(req, signature));
    }

    // ============ Tests de execute ============

    function test_Execute_Success() public {
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        bytes memory signature = _signRequest(req);
        
        vm.expectEmit(true, true, false, true);
        emit MetaTransactionExecuted(signer, target, true);
        
        (bool success, ) = forwarder.execute(req, signature);
        assertTrue(success);
    }

    function test_Execute_IncrementsNonce() public {
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        bytes memory signature = _signRequest(req);
        
        uint256 nonceBefore = forwarder.getNonce(signer);
        forwarder.execute(req, signature);
        uint256 nonceAfter = forwarder.getNonce(signer);
        
        assertEq(nonceAfter, nonceBefore + 1);
    }

    function test_Execute_ReplayAttack_Prevented() public {
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        bytes memory signature = _signRequest(req);
        
        // Execute first time
        forwarder.execute(req, signature);
        
        // Try to execute again with same signature (replay attack)
        // The verify function checks nonce first, so it will fail with signature mismatch
        // because the nonce in the request doesn't match the current nonce
        vm.expectRevert("MinimalForwarder: signature does not match request");
        forwarder.execute(req, signature);
    }

    function test_Execute_InvalidSignature_Reverts() public {
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        bytes memory signature = "invalid signature";
        
        // ECDSA throws ECDSAInvalidSignatureLength for invalid signature length
        vm.expectRevert();
        forwarder.execute(req, signature);
    }

    function test_Execute_WithValue() public {
        uint256 initialBalance = target.balance;
        MinimalForwarder.ForwardRequest memory req = _createRequest();
        req.value = CALL_VALUE;
        bytes memory signature = _signRequest(req);
        
        forwarder.execute{value: CALL_VALUE}(req, signature);
        
        assertEq(target.balance, initialBalance + CALL_VALUE);
    }

    function test_Execute_MultipleRequests() public {
        // Execute first request
        MinimalForwarder.ForwardRequest memory req1 = _createRequest();
        bytes memory signature1 = _signRequest(req1);
        forwarder.execute(req1, signature1);
        
        // Execute second request with incremented nonce
        MinimalForwarder.ForwardRequest memory req2 = _createRequest();
        req2.nonce = 1;
        bytes memory signature2 = _signRequest(req2);
        forwarder.execute(req2, signature2);
        
        assertEq(forwarder.getNonce(signer), 2);
    }

    function test_Execute_DifferentUsers() public {
        uint256 aliceKey = 0xA11CE;
        uint256 bobKey = 0xB0B;
        address aliceAddr = vm.addr(aliceKey);
        address bobAddr = vm.addr(bobKey);
        
        // Alice's request
        MinimalForwarder.ForwardRequest memory req1 = MinimalForwarder.ForwardRequest({
            from: aliceAddr,
            to: target,
            value: 0,
            gas: 100000,
            nonce: 0,
            data: abi.encodeWithSignature("test()")
        });
        bytes32 digest1 = helper.getTypedDataHash(req1, address(forwarder));
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(aliceKey, digest1);
        
        // Bob's request
        MinimalForwarder.ForwardRequest memory req2 = MinimalForwarder.ForwardRequest({
            from: bobAddr,
            to: target,
            value: 0,
            gas: 100000,
            nonce: 0,
            data: abi.encodeWithSignature("test()")
        });
        bytes32 digest2 = helper.getTypedDataHash(req2, address(forwarder));
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(bobKey, digest2);
        
        forwarder.execute(req1, abi.encodePacked(r1, s1, v1));
        forwarder.execute(req2, abi.encodePacked(r2, s2, v2));
        
        assertEq(forwarder.getNonce(aliceAddr), 1);
        assertEq(forwarder.getNonce(bobAddr), 1);
    }

    // ============ Helper Functions ============

    function _createRequest() internal view returns (MinimalForwarder.ForwardRequest memory) {
        return MinimalForwarder.ForwardRequest({
            from: signer,
            to: target,
            value: 0,
            gas: 100000,
            nonce: forwarder.getNonce(signer),
            data: abi.encodeWithSignature("test()")
        });
    }

    function _signRequest(MinimalForwarder.ForwardRequest memory req) internal view returns (bytes memory) {
        bytes32 digest = helper.getTypedDataHash(req, address(forwarder));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PRIVATE_KEY, digest);
        return abi.encodePacked(r, s, v);
    }
}

