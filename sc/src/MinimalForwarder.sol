// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title MinimalForwarder
 * @dev Minimal forwarder for EIP-2771 meta-transactions
 * This contract acts as a relayer that validates off-chain signatures
 * and executes transactions on behalf of users.
 */
contract MinimalForwarder is EIP712 {
    using ECDSA for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
    }

    bytes32 private constant _TYPEHASH =
        keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)");

    mapping(address => uint256) private _nonces;

    event MetaTransactionExecuted(address indexed from, address indexed to, bool success);

    constructor() EIP712("MinimalForwarder", "0.0.1") {}

    /**
     * @dev Get the current nonce for a user
     * @param from The address to get the nonce for
     * @return The current nonce
     */
    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    /**
     * @dev Verify the signature and data of a meta-transaction
     * @param req The forward request
     * @param signature The signature to verify
     * @return true if the signature is valid, false otherwise
     */
    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        address signer = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    _TYPEHASH,
                    req.from,
                    req.to,
                    req.value,
                    req.gas,
                    req.nonce,
                    keccak256(req.data)
                )
            )
        ).recover(signature);

        return _nonces[req.from] == req.nonce && signer == req.from;
    }

    /**
     * @dev Execute a validated meta-transaction
     * @param req The forward request
     * @param signature The signature to verify
     * @return success Whether the call succeeded
     * @return ret The return data from the call
     */
    function execute(
        ForwardRequest calldata req,
        bytes calldata signature
    ) external payable returns (bool success, bytes memory ret) {
        // Verify the signature
        require(verify(req, signature), "MinimalForwarder: signature does not match request");

        // Check nonce
        require(_nonces[req.from] == req.nonce, "MinimalForwarder: nonce mismatch");

        // Increment nonce to prevent replay attacks
        _nonces[req.from]++;

        // Execute the call
        (success, ret) = req.to.call{value: req.value, gas: req.gas}(
            abi.encodePacked(req.data, req.from)
        );

        emit MetaTransactionExecuted(req.from, req.to, success);
    }
}

